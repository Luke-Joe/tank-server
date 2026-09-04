import { WebSocketServer } from "ws";
import { addPeerSocket, getPeerRoom, removePeerSocket } from "./peers.js";

import { MessageType, ServerMessageType } from "./types.js";
import {
  handleCreate,
  handleJoin,
  handleLeave,
  handleRelay,
} from "./handlers.js";
import { send } from "./utils.js";
import { createServer } from "node:http";

export function createTankServer() {
  const httpServer = createServer((request, response) => {
    if (request.method === "GET" && request.url === "/health") {
      response.writeHead(200, { "Content-Type": "application/json" });

      response.end(
        JSON.stringify({
          status: "ok",
          timestamp: new Date().toISOString(),
        }),
      );

      return;
    }

    response.writeHead(404);
    response.end();
  });

  const webSocketServer = new WebSocketServer({
    server: httpServer,
  });

  let counter = 0;

  webSocketServer.on("connection", (socket) => {
    counter++;
    const peerId = counter;
    addPeerSocket(peerId, socket);
    console.log(`peer ${peerId} connected`);

    send(socket, { type: ServerMessageType.ID_ASSIGNED, id: peerId });

    socket.on("message", (data) => {
      try {
        const message = JSON.parse(data.toString());

        console.log(`peer ${peerId} ->`, message);

        switch (message.type) {
          case MessageType.CREATE:
            handleCreate({ socket, peerId, message });
            break;
          case MessageType.JOIN:
            handleJoin({ socket, peerId, message });
            break;
          case MessageType.RELAY:
            handleRelay({ socket, peerId, message });
            break;
          case MessageType.LEAVE:
            handleLeave({ socket, peerId });
            break;
          default:
            break;
        }
      } catch {
        console.log(`peer ${peerId} sent invalid JSON`);
        return;
      }
    });

    socket.on("close", () => {
      removePeerSocket(peerId);

      if (getPeerRoom(peerId)) {
        handleLeave({ peerId, socket });
      }

      console.log(`peer ${peerId} disconnected`);
    });
  });

  return { httpServer, webSocketServer };
}
