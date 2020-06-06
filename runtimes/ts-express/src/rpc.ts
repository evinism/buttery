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

export const rpcHandler = (
  services: Array<SurService<EndpointBase>>,
  middleware?: Array<SurMiddleware>
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

  // Get the data as utf8 strings.
  // If an encoding is not set, Buffer objects will be received.
  request.setEncoding("utf8");
  let parsed;
  try {
    const body = await streamToString(request);
    parsed = rpcDef.request.deserialize(body);
  } catch (e) {
    console.warn("Malformed request resulted in: " + e);
    response.statusCode = 400;
    response.writeHead(400, { "Content-Type": "text/plain" });
    response.end("Error occurred: " + e.message);
    return;
  }

  response.writeHead(200, { "Content-Type": "application/json" });
  response.end(JSON.stringify(parsed));
};
