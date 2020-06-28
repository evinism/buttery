import { SnailBookClient } from "./buttery-genfiles/__ts__/api.browser";

export const client = new SnailBookClient("http://localhost:3000", {
  rpc: {
    credentials: "include",
  },
});
