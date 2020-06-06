import { Server } from "ws";
import * as http from "http";
import { EndpointBase, SurService, SurMiddleware } from "./types";
import { createRpcHandler } from "./rpc";
import { SUR_NAMESPACE } from "./constants";
import { ChannelNode, RPCNode } from "./shared/nodes";
import { RequestHandler } from "express";

function isSurPath(request: http.IncomingMessage) {
  const url = new URL(request.url, `http://${request.headers.host}`);
  const path = url.pathname.split("/").slice(1);
  if (path[0] !== SUR_NAMESPACE) {
    return false;
  }
  return true;
}

type ChannelHandler<Send, Recv, Node extends ChannelNode<Send, Recv>> = (
  num: number
) => Promise<Send>;

type RpcHandler<Req, Res, Node extends RPCNode<Req, Res>> = (
  node: Node
) => (req: Req) => Promise<Res>;

export class SurServer<Endpoints extends EndpointBase> {
  constructor(service: SurService<Endpoints>) {
    // will extend beyond one service, soon enough :)
    this.service = service;
  }

  service: SurService<Endpoints>;
  baseHandler: (req: http.IncomingMessage, res: http.ServerResponse) => unknown;
  middlewares = [];
  handlerNodes: {
    [Key in keyof Endpoints]: Endpoints[Key];
  };

  rpcImplementations: {
    [Key in keyof Endpoints]?: (request: any) => Promise<any>;
  } = {};

  channelImplementations: {
    [Key in keyof Endpoints]?: (connection: any) => void;
  } = {};

  wrapListener(
    handler: (req: http.IncomingMessage, res: http.ServerResponse) => unknown
  ) {
    this.baseHandler = handler;
  }

  use(middleware: SurMiddleware) {
    this.middlewares.push(middleware);
    return this;
  }

  implement<Z extends keyof Endpoints>(
    name: Z,
    handler: Endpoints[Z] extends ChannelNode<unknown, unknown>
      ? (connection: any) => unknown
      : (request: any) => Promise<any>
  ) {
    if (this.service.endpoints[name].type === "channelNode") {
      this.channelImplementations[name] = handler;
    } else if (this.service.endpoints[name].type === "rpcNode") {
      // Don't know why this cast is necessary
      this.rpcImplementations[name] = handler as (request: any) => Promise<any>;
    } else {
      throw `Unknown rpc or channel ${name}`;
    }
  }

  createHttpServer() {
    const rpcHandler = createRpcHandler([this.service], this.middlewares);

    const server = http.createServer((req, res) => {
      if (this.baseHandler && !isSurPath(req)) {
        this.baseHandler(req, res);
        return;
      }
      rpcHandler(req, res);
    });

    const wss = new Server({ server });

    return server;
  }
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
  return server;
}
