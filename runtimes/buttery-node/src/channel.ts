import { ButteryService, EndpointBase, ButteryServerOptions } from "./types";
import { Server as WebsocketServer } from "ws";
import { isButteryPath } from "./util";
import * as http from "http";
import { Socket } from "net";
import { ChannelNode } from "./shared/nodes";
import { Pipe } from "./util";

type CloseStatus = "closed" | "broken";

export class ButterySocket<Incoming, Outgoing> {
  constructor(socket: WebSocket, channelDef: ChannelNode<Incoming, Outgoing>) {
    this.socket = socket;
    this.channelDef = channelDef;
    this.incomingPipe = new Pipe<Incoming>();
    this.closePipe = new Pipe<CloseStatus>();
    this.socket.onmessage = (event) => {
      this.receive(event.data);
    };
    this.socket.onclose = () => {
      this.closePipe.fire("closed");
    };
    this.socket.onerror = () => {
      this.closePipe.fire("broken");
    };
  }

  private socket: WebSocket;
  private incomingPipe: Pipe<Incoming>;
  private closeStatus?: CloseStatus;
  private closePipe: Pipe<CloseStatus>;

  private channelDef: ChannelNode<Incoming, Outgoing>;
  private receive(msg: string) {
    let parsed: Incoming | undefined;
    parsed = this.channelDef.incoming.deserialize(msg);
    if (parsed === undefined) {
      this.socket.close(1003);
      return;
    }
    this.incomingPipe.fire(parsed);
  }

  send(data: Outgoing) {
    let serialized: string | undefined;
    if (this.socket.readyState === 4) {
      return; // Tried to write data to a closed pipe!
    }
    serialized = this.channelDef.outgoing.serialize(data);
    if (serialized === undefined) {
      throw new Error("Could not serialize outgoing RPC data");
    }
    this.socket.send(serialized);
  }

  listen = (listener: (msg: Incoming) => unknown) => {
    this.incomingPipe.listen(listener);
  };

  unlisten = (listener: (msg: Incoming) => unknown) => {
    this.incomingPipe.unlisten(listener);
  };

  close(code: number = 1000) {
    this.socket.close(code);
  }
}

const handleConnection = <Incoming, Outgoing>(
  socket: WebSocket,
  request: http.IncomingMessage,
  handler: (
    connection: ButterySocket<any, any>,
    request: http.IncomingMessage
  ) => void,
  channelDef: ChannelNode<Incoming, Outgoing>
) => {
  handler(new ButterySocket(socket, channelDef), request);
};

export const createUpgradeHandler = (
  serviceDefinitions: ButteryService<EndpointBase>[],
  handlers: {
    [key: string]: {
      [key: string]: (
        connection: ButterySocket<any, any>,
        request: http.IncomingMessage
      ) => void;
    };
  },
  options: ButteryServerOptions
) => {
  const wss = new WebsocketServer({
    noServer: true,
  });

  wss.on("connection", handleConnection);

  return (request: http.IncomingMessage, socket: Socket, head: Buffer) => {
    const path = (request.url || "").split("/").slice(1);
    if (path.length !== 2) {
      socket.destroy(new Error("Malformed Buttery URL"));
      return;
    }
    const [serviceName, requestName] = path;

    const service = serviceDefinitions.find(
      (service) => service.name === serviceName
    );
    if (!service) {
      socket.destroy(
        new Error(`No service with name ${serviceName} registered.`)
      );
      return;
    }

    const channelDef = service.endpoints[requestName];
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

    const handler = handlers[serviceName][requestName];
    if (!handler) {
      socket.destroy(
        new Error(`Buttery RPC not implemented: ${service.name}/${requestName}`)
      );
    }

    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit("connection", ws, request, handler, channelDef);
    });
  };
};
