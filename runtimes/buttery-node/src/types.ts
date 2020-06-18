import { RPCNode, ChannelNode } from "./shared/nodes";

export type EndpointBase = {
  [key: string]: RPCNode<unknown, unknown> | ChannelNode<unknown, unknown>;
};

export interface ButteryService<Endpoints extends EndpointBase> {
  name: string;
  endpoints: Endpoints;
}

export type ButteryMiddleware = (req: any, res: any) => {};

export interface ButteryServerOptions {
  middlewares?: ButteryMiddleware[];
  rpc?: {
    headers?: { [key: string]: string };
  };
}
