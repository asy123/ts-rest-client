import { Record } from "immutable";
import * as restmHandlers from "typed-rest-client/Handlers";
import * as restmHttpClient from "typed-rest-client/HttpClient";
import * as restm from "typed-rest-client/RestClient";

export { HttpCodes } from "typed-rest-client/HttpClient";

export class Response<T, S extends restmHttpClient.HttpCodes> {
  public readonly statusCode: S;
  public readonly data: T;

  constructor(statusCode: S, data: T) {
    this.statusCode = statusCode;
    this.data = data;
  }
}

export type TStatusCodes = Readonly<restmHttpClient.HttpCodes[]>;

export const getErrorResponse = <S extends restmHttpClient.HttpCodes>(
  statusCode: restmHttpClient.HttpCodes,
  body: any,
  expectedStatusCode: TStatusCodes
) => {
  if (body === null) {
    return new UnexpectedErrorResponse(statusCode, null);
  }
  if (
    isExpectedStatusCode<S>(statusCode, expectedStatusCode)
  ) {
    return new ExpectedErrorResponse<S>(statusCode, body);
  }

  return new UnexpectedErrorResponse(statusCode, body);
};

export class SuccessResponse<T> extends Response<
  T,
  restmHttpClient.HttpCodes.OK
> {}

export class ExpectedErrorResponse<
  S extends restmHttpClient.HttpCodes
> extends Response<any, S> {}

export class UnexpectedErrorResponse extends Response<any, number> {}

export type TResponse<T, S extends restmHttpClient.HttpCodes> =
  | SuccessResponse<T>
  | ExpectedErrorResponse<S>
  | UnexpectedErrorResponse;

type TSuccessRouteHandler<T, U> = (response: SuccessResponse<T>) => U;
type TExpectedErrorRouteHandler<S extends restmHttpClient.HttpCodes, U> = (
  response: ExpectedErrorResponse<S>
) => U;
type TUnexpectedErrorRouteHandler<U> = (response: UnexpectedErrorResponse) => U;

interface IRouteMapper<T, S extends restmHttpClient.HttpCodes, U> {
  success: TSuccessRouteHandler<T, U>;
  expectedError: { [K in S]: TExpectedErrorRouteHandler<S, U> };
  unexpectedError: TUnexpectedErrorRouteHandler<U>;
}

export enum RouteTypes {
  success = "success",
  expectedError = "expectedError",
  unexpectedError = "unexpectedError"
}

export type TSuccessRoute<T, U> = {
  func: TSuccessRouteHandler<T, U>;
  response: SuccessResponse<T>;
  type: RouteTypes.success;
};

export type TExpectedErrorRoute<S extends restmHttpClient.HttpCodes, U> = {
  func: TExpectedErrorRouteHandler<S, U>;
  response: ExpectedErrorResponse<S>;
  type: RouteTypes.expectedError;
};

export type TUnexpectedErrorRoute<U> = {
  func: TUnexpectedErrorRouteHandler<U>;
  response: UnexpectedErrorResponse;
  type: RouteTypes.unexpectedError;
};

export type TRoutes<T, S extends restmHttpClient.HttpCodes, U> =
  | TSuccessRoute<T, U>
  | TExpectedErrorRoute<S, U>
  | TUnexpectedErrorRoute<U>;

const isExpectedStatusCode = <S>(
  target: any,
  expectedStatusCode: TStatusCodes
): target is S => {
  return expectedStatusCode.includes(target);
};

export const isSucess = <T, S extends restmHttpClient.HttpCodes, U>(
  route: TRoutes<T, S, U>
): route is TSuccessRoute<T, U> => {
  return route.type === RouteTypes.success
};

export const isExpectedError = <T, S extends restmHttpClient.HttpCodes, U>(
  route: TRoutes<T, S, U>
): route is TExpectedErrorRoute<S, U> => {
  return route.type === RouteTypes.expectedError
};

export const isUnexpectedError = <T, S extends restmHttpClient.HttpCodes, U>(
  route: TRoutes<T, S, U>
): route is TUnexpectedErrorRoute<U> => {
  return route.type === RouteTypes.unexpectedError
};

export class Router<T, S extends restmHttpClient.HttpCodes> {
  private readonly response: TResponse<T, S>;
  private readonly statusCodes: TStatusCodes;
  constructor(response: TResponse<T, S>, statusCodes: TStatusCodes) {
    this.response = response;
    this.statusCodes = statusCodes;
  }

  public routing<U>(route: IRouteMapper<T, S, U>): TRoutes<T, S, U> {
    const response = this.response;
    const statusCode = this.response.statusCode;

    if (response instanceof SuccessResponse) {
      return {
        func: route.success,
        response,
        type: RouteTypes.success
      } as TSuccessRoute<T, U>;
    }
    if (
      response instanceof ExpectedErrorResponse &&
      isExpectedStatusCode<S>(statusCode, this.statusCodes)
    ) {
      const expectedError = route.expectedError;
      const targetFunc = expectedError[statusCode];
      return {
        func: targetFunc,
        response,
        type: RouteTypes.expectedError
      } as TExpectedErrorRoute<S, U>;
    }
    if (response instanceof UnexpectedErrorResponse) {
      return {
        func: route.unexpectedError,
        response,
        type: RouteTypes.unexpectedError
      } as TUnexpectedErrorRoute<U>;
    }
    throw Error("Unexpected response type");
  }
}

