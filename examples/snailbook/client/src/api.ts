import {
  SnailBookClient,
  SnailBookLoggedOutClient,
} from "./buttery-genfiles/api.browser";

const clientConfig = {
  rpc: {
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  },
};

export const loggedOutClient = new SnailBookLoggedOutClient(
  "http://localhost:3000",
  clientConfig
);

export const client = new SnailBookClient(
  "http://localhost:3000",
  clientConfig
);
