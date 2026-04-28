import { WebSocketServer, WebSocket } from "ws";
import { rooms } from "./rooms.js";
import { MessageType } from "./types.js";
import {
  handleCreate,
  handleJoin,
  handleLeave,
  handleRelay,
} from "./handlers.js";

const webSocketServer = new WebSocketServer({
  port: 8080,
});

let counter = 0;

const peerToSocketMap = new Map<number, WebSocket>();

webSocketServer.on("connection", (socket) => {
  counter++;
  const peerId = counter;
  peerToSocketMap.set(peerId, socket);
  console.log(`peer ${peerId} connected`);

  socket.send(JSON.stringify({ type: "id_assigned", id: peerId }));

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
    peerToSocketMap.delete(peerId);
    console.log(`peer ${peerId} disconnected`);
  });
});
