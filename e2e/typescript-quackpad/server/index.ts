import WebSocket from "ws";
import * as http from "http";
import { attachService } from "sur-http";
import { ChatService } from "./sur-genfiles/main.gen.ts";

const server = http.createServer(() => {});

const chatService = attachService(server, ChatService);
chatService.stuff(() => {
  
});
