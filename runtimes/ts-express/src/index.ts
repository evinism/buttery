import { Server } from "ws";
import * as http from "http";
import { EndpointBase, SurService, SurMiddleware } from "./types";
import { createRpcHandler } from "./rpc";
import { SUR_NAMESPACE } from "./constants";

function isSurPath(request: http.IncomingMessage) {
  const url = new URL(request.url, `http://${request.headers.host}`);
  const path = url.pathname.split("/").slice(1);
  if (path[0] !== SUR_NAMESPACE) {
    return false;
  }
  return true;
}

// The below
export function createSurServer<Endpoints extends EndpointBase>(
  service: SurService<EndpointBase> | Array<SurService<EndpointBase>>,
  baseRequestServer?: (
    req: http.IncomingMessage,
    res: http.ServerResponse
  ) => unknown,
  middleware?: Array<SurMiddleware>
) {
  if (!Array.isArray(service)) {
    service = [service];
  }
  const rpcHandler = createRpcHandler(service, middleware);

  const server = http.createServer((req, res) => {
    if (baseRequestServer && !isSurPath(req)) {
      baseRequestServer(req, res);
      return;
    }
    rpcHandler(req, res);
  });
  const wss = new Server({ server });
  return server;
}
