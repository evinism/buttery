import { RPCNode, ChannelNode } from "./shared/nodes";

export type EndpointBase = {
  [key: string]: RPCNode<unknown, unknown> | ChannelNode<unknown, unknown>;
};

export interface SurService<Endpoints extends EndpointBase> {
  name: string;
  endpoints: Endpoints;
}

export type SurMiddleware = (req: any, res) => {};
