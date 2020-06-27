import { SnailBookClient } from "./buttery-genfiles/__ts__/api.browser";

export const client = new SnailBookClient("http://localhost:3000");
// silly workaround for proxy in CRA not working properly
export const newsFeed = new SnailBookClient("http://localhost:8080").Feed();
