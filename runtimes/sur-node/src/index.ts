import * as http from "http";
import connect from "connect";
import { EndpointBase, ButterService, ButterServerOptions } from "./types";
import { createRpcHandler } from "./rpc";
import { ChannelNode, RPCNode, ButterNode } from "./shared/nodes";
import { createUpgradeHandler, ButterSocket } from "./channel";
import { isButterPath } from "./util";
import {
  upgradeHandlerToResponseHandler,
  responseHandlerToUpgradeHandler,
  divertUpgrade,
} from "./shims";

type ExtractNodeType<P> = P extends ButterNode<infer T> ? T : never;

export class ButterServer<Endpoints extends EndpointBase> {
  constructor(
    service: ButterService<Endpoints>,
    options: ButterServerOptions = {}
  ) {
    // will extend beyond one service, soon enough :)
    this.service = service;
    this.options = options;
    this.connectServer = connect();
  }

  private connectServer: connect.Server;
  private service: ButterService<Endpoints>;
  private baseHandler:
    | ((req: http.IncomingMessage, res: http.ServerResponse) => unknown)
    | undefined;
  private options: ButterServerOptions;

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

  use(middleware: connect.HandleFunction) {
    this.connectServer.use(middleware);
    return this;
  }

  implement<Z extends keyof Endpoints>(
    name: Z,
    handler: Endpoints[Z] extends ChannelNode<unknown, unknown>
      ? (
          connection: ButterSocket<
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
    if (!isButterPath(req)) {
      if (this.baseHandler) {
        this.baseHandler(req, res);
        return;
      } else {
        res.statusCode = 404;
        res.end("Requested a non-butter path without a base server specified");
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

    this.connectServer.use(
      divertUpgrade(rpcHandler, upgradeHandlerToResponseHandler(upgradeHandler))
    );

    server.on("request", this.rpcFallback(this.connectServer));
    server.on(
      "upgrade",
      responseHandlerToUpgradeHandler(this.rpcFallback(this.connectServer))
    );

    return server;
  }

  listen(...args) {
    return this.createHttpServer().listen(...args);
  }
}
