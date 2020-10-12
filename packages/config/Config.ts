/*
* This program and the accompanying materials are made available under the terms of the
* Eclipse Public License v2.0 which accompanies this distribution, and is available at
* https://www.eclipse.org/legal/epl-v20.html
*
* SPDX-License-Identifier: EPL-2.0
*
* Copyright Contributors to the Zowe Project.
*
*/

import { IConfig } from "./IConfig";
import { IConfigLayer } from "./IConfigLayer";
import { ImperativeError } from "../error";

import * as node_path from "path";
import * as fs from "fs";
import * as deepmerge from "deepmerge";
import { IConfigProfile } from "./IConfigProfile";
import { IConfigVault } from "./IConfigSecure";
import { IConfigOpts } from "./IConfigOpts";

enum layers {
    project_user = 0,
    project_config,
    global_user,
    global_config
};

export class Config {
    private static readonly IDENT: number = 4;

    private _app: string;
    private _paths: string[];
    private _layers: IConfigLayer[];
    private _home: string;
    private _name: string;
    private _user: string;
    private _active: {
        user: boolean;
        global: boolean
    };
    private _vault: IConfigVault;
    private _secure: boolean;

    private constructor() { }

    public static load(app: string, opts?: IConfigOpts): Config {
        opts = opts || {};

        ////////////////////////////////////////////////////////////////////////
        // Create the basic empty configuration
        const _ = new Config();
        (_ as any).config = {};
        _._layers = [];
        _._home = node_path.join(require("os").homedir(), `.${app}`);
        _._paths = [];
        _._name = `${app}.config.json`;
        _._user = `${app}.config.user.json`;
        _._active = { user: false, global: false };
        _._app = app;
        _._vault = opts.vault;
        _._secure = false;

        ////////////////////////////////////////////////////////////////////////
        // Populate configuration file layers
        const home = require('os').homedir();
        const properties: IConfig = {
            profiles: {},
            defaults: {},
            plugins: [],
            secure: []
        };

        // Find/create project user layer
        let user = Config.search(_._user, { stop: home });
        if (user == null)
            user = node_path.join(process.cwd(), _._user);
        _._paths.push(user);
        _._layers.push({ path: user, exists: false, properties, global: false, user: true });

        // Find/create project layer
        let project = Config.search(_._name, { stop: home });
        if (project == null)
            project = node_path.join(process.cwd(), _._name);
        _._paths.push(project);
        _._layers.push({ path: project, exists: false, properties, global: false, user: false });

        // create the user layer
        const usrGlbl = node_path.join(_._home, _._user);
        _._paths.push(usrGlbl);
        _._layers.push({ path: usrGlbl, exists: false, properties, global: true, user: true });

        // create the global layer
        const glbl = node_path.join(_._home, _._name);
        _._paths.push(glbl);
        _._layers.push({ path: glbl, exists: false, properties, global: true, user: false });

        ////////////////////////////////////////////////////////////////////////
        // Read and populate each configuration layer
        try {
            let setActive = true;
            _._layers.forEach((layer: IConfigLayer) => {
                // Attempt to popluate the layer
                if (fs.existsSync(layer.path)) {
                    try {
                        layer.properties = JSON.parse(fs.readFileSync(layer.path).toString());
                        layer.exists = true;
                    } catch (e) {
                        throw new ImperativeError({ msg: `${layer.path}: ${e.message}` });
                    }
                }

                // Find the active layer
                if (setActive && layer.exists) {
                    _._active.user = layer.user;
                    _._active.global = layer.global;
                    setActive = false;
                }

                // Populate any undefined defaults
                layer.properties.defaults = layer.properties.defaults || {};
                layer.properties.profiles = layer.properties.profiles || {};
                layer.properties.plugins = layer.properties.plugins || [];
            });
        } catch (e) {
            throw new ImperativeError({ msg: `error reading config file: ${e.message}` });
        }

        ////////////////////////////////////////////////////////////////////////
        // Complete
        return _;
    }

