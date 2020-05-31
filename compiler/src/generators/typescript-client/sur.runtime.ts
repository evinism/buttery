/* Utils */
class Pipe<T> {
  listeners: Array<(arg: T) => unknown> = [];
  fire(arg: T) {
    this.listeners.forEach((listener) => {
      listener(arg);
    });
  }

  listen(subscriber: (arg: T) => unknown) {
    this.listeners.push(subscriber);
  }

  unlisten(toUnlisten: (arg: T) => unknown) {
    this.listeners = this.listeners.filter(
      (listener) => listener !== toUnlisten
    );
  }
}

interface TwoWayPipe<X, Y> {
  send: Pipe<X>;
  recv: Pipe<Y>;
}

/* Nodes */
interface SurNode<R> {
  validate: (toValidate: unknown) => toValidate is R;
  serialize: (r: R) => string | undefined;
  deserialize: (data: string) => R | undefined;
}

export function structNode<R extends {}>(
  decl: { [key in keyof R]: SurNode<R[key]> }
): SurNode<R> {
  const entries = Object.entries(decl) as Array<[keyof R, SurNode<unknown>]>;

  const validate = (toValidate: unknown): toValidate is R => {
    if (typeof toValidate !== "object" || toValidate === null) {
      return false;
    }

    // No extra keys
    const toValidateEntries = Object.entries(toValidate);
    for (let [key] of toValidateEntries) {
      if (decl[key] === undefined) {
        console.warn(`Unexpected key ${key} in struct!`);
        return false;
      }
    }

    // all existing keys are valid
    for (let [key] of entries) {
      const keyIsValid = decl[key].validate(toValidate[key as string]);
      if (!keyIsValid) {
        return false;
      }
    }
    return true;
  };

  const serialize = (r: R) => {
    if (!validate(r)) {
      return;
    }
    return (
      "{" +
      entries
        .map(([key, child]) => `"${key}": ${child.serialize(r[key])}`)
        .join(",") +
      "}"
    );
  };

  const deserialize = (data: string): R => {
    const parsed = JSON.parse(data) as unknown;
    if (!validate(parsed)) {
      return;
    }
    return parsed;
  };

  return {
    validate,
    serialize,
    deserialize,
  };
}

export function listNode<R>(valueDefn: SurNode<R>): SurNode<R[]> {
  const validate = (toValidate: unknown): toValidate is R[] => {
    if (!Array.isArray(toValidate)) {
      return false;
    }

    for (let entry of toValidate as unknown[]) {
      if (!valueDefn.validate(entry)) {
        return false;
      }
    }
    return true;
  };
  const serialize = (r: R[]) => {
    if (!validate(r)) {
      return;
    }
    return `[${r.map(valueDefn.serialize).join(",")}]`;
  };

  const deserialize = (data: string): R[] => {
    const parsed = JSON.parse(data) as unknown;
    if (!validate(parsed)) {
      return;
    }
    return parsed;
  };
  return {
    validate,
    serialize,
    deserialize,
  };
}

type KeyType = "string" | "integer" | "double";

export function mapNode<R>(
  valueDefn: SurNode<R>,
  keyType: KeyType
): SurNode<{ [key: string]: R }> {
  throw "Not implemented!";
}

// Primitive nodes!
// Lots of these can be reduced down.
export function integerNode(): SurNode<number> {
  const validate = (toValidate: unknown): toValidate is number => {
    const isInteger = typeof toValidate === "number" && toValidate % 1 === 0;
    if (!isInteger) {
      console.warn(`Expected integer, got ${toValidate}`);
    }
    return isInteger;
  };
  const serialize = (r: number) => {
    if (!validate(r)) {
      return;
    }
    return r.toString();
  };

  const deserialize = (data: string): number => {
    const parsed = JSON.parse(data) as unknown;
    if (!validate(parsed)) {
      return;
    }
    return parsed;
  };
  return {
    validate,
    serialize,
    deserialize,
  };
}

export function doubleNode(): SurNode<number> {
  const validate = (toValidate: unknown): toValidate is number => {
    const isDouble = typeof toValidate === "number";
    if (!isDouble) {
      console.warn(`Expected double, got ${toValidate}`);
    }
    return isDouble;
  };
  const serialize = (r: number) => {
    if (!validate(r)) {
      return;
    }
    return r.toString();
  };

  const deserialize = (data: string): number => {
    const parsed = JSON.parse(data) as unknown;
    if (!validate(parsed)) {
      return;
    }
    return parsed;
  };
  return {
    validate,
    serialize,
    deserialize,
  };
}

export function stringNode(): SurNode<string> {
  const validate = (toValidate: unknown): toValidate is string => {
    const isString = typeof toValidate === "string";
    if (!isString) {
      console.warn(`Expected string, got ${toValidate}`);
    }
    return isString;
  };
  const serialize = (r: string) => {
    if (!validate(r)) {
      return;
    }
    return JSON.stringify(r.toString());
  };

  const deserialize = (data: string): string => {
    const parsed = JSON.parse(data) as unknown;
    if (!validate(parsed)) {
      return;
    }
    return parsed;
  };
  return {
    validate,
    serialize,
    deserialize,
  };
}

