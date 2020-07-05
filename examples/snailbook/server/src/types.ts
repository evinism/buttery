import * as http from "http";

export type UserAnnotation = {
  id: string;
  name: string;
  username: string;
};

export type LoggedInRequest = http.IncomingMessage & { user?: UserAnnotation };
