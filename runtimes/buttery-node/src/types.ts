import * as http from "http";
import { RPCNode, ChannelNode } from "./shared/nodes";

export type EndpointBase = {
  [key: string]: RPCNode<unknown, unknown> | ChannelNode<unknown, unknown>;
};

export interface ButteryService<Endpoints extends EndpointBase> {
  name: string;
  endpoints: Endpoints;
}

export interface ButteryServerOptions {
  rpc?: {
    headers?: { [key: string]: string };
  };
}

export type ImplementationMap = {
  [key: string]: {
    [key: string]: (connection: any, httpRequest: http.IncomingMessage) => void;
  };
};
