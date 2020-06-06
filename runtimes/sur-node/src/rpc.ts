import * as http from "http";
import { SurService, SurMiddleware, EndpointBase } from "./types";
import { SUR_NAMESPACE } from "./constants";
import { Stream } from "stream";

// Thanks stackoverflow!
function streamToString(stream: Stream): Promise<string> {
  const chunks = [];
  return new Promise((resolve, reject) => {
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
  });
}

export const createRpcHandler = <Endpoints extends EndpointBase>(
  services: Array<SurService<Endpoints>>,
  handlers: { [Key in keyof Endpoints]?: any },
  middleware: Array<SurMiddleware>
) => async (request: http.IncomingMessage, response: http.ServerResponse) => {
  const url = new URL(request.url, `http://${request.headers.host}`);
  const path = url.pathname.split("/").slice(1);

  if (path[0] !== SUR_NAMESPACE) {
    // Irrelevant request, do nothing.
    return;
  }

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

  if (rpcDef.type !== "rpcNode") {
    // Should be handled by channels.
    return;
  }

  const handler = handlers[requestName];
  if (!handler) {
    response.writeHead(501, { "Content-Type": "text/plain" });
    response.end(`Sur RPC not implemented: ${relevantService}/${requestName}`);
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
