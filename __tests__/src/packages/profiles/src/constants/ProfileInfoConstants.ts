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

import { IImperativeConfig, IConfigLogging } from "../../../../../../packages";

export const Log4jsConfig: IConfigLogging = {
    "log4jsConfig": {
        "appenders": {
            "default": {
                "type": "fileSync",
                "layout": {
                    "type": "pattern",
                    "pattern": "[%d{yyyy/MM/dd} %d{hh:mm:ss.SSS}] [%p] %m"
                },
                "filename": "logs/imperative.log"
            },
            "imperative": {
                "type": "fileSync",
                "layout": {
                    "type": "pattern",
                    "pattern": "[%d{yyyy/MM/dd} %d{hh:mm:ss.SSS}] [%p] %m"
                },
                "filename": "logs/imperative.log"
            },
            "app": {
                "type": "fileSync",
                "layout": {
                    "type": "pattern",
                    "pattern": "[%d{yyyy/MM/dd} %d{hh:mm:ss.SSS}] [%p] %m"
                },
                "filename": "logs/test_app.log"
            }
        },
        "categories": {
            "default": {
                "appenders": ["default"],
                "level": "DEBUG"
            },
            "imperative": {
                "appenders": ["imperative"],
                "level": "DEBUG"
            },
            "app": {
                "appenders": ["app"],
                "level": "DEBUG"
            }
        }
    }
};

export const TestAppImperativeConfig: IImperativeConfig = {
    profiles: [{
        type: "test_app",
        schema: {
            type: "object",
            title: "test_app Profile",
            description: "test_app profile for testing purposes",
            properties: {
                plain: {
                    type: "string",
                    optionDefinition: {
                        name: "plain",
                        description: "plain text property",
                        type: "string",
                    }
                },
                secure: {
                    type: "string",
                    secure: true,
                    optionDefinition: {
                        name: "secure",
                        description: "secure property",
                        type: "string",
                    }
                },
                nested: {
                    type: "object",
                    optionDefinitions: [
                        {
                            name: "nested-plain",
                            description: "plain text property",
                            type: "string",
                        },
                        {
                            // TODO: Nested secure properties not able to be defined in the schema?
                            // secure: true,
                            name: "nested-secure",
                            description: "secure property",
                            type: "string",
                        },
                    ]
                },
            },
            required: []
        }
    }]
};

export const test_appConfigJson = {
    "$schema": "./test_app.schema.json",
    "profiles": {
        "test_app": {
            "type": "test_app",
            "properties": {
                "plain": "test",
                "secure": "secret",
                "nested": {
                    "nested-plain": " nested-test",
                    "nested-secure": "nested-secret"
                }
            },
            "secure": [
                "secure",
                "nested.nested-secure"
            ]
        }
    },
    "defaults": {
        "test_app": "test_app"
    },
    "autoStore": true
};

export const test_appSchemaJson = {
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "$version": 3,
    "type": "object",
    "description": "config",
    "properties": {
        "profiles": {
            "type": "object",
            "description": "named profiles config",
            "patternProperties": {
                "^\\S*$": {
                    "type": "object",
                    "description": "a profile",
                    "properties": {
                        "type": {
                            "description": "the profile type",
                            "type": "string"
                        },
                        "properties": {
                            "description": "the profile properties",
                            "type": "object"
                        },
                        "profiles": {
                            "description": "additional sub-profiles",
                            "type": "object",
                            "$ref": "#/properties/profiles"
                        },
                        "secure": {
                            "description": "secure property names",
                            "type": "array",
                            "prefixItems": {
                                "type": "string"
                            },
                            "uniqueItems": true
                        }
                    },
                    "allOf": [
                        {
                            "if": {
                                "properties": {
                                    "type": {
                                        "const": "test_app"
                                    }
                                }
                            },
                            "then": {
                                "properties": {
                                    "properties": {
                                        "type": "object",
                                        "title": "test_app Profile",
                                        "description": "test_app Profile",
                                        "properties": {
                                            "plain": {
                                                "type": "string",
                                                "description": "plain text property"
                                            },
                                            "secure": {
                                                "type": "string",
                                                "description": "secure property"
                                            },
                                            "nested": {
                                                "type": "object",
                                                "properties": {
                                                    "nested-plain": {
                                                        "type": "string",
                                                        "description": "nested plain text property"
                                                    },
                                                    "nested-secure": {
                                                        "type": "string",
                                                        "description": "nested secure property"
                                                    }
                                                }
                                            }
                                        },
                                        "required": []
                                    },
                                    "secure": {
                                        "prefixItems": {
                                            "enum": [
                                                "secure",
                                                "nested.nested-secure"
                                            ]
                                        }
                                    }
                                }
                            }
                        }
                    ]
                }
            }
        },
        "defaults": {
            "type": "object",
            "description": "default profiles config",
            "properties": {
                "test_app": {
                    "type": "string"
                }
            }
        }
    }
};