export function booleanNode(): SurNode<boolean> {
  const validate = (toValidate: unknown): toValidate is boolean => {
    const isBoolean = typeof toValidate === "boolean";
    if (!isBoolean) {
      console.warn(`Expected boolean, got ${toValidate}`);
    }
    return isBoolean;
  };
  const serialize = (r: boolean) => {
    if (!validate(r)) {
      return;
    }
    return r.toString();
  };

  const deserialize = (data: string): boolean => {
    const parsed = JSON.parse(data) as unknown;
    if (!validate(parsed)) {
      return;
    }
    return parsed;
  };
  return {
    validate,
    serialize,
    deserialize,
  };
}

export function nullNode(): SurNode<boolean> {
  const validate = (toValidate: unknown): toValidate is null => {
    const isNull = toValidate === null;
    if (!isNull) {
      console.warn(`Expected null, got ${toValidate}`);
    }
    return isNull;
  };
  const serialize = (r: null) => {
    if (!validate(r)) {
      return;
    }
    return r;
  };

  const deserialize = (data: string): null => {
    const parsed = JSON.parse(data) as unknown;
    if (!validate(parsed)) {
      return;
    }
    return parsed;
  };
  return {
    validate,
    serialize,
    deserialize,
  };
}

/* === End nodes, begin core runtime abstractions === */
type SocketStatus =
  | "connecting"
  | "open"
  | "waitingToRetry"
  | "error"
  | "closed"; // Intentionally closed by user

type SocketEvent =
  | {
      type: "message";
      data: MessageEvent;
    }
  | {
      type: "status";
      status: SocketStatus; // Not sure what to put here.
    };

class StableSocket {
  constructor(url) {
    this.eventPipe = new Pipe<SocketEvent>();
    this.url = url;
  }

  private retryDelay = 1000; // really should exp backoff here but whatevs.
  private shouldRetry = true;
  private url: string;
  private socket: WebSocket;
  private eventPipe: Pipe<SocketEvent>;
  private sendBuffer: string[];

  buildSocket() {
    this.setStatus("connecting");
    this.socket = new WebSocket(this.url);
    this.socket.onmessage = (msg: MessageEvent) => {
      this.eventPipe.fire({
        type: "message",
        data: msg,
      });
    };
    this.socket.onopen = () => {
      this.setStatus("open");
      this.flush();
    };
    this.socket.onclose = () => {
      if (this.shouldRetry) {
        this.setStatus("waitingToRetry");
        setTimeout(() => this.buildSocket, this.retryDelay);
      } else {
        this.setStatus("closed");
      }
    };
  }

  private setStatus(newStatus: SocketStatus) {
    this.eventPipe.fire({
      type: "status",
      status: newStatus,
    });
  }

  private flush() {
    if (this.socket.readyState !== this.socket.OPEN) {
      return;
    }
    for (let msg of this.sendBuffer) {
      this.socket.send(msg);
    }
    this.sendBuffer = [];
  }

  // i don't know why out of 65536, but it just felt right.
  //nonce = Math.floor(Math.random() * 65536);
  send(msg: string) {
    this.sendBuffer.push(msg);
    this.flush();
  }

  listen(listener: (arg: SocketEvent) => unknown) {
    this.eventPipe.listen(listener);
  }

  unlisten(listener: (arg: SocketEvent) => unknown) {
    this.eventPipe.unlisten(listener);
  }

  close() {
    // one final flush for last measure!
    this.flush();
    this.shouldRetry = false;
    this.socket.close();
  }
}

/* */

interface SurClientConfig {
  requester?: (url: string, body: string) => Promise<string>;
}

const defaultRequester = (url, body) =>
  fetch(url, {
    method: "post",
    body,
  }).then((response) => response.text());

export function buildRpcHandler<Req, Res>(
  requestName: string,
  requestNode: SurNode<Req>,
  responseNode: SurNode<Res>
) {
  return function Request(value: Req): Promise<Res> {
    return this.request(requestName, value, requestNode, responseNode);
  };
}

export function buildChannelHandler<Req, Res>(
  requestName: string,
  incomingNode: SurNode<Req>,
  outgoingNode: SurNode<Res>
) {
  return function Connect(): Promise<Res> {
    return this.connect(requestName, incomingNode, outgoingNode);
  };
}

export class SurClient {
  constructor(baseUrl: string, surClientConfig?: SurClientConfig) {
    this.baseUrl = baseUrl;
    this.requester = surClientConfig.requester || defaultRequester;
  }

  baseUrl: string;
  surpcApiNamespace = "sur-api";
  requester: (url: string, body: string) => Promise<string>;

  request<Req, Res>(
    requestName: string,
    requestValue: Req,
    requestNode: SurNode<Req>,
    responseNode: SurNode<Res>
  ): Promise<Res> {
    const targetUrl = `${this.baseUrl}/${this.surpcApiNamespace}/${requestName}`;
    const body = requestNode.serialize(requestValue);
    if (!body) {
      throw "Unacceptable Body Type";
    }
    return this.requester(targetUrl, body).then((result) => {
      return responseNode.deserialize(result);
    });
  }

  connect<Send, Recv>(requestName: string): {};
}
