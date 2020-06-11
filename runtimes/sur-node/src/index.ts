import * as http from "http";
import connect from "connect";
import {
  EndpointBase,
  SurService,
  SurMiddleware,
  SurServerOptions,
} from "./types";
import { createRpcHandler } from "./rpc";
import { ChannelNode, RPCNode, SurNode } from "./shared/nodes";
import { createUpgradeHandler, SurSocket } from "./channel";
import { isSurPath } from "./util";

type ExtractNodeType<P> = P extends SurNode<infer T> ? T : never;

export class SurServer<Endpoints extends EndpointBase> {
  constructor(service: SurService<Endpoints>, options: SurServerOptions = {}) {
    // will extend beyond one service, soon enough :)
    this.service = service;
    this.options = options;
    this.connectServer = connect();
  }

  private connectServer: connect.Server;
  private service: SurService<Endpoints>;
  private baseHandler:
    | ((req: http.IncomingMessage, res: http.ServerResponse) => unknown)
    | undefined;
  private options: SurServerOptions;

  private rpcImplementations: {
    [Key in keyof Endpoints]?: (
      request: any,
      httpRequest: http.IncomingMessage
    ) => Promise<any>;
  } = {};

  private channelImplementations: {
    [Key in keyof Endpoints]?: (
      connection: any,
      httpRequest: http.IncomingMessage
    ) => void;
  } = {};

  wrapListener(
    handler: (req: http.IncomingMessage, res: http.ServerResponse) => unknown
  ) {
    this.baseHandler = handler;
  }

  use(middleware: SurMiddleware) {
    if (!this.options.middlewares) {
      this.options.middlewares = [];
    }
    this.options.middlewares.push(middleware);
    return this;
  }

  implement<Z extends keyof Endpoints>(
    name: Z,
    handler: Endpoints[Z] extends ChannelNode<unknown, unknown>
      ? (
          connection: SurSocket<
            ExtractNodeType<Endpoints[Z]["incoming"]>,
            ExtractNodeType<Endpoints[Z]["outgoing"]>
          >,
          request: http.IncomingMessage
        ) => unknown
      : Endpoints[Z] extends RPCNode<unknown, unknown>
      ? (
          message: ExtractNodeType<Endpoints[Z]["request"]>,
          request: http.IncomingMessage
        ) => Promise<ExtractNodeType<Endpoints[Z]["response"]>>
      : never
  ) {
    if (this.service.endpoints[name].type === "channelNode") {
      this.channelImplementations[name] = handler;
    } else if (this.service.endpoints[name].type === "rpcNode") {
      // Don't know why this cast is necessary
      this.rpcImplementations[name] = handler as (
        request: any,
        httpRequest: http.IncomingMessage
      ) => Promise<any>;
    } else {
      throw `Unknown rpc or channel ${name}`;
    }
  }

  rpcFallback = (next: (req, res) => unknown) => (req, res) => {
    if (!isSurPath(req)) {
      if (this.baseHandler) {
        this.baseHandler(req, res);
        return;
      } else {
        res.statusCode = 404;
        res.end("Requested a non-sur path without a base server specified");
        return;
      }
    }
    next(req, res);
  };

  createHttpServer() {
    const server = http.createServer();

    const rpcHandler = createRpcHandler(
      [this.service],
      this.rpcImplementations,
      this.options
    );

    const upgradeHandler = createUpgradeHandler(
      [this.service],
      this.channelImplementations,
      this.options
    );

    // This connectServer should divert to either RPCs or Channels
    // depending on what happens here
    this.connectServer.use(rpcHandler);

    server.on("request", this.rpcFallback(this.connectServer));
    server.on("upgrade", upgradeHandler);

    return server;
  }

  listen(...args) {
    return this.createHttpServer().listen(...args);
  }
}
