import { BaseAuthHandler } from "../handlers/BaseAuthHandler";
import { ICommandArguments, IHandlerParameters } from "../../../../cmd";
import { ISession, AbstractSession, SessConstants } from "../../../../rest";
import { Imperative } from "../../Imperative";

class FakeAuthHandler extends BaseAuthHandler {
    public mProfileType: string = "base";

    public mDefaultTokenType: SessConstants.TOKEN_TYPE_CHOICES = SessConstants.TOKEN_TYPE_JWT;

    protected createSessCfgFromArgs(args: ICommandArguments): ISession {
        return { hostname: "fakeHost" };
    }

    protected async doLogin(session: AbstractSession): Promise<string> {
        return session.ISession.tokenValue;
    }

    protected async doLogout(session: AbstractSession): Promise<void> { /* Do nothing */ }
}

describe("BaseAuthHandler", () => {
    beforeAll(() => {
        Object.defineProperty(Imperative, "api", {
            get: () => ({
                profileManager: (profType) => ({
                    save: jest.fn(),
                    update: jest.fn()
                })
            })
        });
    });

    it("should process login successfully", async () => {
        const handler = new FakeAuthHandler();
        const params: IHandlerParameters = {
            response: {
                console: {
                    log: jest.fn()
                }
            },
            arguments: {
                user: "fakeUser",
                password: "fakePass"
            },
            positionals: ["auth", "login"],
            profiles: {
                getMeta: jest.fn(() => ({
                    name: "fakeName"
                }))
            }
        } as any;

        const doLoginSpy = jest.spyOn(handler as any, "doLogin");
        let caughtError;

        try {
            await handler.process(params);
        } catch (error) {
            caughtError = error;
        }

        expect(caughtError).toBeUndefined();
        expect(doLoginSpy).toBeCalledTimes(1);
    });

    it("should process logout successfully", async () => {
        const handler = new FakeAuthHandler();
        const params: IHandlerParameters = {
            response: {
                console: {
                    log: jest.fn()
                }
            },
            arguments: {
                tokenType: handler.mDefaultTokenType,
                tokenValue: "fakeToken"
            },
            positionals: ["auth", "logout"],
            profiles: {
                getMeta: jest.fn(() => ({
                    name: "fakeName"
                }))
            }
        } as any;

        const doLogoutSpy = jest.spyOn(handler as any, "doLogout");
        let caughtError;

        try {
            await handler.process(params);
        } catch (error) {
            caughtError = error;
        }

        expect(caughtError).toBeUndefined();
        expect(doLogoutSpy).toBeCalledTimes(1);
    });

    it("should fail to process invalid action name", async () => {
        const handler = new FakeAuthHandler();
        const params: IHandlerParameters = {
            response: {
                console: {
                    log: jest.fn()
                }
            },
            arguments: {},
            positionals: ["auth", "invalid"],
            profiles: {
                getMeta: jest.fn(() => ({
                    name: "fakeName"
                }))
            }
        } as any;

        let caughtError;

        try {
            await handler.process(params);
        } catch (error) {
            caughtError = error;
        }

        expect(caughtError).toBeDefined();
        expect(caughtError.message).toContain(`The group name "invalid"`);
        expect(caughtError.message).toContain("is not valid");
    });
});
