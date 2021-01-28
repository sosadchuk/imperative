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

import { IConfig } from "../../../../../../../../packages/config";

export const expectedSchemaObject = {
    $schema: "https://json-schema.org/draft/2019-09/schema#",
    $version: 1,
    type: "object",
    description: "config",
    properties: {
        profiles: {
            type: "object",
            description: "named profiles config",
            patternProperties: {
                "^\\S*$": {
                    type: "object",
                    description: "a profile",
                    properties: {
                        type: {
                            description: "the profile type",
                            type: "string"
                        },
                        properties: {
                            description: "the profile properties",
                            type: "object"
                        },
                        profiles: {
                            description: "additional sub-profiles",
                            type: "object",
                            $ref: "#/properties/profiles"
                        }
                    },
                    allOf: [
                        {
                            if: {
                                properties: {
                                    type: {
                                        const: "secured"
                                    }
                                }
                            },
                            then: {
                                properties: {
                                    properties: {
                                        type: "object",
                                        title: "Test Secured Fields",
                                        description: "Test Secured Fields",
                                        properties: {
                                            info: {
                                                type: "string",
                                                description: "The info the keep in the profile."
                                            },
                                            secret: {
                                                type: "string",
                                                description: "The secret info the keep in the profile.",
                                                secure: true
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        {
                            if: {
                                properties: {
                                    type: {
                                        const: "base"
                                    }
                                }
                            },
                            then: {
                                properties: {
                                    properties: {
                                        type: "object",
                                        title: "Secure Profile",
                                        description: "Secure Profile",
                                        properties: {
                                            info: {
                                                type: "string",
                                                description: "The info the keep in the profile."
                                            },
                                            secret: {
                                                type: "string",
                                                description: "The secret info the keep in the profile.",
                                                secure: true
                                            },
                                            host: {
                                                type: "string",
                                                description: "Fruit host"
                                            },
                                            port: {
                                                type: "number",
                                                description: "Fruit port"
                                            },
                                            user: {
                                                type: "string",
                                                description: "Fruit username",
                                                secure: true
                                            },
                                            password: {
                                                type: "string",
                                                description: "Fruit password",
                                                secure: true
                                            },
                                            tokenType: {
                                                type: "string",
                                                description: "Fruit token type"
                                            },
                                            tokenValue: {
                                                type: "string",
                                                description: "Fruit token value",
                                                secure: true
                                            },
                                            authToken: {
                                                type: "string",
                                                description: "Fruit auth token value",
                                                secure: true
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    ]
                }
            }
        },
        defaults: {
            type: "object",
            description: "default profiles config",
            patternProperties: {
                "^\\S*$": {
                    type: "string",
                    description: "the type"
                }
            }
        },
        secure: {
            type: "array",
            description: "secure properties",
            items: {
                type: "string",
                description: "path to a property"
            }
        }
    }
};

export const expectedSchemaObjectNoBase = {
    $schema: "https://json-schema.org/draft/2019-09/schema#",
    $version: 1,
    type: "object",
    description: "config",
    properties: {
        profiles: {
            type: "object",
            description: "named profiles config",
            patternProperties: {
                "^\\S*$": {
                    type: "object",
                    description: "a profile",
                    properties: {
                        type: {
                            description: "the profile type",
                            type: "string"
                        },
                        properties: {
                            description: "the profile properties",
                            type: "object"
                        },
                        profiles: {
                            description: "additional sub-profiles",
                            type: "object",
                            $ref: "#/properties/profiles"
                        }
                    },
                    allOf: [
                        {
                            if: {
                                properties: {
                                    type: {
                                        const: "secured"
                                    }
                                }
                            },
                            then: {
                                properties: {
                                    properties: {
                                        type: "object",
                                        title: "Test Secured Fields",
                                        description: "Test Secured Fields",
                                        properties: {
                                            info: {
                                                type: "string",
                                                description: "The info the keep in the profile."
                                            },
                                            secret: {
                                                type: "string",
                                                description: "The secret info the keep in the profile.",
                                                secure: true
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    ]
                }
            }
        },
        defaults: {
            type: "object",
            description: "default profiles config",
            patternProperties: {
                "^\\S*$": {
                    type: "string",
                    description: "the type"
                }
            }
        },
        secure: {
            type: "array",
            description: "secure properties",
            items: {
                type: "string",
                description: "path to a property"
            }
        }
    }
};

export const expectedConfigObject: IConfig = {
    $schema: "./imperative-test-cli.schema.json",
    profiles: {
        my_base: {
            type: "base",
            properties: {}
        },
        my_profiles: {
            profiles: {
                secured: {
                    type: "secured",
                    properties: {
                        info: ""
                    }
                }
            },
            properties: {}
        }
    },
    defaults: {
        secured: "my_profiles.secured",
        base: "my_base"
    },
    plugins: [],
    secure: ["profiles.my_profiles.profiles.secured.properties.secret"]
};

export const expectedUserConfigObject: IConfig = {
    $schema: "./imperative-test-cli.schema.json",
    profiles: {
        my_base: {
            properties: {},
            type: "base"
        },
        my_profiles: {
            profiles: {
                secured: {
                    type: "secured",
                    properties: {}
                }
            },
            properties: {}
        }
    },
    defaults: {},
    plugins: [],
    secure: []
};
