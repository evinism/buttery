import * as http from "http";
import { SurService, SurMiddleware, EndpointBase } from "./types";
import { SUR_NAMESPACE } from "./constants";
import { Stream } from "stream";
import { isSurPath, streamToString } from "./util";

export const createRpcHandler = <Endpoints extends EndpointBase>(
  services: Array<SurService<Endpoints>>,
  handlers: { [Key in keyof Endpoints]?: any },
  middleware: Array<SurMiddleware>
) => async (request: http.IncomingMessage, response: http.ServerResponse) => {
  if (!isSurPath(request)) {
    // Irrelevant request, do nothing.
    return;
  }

  const path = (request.url || "").split("/").slice(1);
  if (path.length !== 3) {
    response.writeHead(400, { "Content-Type": "text/plain" });
    response.end("Malformed Sur URL");
    return;
  }
  const [_, serviceName, requestName] = path;
  const relevantService = services.find(
    (service) => service.name === serviceName
  );
  if (!relevantService) {
    response.writeHead(404, { "Content-Type": "text/plain" });

    response.end(`No service with name ${serviceName} registered.`);
    return;
  }

  const rpcDef = relevantService.endpoints[requestName];
  if (!rpcDef) {
    response.writeHead(404, { "Content-Type": "text/plain" });

    response.end(
      `No RPC/Channel with name ${requestName} registered for ${serviceName}.`
    );
    return;
  }

  const handler = handlers[requestName];
  if (!handler) {
    response.writeHead(501, { "Content-Type": "text/plain" });
    response.end(`Sur RPC not implemented: ${relevantService}/${requestName}`);
  }

  if (rpcDef.type !== "rpcNode") {
    // Should be handled by channels.
    return;
  }

  let parsed;
  try {
    const body = await streamToString(request);
    parsed = rpcDef.request.deserialize(body);
    if (!parsed) {
      throw "Invalid Body";
    }
  } catch (e) {
    response.writeHead(400, { "Content-Type": "text/plain" });
    response.end("Error occurred: " + e.message);
    return;
  }

  let result;
  try {
    result = rpcDef.response.serialize(await handler(parsed));
  } catch (e) {
    response.writeHead(500, { "Content-Type": "text/plain" });
    response.end("Internal Server Error: " + e.message);
    return;
  }

  response.writeHead(200, { "Content-Type": "application/json" });
  response.end(result);
};