    get api() {
        // tslint:disable-next-line
        const outer = this;

        return new class {

            // tslint:disable-next-line
            public profiles = new class {

                public get(path: string, opts?: { active?: boolean }): IConfigProfile {
                    opts = opts || {};
                    return outer.findProfile(path, (opts.active) ?
                        JSON.parse(JSON.stringify(outer.activeLayer().properties.profiles)) :
                        JSON.parse(JSON.stringify(outer.properties.profiles)));
                }

                public set(path: string, profile: IConfigProfile): void {
                    profile.properties = profile.properties || {};
                    const layer = outer.activeLayer();
                    const segments: string[] = path.split(".");
                    let p: any = layer.properties;
                    for (let x = 0; x < segments.length; x++) {
                        const segment = segments[x];
                        if (p.profiles == null)
                            p.profiles = {};
                        if (p.profiles[segment] == null)
                            p.profiles[segment] = { properties: {} };
                        if (x === segments.length - 1)
                            p.profiles[segment] = profile;
                        p = p.profiles[segment];
                    }
                }

                public build(path: string, opts?: { active?: boolean }): { [key: string]: string } {
                    opts = opts || {};
                    return outer.buildProfile(path, (opts.active) ?
                        JSON.parse(JSON.stringify(outer.activeLayer().properties.profiles)) :
                        JSON.parse(JSON.stringify(outer.properties.profiles)));
                }

                public exists(path: string): boolean {
                    return (outer.findProfile(path, outer.properties.profiles) != null);
                }

                public names(): string[] {
                    return Object.keys(outer.properties.profiles);
                }

                public defaultSet(key: string, value: string) {
                    outer.activeLayer().properties.defaults[key] = value;
                }

                public defaultGet(key: string): { name: string, profile: IConfigProfile } {
                    const dflt = outer.properties.defaults[key];
                    if (dflt == null || !this.exists(dflt))
                        return null;
                    return { name: dflt, profile: this.get(dflt) };
                }

                public defaultBuild(key: string): { [key: string]: string } {
                    const dflt = outer.properties.defaults[key];
                    if (dflt == null || !this.exists(dflt))
                        return null;
                    return this.build(dflt);
                }

            }(); // end of profiles inner class

            // tslint:disable-next-line
            public plugins = new class {

                public get(): string[] {
                    return outer.properties.plugins;
                }
            }(); // end of plugins inner class

            // tslint:disable-next-line
            public layers = new class {

                public write() {
                    const layer: IConfigLayer = JSON.parse(JSON.stringify(outer.activeLayer()));

                    // If fields are marked as secure
                    if (layer.properties.secure != null && outer._secure) {
                        for (const path of layer.properties.secure) {
                            const segments = path.split(".");
                            let obj: any = layer.properties;
                            for (let x = 0; x < segments.length; x++) {
                                const segment = segments[x];
                                const v = obj[segment];
                                if (v == null) break;
                                if (x === segments.length - 1) {
                                    obj[segment] = `managed by ${outer._vault.name}`;
                                    break;
                                }
                                obj = obj[segment];
                            }
                        }
                    }

                    // Write the layer
                    try {
                        fs.writeFileSync(layer.path, JSON.stringify(layer.properties, null, Config.IDENT));
                    } catch (e) {
                        throw new ImperativeError({ msg: `error writing "${layer.path}": ${e.message}` });
                    }
                    layer.exists = true;
                }

                public activate(user: boolean, global: boolean) {
                    outer._active.user = user;
                    outer._active.global = global;
                }

                public get(): IConfigLayer {
                    return JSON.parse(JSON.stringify(outer.activeLayer()));
                }

                public set(cnfg: IConfig) {
                    for (const i in outer._layers) {
                        if (outer._layers[i].user === outer._active.user &&
                            outer._layers[i].global === outer._active.global) {
                            outer._layers[i].properties = cnfg;
                            outer._layers[i].properties.defaults = outer._layers[i].properties.defaults || {};
                            outer._layers[i].properties.profiles = outer._layers[i].properties.profiles || {};
                            outer._layers[i].properties.plugins = outer._layers[i].properties.plugins || [];
                        }
                    }
                }
            }(); // end of layers inner class

            // tslint:disable-next-line
            public secure = new class {

                public async load() {
                    // If the secure option is set - load the secure values for the profiles
                    if (outer._vault != null) {
                        for (const layer of outer.layers) {
                            if (layer.properties.secure != null) {
                                for (const path of layer.properties.secure) {
                                    const segments = path.split(".");
                                    let obj: any = outer.activeLayer().properties;
                                    for (let x = 0; x < segments.length; x++) {
                                        const segment = segments[x];
                                        if (x === segments.length - 1) {
                                            const v = await outer._vault.load(Config.secureKey(layer.path, path));
                                            if (v != null) obj[segment] = JSON.parse(v);
                                            break;
                                        }
                                        obj = obj[segment];
                                        if (obj == null) break;
                                    }
                                }
                            }
                        }
                        outer._secure = true;
                    }
                }

                public async save() {
                    if (outer._vault != null) {
                        for (const layer of outer.layers) {
                            if (layer.properties.secure != null) {
                                for (const path of layer.properties.secure) {
                                    const segments = path.split(".");
                                    let obj: any = layer.properties;
                                    for (let x = 0; x < segments.length; x++) {
                                        const segment = segments[x];
                                        const v = obj[segment];
                                        if (v == null) break;
                                        if (x === segments.length - 1) {
                                            await outer._vault.save(Config.secureKey(layer.path, path), JSON.stringify(v));
                                            break;
                                        }
                                        obj = obj[segment];
                                    }
                                }
                            }
                        }
                    }
                }

            }(); // end of secure inner class

        }(); // end of api inner class
    }

    ////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////
    // Accessors
    ////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////

    public get exists(): boolean {
        for (const layer of this._layers)
            if (layer.exists) return true;
        return false;
    }

    public get paths(): string[] {
        return this._paths
    }

    public get layers(): IConfigLayer[] {
        return JSON.parse(JSON.stringify(this._layers));
    }

    public get properties(): IConfig {
        return this.merge();
    }