interface IHandlers {
  basicAuth: restmHandlers.BasicCredentialHandler | null;
  JWTAuth: restmHandlers.BearerCredentialHandler | null;
}

const InitHandlers: IHandlers = {
  JWTAuth: null,
  basicAuth: null
};

class Handlers extends Record<IHandlers>(InitHandlers) {
  public constructor(values: IHandlers) {
    super(values);
  }
}

const isStatusCode = (
  statusCode: number
): statusCode is restmHttpClient.HttpCodes => {
  return Object.values(restmHttpClient.HttpCodes)
    .filter(v => typeof v === "number")
    .includes(statusCode);
};

const isOKStatusCode = (
  statusCode: restmHttpClient.HttpCodes
): statusCode is restmHttpClient.HttpCodes.OK => {
  return statusCode === restmHttpClient.HttpCodes.OK;
};

const FPRESTClient = async <T, S extends restmHttpClient.HttpCodes>(
  getResponse: () => Promise<restm.IRestResponse<T>>,
  expectedStatusCode: TStatusCodes
) => {
  try {
    const response = await getResponse();
    const statusCode = response.statusCode;
    if (!isStatusCode(statusCode)) {
      throw response;
    }

    if (response.result === null) {
      return getErrorResponse<S>(
        statusCode,
        {
          detail: "Target is not found.",
          status: 404,
          title: "Not Found",
          type: "about:blank"
        },
        expectedStatusCode
      );
    }
    if (!isOKStatusCode(statusCode)) {
      throw response;
    }
    return new SuccessResponse<T>(statusCode, response.result);
  } catch (e) {
    const statusCode = e.statusCode;
    if (isStatusCode(statusCode) && e.result !== undefined) {
      return getErrorResponse<S>(statusCode, e.result, expectedStatusCode);
    }

    throw e;
  }
};

export interface IRequestOptions extends restm.IRequestOptions {}

export class RESTClient {
  private client: restm.RestClient;
  private clientName: string;
  private apiUrl: string;
  private handlers: Handlers;

  constructor(
    clientName: string,
    apiUrl: string,
    handlers?: Handlers
  ) {
    this.clientName = clientName
    this.apiUrl = apiUrl

    if (handlers === undefined) {
      this.handlers = new Handlers(InitHandlers);
    } else {
      this.handlers = handlers;
    }

    const handlersArray = this.handlers
      .toSeq()
      .valueSeq()
      .filter(<T>(value: T | null): value is T => value !== null)
      .toArray();

    this.client = new restm.RestClient(clientName, apiUrl, handlersArray);
  }

  public setBasicAuthCredential(username: string, password: string) {
    return new RESTClient(
      this.clientName,
      this.apiUrl,
      this.handlers.set(
        "basicAuth",
        new restmHandlers.BasicCredentialHandler(username, password)
      )
    );
  }

  public setJWTAuthCredenstial(token: string) {
    return new RESTClient(
      this.clientName,
      this.apiUrl,
      this.handlers.set(
        "JWTAuth",
        new restmHandlers.BearerCredentialHandler(token)
      )
    );
  }

  public async create<T, S, U extends restmHttpClient.HttpCodes>(
    path: string,
    body: T,
    expectedStatusCodes: TStatusCodes,
    options?: IRequestOptions
  ) {
    const response = await FPRESTClient<S, U>(
      () => this.client.create<S>(path, body, options),
      expectedStatusCodes
    );
    return new Router<S, U>(response, expectedStatusCodes);
  }

  public async get<T, S extends restmHttpClient.HttpCodes>(
    path: string,
    expectedStatusCodes: TStatusCodes,
    options?: IRequestOptions
  ) {
    const response = await FPRESTClient<T, S>(
      () => this.client.get<T>(path, options),
      expectedStatusCodes
    );
    return new Router<T, S>(response, expectedStatusCodes);
  }

  public async update<T, S, U extends restmHttpClient.HttpCodes>(
    path: string,
    body: T,
    expectedStatusCodes: TStatusCodes,
    options?: IRequestOptions
  ) {
    const response = await FPRESTClient<S, U>(
      () => this.client.update<S>(path, body, options),
      expectedStatusCodes
    );
    return new Router<S, U>(response, expectedStatusCodes);
  }

  public async del<T, S extends restmHttpClient.HttpCodes>(
    path: string,
    expectedStatusCodes: TStatusCodes,
    options?: IRequestOptions
  ) {
    const response = await FPRESTClient<T, S>(
      () => this.client.del<T>(path, options),
      expectedStatusCodes
    );
    return new Router<T, S>(response, expectedStatusCodes);
  }
}
