import express from 'express';
import http from 'http';

import {
    Router,
    SuccessResponse,
    ExpectedErrorResponse,
    HttpCodes,
    RESTClient,
    UnexpectedErrorResponse,
    isSucess,
    isExpectedError,
    isUnexpectedError
} from '../lib/RESTClient';

const app = express();
const TEST_PATH = "/test"

app.use(express.json());


interface ITestGetResponse {
    message: string;
}

const TestGetResponse: ITestGetResponse = {
    message: "sucess get"
}

app.get(
    TEST_PATH,
    (req: express.Request, res: express.Response) => {
        return res.send(TestGetResponse);
    });

interface ITestPostRequest {
    message: string;
};

const TestPostRequest: ITestPostRequest = {
    message: "post"
}

interface ITestPostResponse {
    message: string;
    request: ITestPostRequest;
}

const TestPostResponse: ITestPostResponse = {
    message: "sucess post",
    request: TestPostRequest,
}

app.post(
    TEST_PATH,
    (req: express.Request, res: express.Response) => {
        return res.send(
            {
                message: "sucess post",
                request: req.body
            }
        );
    }
)

interface ITestUpdateRequest {
    message: string;
};

const TestUpdateRequest: ITestUpdateRequest = {
    message: "update"
}

interface ITestUpdateResponse {
    message: string;
    request: ITestUpdateRequest;
}

const TestUpdateResponse: ITestUpdateResponse = {
    message: "sucess update",
    request: TestUpdateRequest,
}

app.patch(
    TEST_PATH,
    (req: express.Request, res: express.Response) => {
        return res.send(
            {
                message: "sucess update",
                request: req.body
            }
        );
    }
)

interface ITestDeleteResponse {
    message: string;
}

const TestDeleteResponse: ITestDeleteResponse = {
    message: "sucess delete"
}

app.delete(
    TEST_PATH,
    (req: express.Request, res: express.Response) => {
        return res.send(TestDeleteResponse);
    });

app.get(
    "/error/:errorCode",
    (req: express.Request, res: express.Response) => {
        res.statusCode = parseInt(req.params.errorCode, 10);
        return res.send({
            'message': "error"
        })
    });


const PORT = 3000;
const server = http.createServer(app);

const CLIENT_NAME = "Test API";
const API_URL = "http://localhost:" + PORT;

