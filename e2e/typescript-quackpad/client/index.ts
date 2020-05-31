import WebSocket from "websocket";
//import fetch from "node-fetch";

globalThis.WebSocket = WebSocket.w3cwebsocket as any;
//globalThis.fetch = fetch;

import SurClient from "./sur-genfiles/quackpad.sur.gen";

const client = new SurClient("localhost:4433");
const connection = client.NoteUpdate();

connection.send({
  id: "note-id",
  contents: "steam codes here",
});
