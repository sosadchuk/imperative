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

import { ICommandDefinition } from "../../../../../cmd";
import { join } from "path";

/**
 * Definition of the paths command.
 * @type {ICommandDefinition}
 */
export const getDefinition: ICommandDefinition = {
    name: "get",
    type: "command",
    handler: join(__dirname, "get.handler"),
    summary: "gets a configuration path value",
    description: "Gets and displays values and locations for a configuration path.",
    positionals: [
        {
            name: "property",
            description: "The config property to list.",
            type: "string",
            required: false
        }
    ],
    options: [
        {
            name: "all",
            aliases: ["a"],
            description: "Get all config properties",
            type: "boolean"
        }
    ]
};
