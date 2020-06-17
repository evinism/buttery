import * as http from "http";
import { BUTTER_NAMESPACE } from "./constants";
import { Stream } from "stream";

export function isButterPath(request: http.IncomingMessage) {
  const url = new URL(request.url || "", `http://${request.headers.host}`);
  const path = url.pathname.split("/").slice(1);
  if (path[0] !== BUTTER_NAMESPACE) {
    return false;
  }
  return true;
}

// Thanks stackoverflow!
export function streamToString(stream: Stream): Promise<string> {
  const chunks: Buffer[] = [];
  return new Promise((resolve, reject) => {
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
  });
}

/* Utils */
export class Pipe<T> {
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
