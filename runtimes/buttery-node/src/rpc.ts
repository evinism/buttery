import * as http from "http";
import { ButteryService, EndpointBase, ButteryServerOptions } from "./types";
import { streamToString } from "./util";

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
    response.writeHead(400, { "Content-Type": "text/plain" });
    response.end("Malformed Buttery URL");
    return;
  }

  const [serviceName, requestName] = path;
  const service = serviceDefinitions.find(({ name }) => name === serviceName);

  if (!service) {
    response.writeHead(
      404,
      Object.assign({ "Content-Type": "text/plain" }, headers)
    );

    response.end(`No service with name ${serviceName} registered.`);
    return;
  }

  const rpcDef = service.endpoints[requestName];
  if (!rpcDef) {
    response.writeHead(
      404,
      Object.assign({ "Content-Type": "text/plain" }, headers)
    );

    response.end(
      `No RPC/Channel with name ${requestName} registered for ${serviceName}.`
    );
    return;
  }

  const handler = handlers[serviceName][requestName];
  if (!handler) {
    response.writeHead(
      501,
      Object.assign({ "Content-Type": "text/plain" }, headers)
    );
    response.end(`Buttery RPC not implemented: ${service.name}/${requestName}`);
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
      throw "Invalid Body";
    }
  } catch (e) {
    response.writeHead(
      400,
      Object.assign({ "Content-Type": "text/plain" }, headers)
    );
    response.end("Error occurred: " + e.message);
    return;
  }

  let result;
  try {
    result = rpcDef.response.serialize(await handler(parsed, request));
  } catch (e) {
    response.writeHead(
      500,
      Object.assign({ "Content-Type": "text/plain" }, headers)
    );
    response.end("Internal Server Error: " + e.message);
    return;
  }

  response.writeHead(
    200,
    Object.assign({ "Content-Type": "application/json" }, headers)
  );
  response.end(result);
};
