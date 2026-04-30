import { WebSocketServer } from "ws";
import { addPeerSocket, removePeerSocket } from "./peers.js";

import { MessageType, ServerMessageType } from "./types.js";
import {
  handleCreate,
  handleJoin,
  handleLeave,
  handleRelay,
} from "./handlers.js";
import { send } from "./utils.js";

const webSocketServer = new WebSocketServer({
  port: 8080,
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
    handleLeave({ peerId, socket });

    console.log(`peer ${peerId} disconnected`);
  });
});
