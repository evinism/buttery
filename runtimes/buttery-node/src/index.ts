import * as http from "http";
import * as https from "https";
import connect from "connect";
import { EndpointBase, ButteryService, ButteryServerOptions } from "./types";
import { createRpcHandler } from "./rpc";
import { ChannelNode, RPCNode, ButteryNode } from "./shared/nodes";
import { createUpgradeHandler, ButterySocket } from "./channel";
import { isButteryPath } from "./util";
import {
  upgradeHandlerToResponseHandler,
  responseHandlerToUpgradeHandler,
  divertUpgrade,
} from "./shims";
import express from "express";
import { Buttery_NAMESPACE } from "./constants";

type ExtractNodeType<P> = P extends ButteryNode<infer T> ? T : never;

export class ButteryServer {
  constructor(options: ButteryServerOptions = {}) {
    // will extend beyond one service, soon enough :)
    this.options = options;
    if (options.express && options.baseHandler) {
      throw "Buttery server options express and baseHandler are mutually exclusive";
    }
    this.baseHandler = options.baseHandler || options.express;
    this.expressServer = options.express || express();
  }

  private expressServer: express.Express;
  private baseHandler:
    | ((req: http.IncomingMessage, res: http.ServerResponse) => unknown)
    | undefined;
  private options: ButteryServerOptions;

  private rpcImplementations: {
    [key: string]: {
      [key: string]: (
        request: any,
        httpRequest: http.IncomingMessage
      ) => Promise<any>;
    };
  } = {};

  private channelImplementations: {
    [key: string]: {
      [key: string]: (
        connection: any,
        httpRequest: http.IncomingMessage
      ) => void;
    };
  } = {};

  private serviceDefinitions: ButteryService<any>[] = [];

  use<Endpoints extends EndpointBase, Z extends keyof Endpoints>(
    ...args:
      | [connect.HandleFunction]
      | [ButteryService<Endpoints>, connect.HandleFunction]
      | [ButteryService<Endpoints>, Z, connect.HandleFunction]
  ) {
    let targetPath = "";
    let middleware: connect.HandleFunction | undefined;
    if (args.length === 1) {
      middleware = args[0];
    } else if (args.length === 2) {
      middleware = args[1];
      targetPath = `/${Buttery_NAMESPACE}/${args[0].name}`;
    } else {
      middleware = args[2];
      targetPath = `/${Buttery_NAMESPACE}/${args[0].name}/${args[1]}`;
    }

    if (targetPath) {
      this.expressServer.use(targetPath, middleware);
    } else {
      this.expressServer.use(middleware);
    }

    return this;
  }

  implement<Endpoints extends EndpointBase, Z extends keyof Endpoints>(
    service: ButteryService<Endpoints>,
    name: Z,
    handler: Endpoints[Z] extends ChannelNode<any, any>
      ? (
          connection: ButterySocket<
            ExtractNodeType<Endpoints[Z]["incoming"]>,
            ExtractNodeType<Endpoints[Z]["outgoing"]>
          >,
          request: http.IncomingMessage
        ) => unknown
      : Endpoints[Z] extends RPCNode<any, any>
      ? (
          message: ExtractNodeType<Endpoints[Z]["request"]>,
          request: http.IncomingMessage
        ) => Promise<ExtractNodeType<Endpoints[Z]["response"]>>
      : never
  ) {
    // Register the service if it's not there yet
    if (this.serviceDefinitions.indexOf(service) < 0) {
      this.serviceDefinitions.push(service);
    }

    // Annoying out-of-typesystem check to ensure we accidentally didnt
    // get a non-implementable as a key
    const endpoint = service.endpoints[name];
    if (typeof endpoint !== "object" || endpoint === null || !endpoint.type) {
      throw `Unknown rpc or channel ${name}`;
    }

    if (endpoint.type === "channelNode") {
      this.channelImplementations[service.name] =
        this.channelImplementations[service.name] || {};
      this.channelImplementations[service.name][name as any] = handler;
    } else if (endpoint.type === "rpcNode") {
      // Don't know why this cast is necessary
      this.rpcImplementations[service.name] =
        this.rpcImplementations[service.name] || {};
      this.rpcImplementations[service.name][name as any] = handler as (
        request: any,
        httpRequest: http.IncomingMessage
      ) => Promise<any>;
    } else {
      throw `Unknown rpc or channel ${name}`;
    }
  }

  rpcFallback = (
    next: (req: http.IncomingMessage, res: http.ServerResponse) => unknown
  ) => (req: http.IncomingMessage, res: http.ServerResponse) => {
    if (!isButteryPath(req)) {
      if (this.baseHandler) {
        this.baseHandler(req, res);
        return;
      } else {
        res.statusCode = 404;
        res.end("Requested a non-buttery path without a base server specified");
        return;
      }
    }
    next(req, res);
  };

  createServer() {
    const server = this.options.https
      ? https.createServer(this.options.https)
      : http.createServer();

    const rpcHandler = createRpcHandler(
      this.serviceDefinitions,
      this.rpcImplementations,
      this.options
    );

    const upgradeHandler = createUpgradeHandler(
      this.serviceDefinitions,
      this.channelImplementations,
      this.options
    );

    this.expressServer.use(`/${Buttery_NAMESPACE}`, (req, res) => {
      divertUpgrade(
        rpcHandler,
        upgradeHandlerToResponseHandler(upgradeHandler)
      )(req, res);
    });

    server.on("request", this.rpcFallback(this.expressServer));
    server.on(
      "upgrade",
      responseHandlerToUpgradeHandler(this.rpcFallback(this.expressServer))
    );

    return server;
  }

  listen(...args: any[]) {
    return this.createServer().listen(...args);
  }
}
