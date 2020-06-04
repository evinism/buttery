import WebSocket from "ws";
import * as http from "http";
import { SurNode, RPCNode, ChannelNode } from "./shared/nodes";

const SUR_NAMESPACE = "sur";

type EndpointBase = {
  [key: unknown]: RPCNode<unknown, unknown> | ChannelNode<unknown, unknown>,
};

interface SurService<Endpoints extends EndpointBase> {
  name: string,
  endpoints: Endpoints
}

// The below 
function addSurService<Endpoints extends EndpointBase>(server: http.Server, service: SurService<EndpointBase>) {
  // Enable RPCs

  server.on(
    "request",
    (request: http.ClientRequest, response: http.ServerResponse) => {
    }
  );
}