describe('integration test', () => {
    const client = new RESTClient(
        CLIENT_NAME,
        API_URL
    );

    beforeAll(() => {
        server.listen(PORT)
    })

    afterAll(() => {
        server.close()
    })

    describe('get', () => {
        const StatusCodes = [] as const;
        type StatusCodesTuple = typeof StatusCodes;
        type TStatusCodes = StatusCodesTuple[number];

        type TRouter = Router<ITestGetResponse, TStatusCodes>;
        type TResponse = SuccessResponse<ITestGetResponse>;

        test('test get common', async () => {

            const router: TRouter = await client.get<ITestGetResponse, TStatusCodes>(TEST_PATH, StatusCodes);
            const route = router.routing({
                success: (response: TResponse) => {
                    expect(response.data).toStrictEqual(TestGetResponse)
                },
                expectedError: {},
                unexpectedError: (response: UnexpectedErrorResponse) => {
                    fail("Invalid routing")
                }
            });
            if (isSucess(route)) {
                route.func(route.response);
            } else if (isExpectedError(route)) {
                route.func(route.response);
            } else if (isUnexpectedError(route)) {
                route.func(route.response);
            } else {
                fail("Invalid match")
            }
        });
    });


    describe('post', () => {
        const StatusCodes = [] as const;
        type StatusCodesTuple = typeof StatusCodes;
        type TStatusCodes = StatusCodesTuple[number];

        type TRouter = Router<ITestPostResponse, TStatusCodes>;
        type TResponse = SuccessResponse<ITestPostResponse>;

        test('test post common', async () => {
            const router: TRouter = await client.create<ITestPostRequest, ITestPostResponse, TStatusCodes>(TEST_PATH, TestPostRequest, StatusCodes);
            const route = router.routing({
                success: (response: TResponse) => {
                    expect(response.data).toStrictEqual(TestPostResponse)
                },
                expectedError: {},
                unexpectedError: (response: UnexpectedErrorResponse) => {
                    fail("Invalid routing")
                }
            })

            if (isSucess(route)) {
                route.func(route.response);
            } else if (isExpectedError(route)) {
                route.func(route.response);
            } else if (isUnexpectedError(route)) {
                route.func(route.response);
            } else {
                fail("Invalid match")
            };
        })
    });

    describe('update', () => {
        const StatusCodes = [] as const;
        type StatusCodesTuple = typeof StatusCodes;
        type TStatusCodes = StatusCodesTuple[number];

        type TRouter = Router<ITestUpdateResponse, TStatusCodes>;
        type TResponse = SuccessResponse<ITestUpdateResponse>;

        test('test update common', async () => {
            const router: TRouter = await client.update<ITestUpdateRequest, ITestUpdateResponse, TStatusCodes>(TEST_PATH, TestUpdateRequest, StatusCodes);
            const route = router.routing({
                success: (response: TResponse) => {
                    expect(response.data).toStrictEqual(TestUpdateResponse)
                },
                expectedError: {},
                unexpectedError: (response: UnexpectedErrorResponse) => {
                    fail("Invalid routing")
                }
            });

            if (isSucess(route)) {
                route.func(route.response);
            } else if (isExpectedError(route)) {
                route.func(route.response);
            } else if (isUnexpectedError(route)) {
                route.func(route.response);
            } else {
                fail("Invalid match")
            };
        })
    });

    describe('delete', () => {
        const StatusCodes = [] as const;
        type StatusCodesTuple = typeof StatusCodes;
        type TStatusCodes = StatusCodesTuple[number];

        type TRouter = Router<ITestDeleteResponse, TStatusCodes>;
        type TResponse = SuccessResponse<ITestDeleteResponse>;

        test('test delete common', async () => {
            const router: TRouter = await client.del<ITestDeleteResponse, TStatusCodes>(TEST_PATH, StatusCodes);
            const route = router.routing({
                success: (response: TResponse) => {
                    expect(response.data).toStrictEqual(TestDeleteResponse)
                },
                expectedError: {},
                unexpectedError: (response: UnexpectedErrorResponse) => {
                    fail("Invalid routing")
                }
            });

            if (isSucess(route)) {
                route.func(route.response);
            } else if (isExpectedError(route)) {
                route.func(route.response);
            } else if (isUnexpectedError(route)) {
                route.func(route.response);
            } else {
                fail("Invalid match")
            };
        })
    });

    describe('expected error', () => {
        const StatusCodes = [
            HttpCodes.NotFound,
            HttpCodes.InternalServerError,
        ] as const;
        type StatusCodesTuple = typeof StatusCodes;
        type TStatusCodes = StatusCodesTuple[number];

        type TRouter = Router<ITestGetResponse, TStatusCodes>;
        type TResponse = SuccessResponse<ITestGetResponse>;
        type TExpectedErrorResponse = ExpectedErrorResponse<TStatusCodes>;

        test('test expected error routing', async () => {
            for (const statusCode of StatusCodes) {
                const router: TRouter = await client.get<ITestGetResponse, TStatusCodes>("/error/" + statusCode, StatusCodes);
                const route = router.routing({
                    success: (response: TResponse) => {
                        fail("Invalid routing")
                    },
                    expectedError: {
                        404: (response: TExpectedErrorResponse) => {
                            expect(response.statusCode).toEqual(statusCode);
                        },
                        500: (response: TExpectedErrorResponse) => {
                            expect(response.statusCode).toEqual(statusCode);
                        }
                    },
                    unexpectedError: (response: UnexpectedErrorResponse) => {
                        fail("Invalid routing")
                    }
                });
                if (isSucess(route)) {
                    route.func(route.response);
                } else if (isExpectedError(route)) {
                    route.func(route.response);
                } else if (isUnexpectedError(route)) {
                    route.func(route.response);
                } else {
                    fail("Invalid match")
                };
            };
        });
    });

    describe('unexpected error', () => {
        const StatusCodes = [
            HttpCodes.NotFound,
            HttpCodes.InternalServerError,
        ] as const;
        type StatusCodesTuple = typeof StatusCodes;
        type TStatusCodes = StatusCodesTuple[number];

        type TRouter = Router<ITestGetResponse, TStatusCodes>;
        type TResponse = SuccessResponse<ITestGetResponse>;
        type TExpectedErrorResponse = ExpectedErrorResponse<TStatusCodes>;

        test('test expected error routing', async () => {
            const router: TRouter = await client.get<ITestGetResponse, TStatusCodes>("/error/" + HttpCodes.Forbidden, StatusCodes);
            const route = router.routing({
                success: (response: TResponse) => {
                    fail("Invalid routing")
                },
                expectedError: {
                    404: (response: TExpectedErrorResponse) => {
                        fail("Invalid routing")
                    },
                    500: (response: TExpectedErrorResponse) => {
                        fail("Invalid routing")
                    }
                },
                unexpectedError: (response: UnexpectedErrorResponse) => {
                    expect(response.statusCode).toEqual(HttpCodes.Forbidden)

                }
            });
            if (isSucess(route)) {
                route.func(route.response);
            } else if (isExpectedError(route)) {
                route.func(route.response);
            } else if (isUnexpectedError(route)) {
                route.func(route.response);
            } else {
                fail("Invalid match")
            };
        });
    });
})