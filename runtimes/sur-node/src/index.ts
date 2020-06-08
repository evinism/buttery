import { Server } from "ws";
import * as http from "http";
import { EndpointBase, SurService, SurMiddleware } from "./types";
import { createRpcHandler } from "./rpc";
import { ChannelNode, RPCNode, SurNode } from "./shared/nodes";
import { createChannelHandler, SurSocket } from "./channel";
import { isSurPath } from "./util";

type ExtractNodeType<P> = P extends SurNode<infer T> ? T : never;

export class SurServer<Endpoints extends EndpointBase> {
  constructor(service: SurService<Endpoints>) {
    // will extend beyond one service, soon enough :)
    this.service = service;
  }

  service: SurService<Endpoints>;
  baseHandler:
    | ((req: http.IncomingMessage, res: http.ServerResponse) => unknown)
    | undefined;
  middlewares = [];

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
      ? (
          connection: SurSocket<
            ExtractNodeType<Endpoints[Z]["incoming"]>,
            ExtractNodeType<Endpoints[Z]["outgoing"]>
          >
        ) => unknown
      : Endpoints[Z] extends RPCNode<unknown, unknown>
      ? (
          request: ExtractNodeType<Endpoints[Z]["request"]>
        ) => Promise<ExtractNodeType<Endpoints[Z]["response"]>>
      : never
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
    const rpcHandler = createRpcHandler(
      [this.service],
      this.rpcImplementations,
      this.middlewares
    );

    const server = http.createServer((req, res) => {
      if (this.baseHandler && !isSurPath(req)) {
        this.baseHandler(req, res);
        return;
      }
      rpcHandler(req, res);
    });

    const channelHandler = createChannelHandler(
      [this.service],
      this.channelImplementations,
      this.middlewares
    )(server);

    return server;
  }

  listen(...args) {
    return this.createHttpServer().listen(...args);
  }
}
