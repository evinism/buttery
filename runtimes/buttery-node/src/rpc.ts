import * as http from "http";
import { ButteryService, EndpointBase, ButteryServerOptions } from "./types";
import { streamToString } from "./util";
import {
  NotImplementedError,
  NotFoundError,
  BadRequestError,
  AppError,
  GenericButteryError,
} from "./errors";

// Workaround for extracting a previously parsed message by body parser.
// This really should not exist.
const tryToGetBody = (
  request: http.IncomingMessage & { body?: any; _body?: boolean }
) => {
  if (request._body) {
    // TODO: Switch this to converting to object via body-parser rather than this workaround.
    // This involves modifying ser/deser
    return JSON.stringify(request.body);
  } else {
    return undefined;
  }
};

export const createRpcHandler = (
  serviceDefinitions: ButteryService<EndpointBase>[],
  handlers: {
    [key: string]: {
      [key: string]: (
        request: any,
        httpRequest: http.IncomingMessage
      ) => Promise<any>;
    };
  },
  options: ButteryServerOptions
) => async (request: http.IncomingMessage, response: http.ServerResponse) => {
  const headers = options?.rpc?.headers || {};

  const path = (request.url || "").split("/").slice(1);
  if (path.length !== 2) {
    throw new BadRequestError("Malformed Buttery URL");
  }

  const [serviceName, requestName] = path;
  const service = serviceDefinitions.find(({ name }) => name === serviceName);

  if (!service) {
    throw new NotFoundError(`No service with name ${serviceName} registered.`);
  }

  const rpcDef = service.endpoints[requestName];
  if (!rpcDef) {
    throw new NotFoundError(
      `No RPC/Channel with name ${requestName} registered for ${serviceName}.`
    );
  }

  if (request.method !== "POST") {
    const responseCode = request.method === "OPTIONS" ? 204 : 405;
    response.writeHead(responseCode, {
      "Content-Type": "text/plain",
      Allow: "POST",
    });
    response.end();
    return;
  }

  const handler = handlers[serviceName][requestName];
  if (!handler) {
    throw new NotImplementedError(
      `Buttery RPC not implemented: ${service.name}/${requestName}`
    );
  }

  if (rpcDef.type !== "rpcNode") {
    // Should be handled by channels.
    return;
  }

  let parsed;
  try {
    // Workaround for the body possibly being parsed by this point
    // We probs want something better, e.g. whether the stream is yet finished.
    // this can probably lead to unending requests when body parser is used + reque
    let body: string | undefined = tryToGetBody(request);
    if (body === undefined) {
      body = await streamToString(request);
    }

    parsed = rpcDef.request.deserialize(body);
    if (parsed === undefined) {
      throw "Invalid body sent by client";
    }
  } catch (e) {
    throw new BadRequestError(e.message);
  }

  let handlerResult;

  try {
    handlerResult = await handler(parsed, request);
  } catch (e) {
    if (e instanceof GenericButteryError) {
      throw e;
    } else {
      throw new AppError(e.message);
    }
  }

  let serialized;
  try {
    serialized = rpcDef.response.serialize(handlerResult);
    if (serialized === undefined) {
      throw "Server tried to send an invalid body";
    }
  } catch (e) {
    throw new AppError(e.message);
  }

  response.writeHead(
    200,
    Object.assign({ "Content-Type": "application/json" }, headers)
  );
  response.end(serialized);
};
