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

import { ICommandHandler, IHandlerParameters } from "../../../../../cmd";
import { Config } from "../../../../../config";
import { ImperativeConfig } from "../../../../../utilities";
import { IConfigValueLocationPair, IConfigPropertyEntries } from "../../../../../config/src/doc/IConfigPropertyEntries";
import { IProfile } from "../../../../../profiles";
import { ImperativeError } from "../../../../../error";

/**
 * The get command group handler for cli configuration settings.
 */
export default class GetHandler implements ICommandHandler {

    /**
     * Process the command and input.
     *
     * @param {IHandlerParameters} params Parameters supplied by yargs
     *
     * @throws {ImperativeError}
     */
    public async process(params: IHandlerParameters): Promise<void> {
        const config = ImperativeConfig.instance.config;
        let response;

        if (params.arguments.all) {response = Config.findAllProperties(config);}
        else if (params.arguments.property) {response = Config.findProperty(config, params.arguments.property);}
        else {throw new ImperativeError({msg:"Missing property or --all flag for configuration search."});}


        // Get Default Profile of Type Testing
        /*
        const zosmf: string = Config.getDefaultProfileName(config, "zosmf");
        const base: string = Config.getDefaultProfileName(config, "base");
        const zosmfProfile: IProfile = Config.getProfile(config, zosmf);
        const baseProfile: IProfile = Config.getProfile(config, base);
        const combined: IProfile = Config.mergeProfiles(baseProfile, zosmfProfile);
        response = combined;
        */

        // response = await Config.getProfile(config, Config.getDefaultProfileName(config, "zosmf"));
        params.response.data.setObj(response);
        params.response.format.output({
            format: "object",
            output: response
        })
    }
}
