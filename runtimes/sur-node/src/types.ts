import { RPCNode, ChannelNode } from "./shared/nodes";

export type EndpointBase = {
  [key: string]: RPCNode<unknown, unknown> | ChannelNode<unknown, unknown>;
};

export interface ButterService<Endpoints extends EndpointBase> {
  name: string;
  endpoints: Endpoints;
}

export type ButterMiddleware = (req: any, res: any) => {};

export interface ButterServerOptions {
  middlewares?: ButterMiddleware[];
  rpc?: {
    headers?: { [key: string]: string };
  };
}
