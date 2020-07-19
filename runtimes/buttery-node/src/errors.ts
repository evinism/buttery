import { RequestHandler } from "express";
import * as http from "http";

// All exceptions buttery expects are ButteryErrors.
// All exceptions not in this class are rethrown.
export class GenericButteryError extends Error {
  constructor(code: number = 500, message?: string) {
    super(message);
    Object.setPrototypeOf(this, GenericButteryError.prototype);
    this.butteryStatus = code;
  }
  butteryStatus = 500;
}

// 400s
export class BadRequestError extends GenericButteryError {
  constructor(message?: string) {
    super(400, message);
  }
}
export class NotFoundError extends GenericButteryError {
  constructor(message?: string) {
    super(404, message);
  }
}

// 500s
export class AppError extends GenericButteryError {
  constructor(message?: string) {
    super(500, message);
  }
}

export class NotImplementedError extends GenericButteryError {
  constructor(message?: string) {
    super(501, message);
  }
}

export const handleButteryExceptions = (
  headers: {
    [key: string]: string;
  } = {}
) => <
  F extends (
    request: http.IncomingMessage,
    response: http.ServerResponse
  ) => Promise<any>
>(
  func: F
) => (request: http.IncomingMessage, response: http.ServerResponse) => {
  return func(request, response).catch((e) => {
    if (e instanceof GenericButteryError) {
      response.writeHead(
        e.butteryStatus,
        Object.assign({ "Content-Type": "text/plain" }, headers)
      );
      response.end(e.message);
    } else {
      throw e;
    }
  });
};
