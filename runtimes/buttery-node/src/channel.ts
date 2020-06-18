import { ButteryService, EndpointBase, ButteryServerOptions } from "./types";
import { Server as WebsocketServer } from "ws";
import { isButteryPath } from "./util";
import * as http from "http";
import { Socket } from "net";
import { ChannelNode } from "./shared/nodes";
import { Pipe } from "./util";

export class ButterySocket<Incoming, Outgoing> extends Pipe<Incoming> {
  constructor(socket: WebSocket, channelDef: ChannelNode<Incoming, Outgoing>) {
    super();
    this.socket = socket;
    this.channelDef = channelDef;
    this.socket.onmessage = (event) => {
      this.receive(event.data);
    };
  }

  socket: WebSocket;

  private channelDef: ChannelNode<Incoming, Outgoing>;
  send(data: Outgoing) {
    let parsed: string | undefined;
    parsed = this.channelDef.outgoing.serialize(data);
    if (parsed === undefined) {
      throw new Error("Could not serialize outgoing RPC data");
    }
    this.socket.send(parsed);
  }
  private receive(msg: string) {
    let parsed: Incoming | undefined;
    parsed = this.channelDef.incoming.deserialize(msg);
    if (parsed === undefined) {
      this.socket.close(1003);
      return;
    }
    this.fire(parsed);
  }
}

const handleConnection = <Incoming, Outgoing>(
  socket: WebSocket,
  request: http.IncomingMessage,
  handler: (connection: any, request: http.IncomingMessage) => void,
  channelDef: ChannelNode<Incoming, Outgoing>
) => {
  handler(new ButterySocket(socket, channelDef), request);
};

export const createUpgradeHandler = <Endpoints extends EndpointBase>(
  services: Array<ButteryService<Endpoints>>,
  handlers: { [Key in keyof Endpoints]?: any },
  options: ButteryServerOptions
) => {
  const wss = new WebsocketServer({
    noServer: true,
  });

  wss.on("connection", handleConnection);

  return (request: http.IncomingMessage, socket: Socket, head: Buffer) => {
    if (!isButteryPath(request)) {
      // Already taken care of by a different handler!
      return;
    }

    const path = (request.url || "").split("/").slice(1);
    if (path.length !== 3) {
      socket.destroy(new Error("Malformed Buttery URL"));
      return;
    }
    const [_, serviceName, requestName] = path;
    const relevantService = services.find(
      (service) => service.name === serviceName
    );
    if (!relevantService) {
      socket.destroy(
        new Error(`No service with name ${serviceName} registered.`)
      );
      return;
    }

    const channelDef = relevantService.endpoints[requestName];
    if (!channelDef) {
      socket.destroy(
        new Error(
          `No Channel with name ${requestName} registered for ${serviceName}.`
        )
      );
      return;
    }

    if (channelDef.type === "rpcNode") {
      socket.destroy(
        new Error(`Tried to connect to RPC ${requestName} via a websocket.`)
      );
    }

    const handler = handlers[requestName];
    if (!handler) {
      socket.destroy(
        new Error(
          `Buttery RPC not implemented: ${relevantService}/${requestName}`
        )
      );
    }

    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit("connection", ws, request, handler, channelDef);
    });
  };
};