    public get app(): string {
        return this._app;
    }

    ////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////
    // Generic Property Manipulation
    ////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////

    // TODO: more validation
    public set(path: string, value: any, opts?: { secure?: boolean, append?: boolean }) {
        opts = opts || {};

        // TODO: additional validations
        if (path.startsWith("group") && !Array.isArray(value))
            throw new ImperativeError({ msg: `group property must be an array` });

        // TODO: make a copy and validate that the update would be legit
        // TODO: based on schema
        const layer = this.activeLayer();
        let obj: any = layer.properties;
        const segments = path.split(".");
        path.split(".").forEach((segment: string) => {
            if (obj[segment] == null && segments.indexOf(segment) < segments.length - 1) {
                obj[segment] = {};
                obj = obj[segment];
            } else if (segments.indexOf(segment) === segments.length - 1) {

                // TODO: add ability to escape these values to string
                if (value === "true")
                    value = true;
                if (value === "false")
                    value = false;
                if (!isNaN(value) && !isNaN(parseFloat(value)))
                    value = parseInt(value, 10);
                if (opts.append) {
                    if (!Array.isArray(obj[segment]))
                        throw new ImperativeError({ msg: `property ${path} is not an array` });
                    obj[segment].push(value);
                } else {
                    obj[segment] = value;
                }
            } else {
                obj = obj[segment];
            }
        });

        if (opts.secure)
            layer.properties.secure = Array.from(new Set(layer.properties.secure.concat([path])));
    }

    public write() {
        this.api.layers.write();
    }

    ////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////
    // Utilities
    ////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////

    public static search(file: string, opts?: any): string {
        opts = opts || {};
        if (opts.stop) opts.stop = node_path.resolve(opts.stop);
        let p = node_path.join(process.cwd(), file);
        const root = node_path.parse(process.cwd()).root;
        let prev = null;
        do {
            // this should never happen, but we'll add a check to prevent
            if (prev != null && prev === p)
                throw new ImperativeError({ msg: `internal search error: prev === p (${prev})` });
            if (fs.existsSync(p))
                return p;
            prev = p;
            p = node_path.resolve(node_path.dirname(p), "..", file);
        } while (p !== node_path.join(root, file) && opts.stop != null && node_path.dirname(p) !== opts.stop)
        return null;
    }

    private static secureKey(cnfg: string, property: string): string {
        return cnfg + "_" + property;
    }

    private buildProfile(path: string, profiles: { [key: string]: IConfigProfile }): { [key: string]: string } {
        const segments: string[] = path.split(".");
        let properties = {};
        for (const [n, p] of Object.entries(profiles)) {
            if (segments[0] === n) {
                properties = { ...properties, ...p.properties };
                if (segments.length > 1) {
                    segments.splice(0, 1);
                    properties = { ...properties, ...this.buildProfile(segments.join("."), p.profiles) };
                }
                break;
            }
        }
        return properties;
    }

    private findProfile(path: string, profiles: { [key: string]: IConfigProfile }): IConfigProfile {
        const segments: string[] = path.split(".");
        for (const [n, p] of Object.entries(profiles)) {
            if (segments.length === 1 && segments[0] === n) {
                return p;
            } else if (segments[0] === n && p.profiles != null) {
                segments.splice(0, 1);
                return this.findProfile(segments.join("."), p.profiles);
            }
        }
        return null;
    }

    private merge(): IConfig {
        const c: IConfig = {
            defaults: {},
            profiles: {},
            plugins: [],
            secure: []
        };
        // merge each layer
        this._layers.forEach((layer: IConfigLayer) => {

            // Merge "plugins" - create a unique set from all entires
            c.plugins = Array.from(new Set(layer.properties.plugins.concat(c.plugins)));

            // Merge "defaults" - only add new properties from this layer
            for (const [name, value] of Object.entries(layer.properties.defaults))
                c.defaults[name] = c.defaults[name] || value;
        });

        // Merge the project layer profiles together
        const usrProject = JSON.parse(JSON.stringify(this._layers[layers.project_user].properties.profiles));
        const project = JSON.parse(JSON.stringify(this._layers[layers.project_config].properties.profiles));
        const usr: any = deepmerge(project, usrProject);

        // Merge the global layer profiles together
        const usrGlobal = JSON.parse(JSON.stringify(this._layers[layers.global_user].properties.profiles));
        const global = JSON.parse(JSON.stringify(this._layers[layers.global_config].properties.profiles));
        const glbl: { [key: string]: IConfigProfile } = deepmerge(global, usrGlobal);

        // Traverse all the global profiles merging any missing from project profiles
        c.profiles = usr;
        for (const [n, p] of Object.entries(glbl)) {
            if (c.profiles[n] == null)
                c.profiles[n] = p;
        }

        return c;
    }

    private activeLayer(): IConfigLayer {
        for (const layer of this._layers) {
            if (layer.user === this._active.user && layer.global === this._active.global)
                return layer;
        }
        throw new ImperativeError({ msg: `internal error: no active layer found` });
    }
}