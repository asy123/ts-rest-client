# Typed Rest Client


## 概要
型システムを利用し、漏れがないようにレスポンスの処理が可能なRest API Client。
仕様書に定義されているエラーレスポンスについては個別にハンドリング可能。

## 使用方法
```typescript
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

    interface IResponse {
        // response JSON schema here ...
    }
    const StatusCodes = [
            HttpCodes.NotFound,
            HttpCodes.InternalServerError,
    ] as const;
    type StatusCodesTuple = typeof StatusCodes;
    type TStatusCodes = StatusCodesTuple[number];

    type TRouter = Router<IResponse, TStatusCodes>;
    type TResponse = SuccessResponse<IResponse>;

    const router: TRouter = await client.get<IResponse, TStatusCodes>("https://your/api/path", StatusCodes);
    const route = router.routing({
        success: (response: TResponse) => {
            // post process here
        },
        expectedError: {
            404: (response: TExpectedErrorResponse) => {
                // error handling here ...
            },
            500: (response: TExpectedErrorResponse) => {
                // error handling here ...
            }
        },
        unexpectedError: (response: UnexpectedErrorResponse) => {
            // error handling here ...
        }
    });

    if (isSucess(route)) {
        route.func(route.response);
    }else if (isExpectedError(route)) {
        route.func(route.response);
    }else if (isUnexpectedError(route)) {
        route.func(route.response);
    } else {
        throw Error("Invalid route")
    };
```
        