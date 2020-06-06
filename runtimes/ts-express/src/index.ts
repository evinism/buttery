import { Server } from "ws";
import * as http from "http";
import { EndpointBase, SurService, SurMiddleware } from "./types";
import { rpcHandler } from "./rpc";

// The below
export function attachSur<Endpoints extends EndpointBase>(
  server: http.Server,
  service: SurService<EndpointBase> | Array<SurService<EndpointBase>>,
  middleware?: Array<SurMiddleware>
) {
  if (!Array.isArray(service)) {
    service = [service];
  }
  const wss = new Server({ server });
  server.addListener("request", rpcHandler(service, middleware));
}
