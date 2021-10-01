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

import { ILoadProfile } from "../../../../../profiles";

/**
 * Profile Manager "loadProfile" input parameters. Indicates which profile to load (named or default) and if
 * not finding the profile should be considered and error, etc.
 * @export
 * @interface ICliLoadProfile
 * @extends ILoadProfile
 */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ICliLoadProfile extends ILoadProfile {}
