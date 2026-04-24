import { WebSocketServer, WebSocket } from "ws";
import { rooms } from "./rooms.js";

enum MessageType {
  JOIN = "JOIN",
  RELAY = "RELAY",
  LEAVE = "LEAVE",
}

type JoinMessage = {
  type: MessageType.JOIN;
  room: string;
};

type RelayMessage = {
  type: MessageType.RELAY;
  targetPeerId: number;
  data: string;
};

type LeaveMessage = {
  type: MessageType.LEAVE;
};

type ClientMessage = JoinMessage | RelayMessage | LeaveMessage;

const webSocketServer = new WebSocketServer({
  port: 8080,
});

let counter = 0;

const peerToSocketMap = new Map<number, WebSocket>();
const roomMap = rooms;

webSocketServer.on("connection", (socket) => {
  counter++;
  const peerId = counter;
  peerToSocketMap.set(peerId, socket);
  console.log(`peer ${peerId} connected`);

  socket.send(JSON.stringify({ type: "id_assigned", id: peerId }));

  socket.on("message", (data) => {
    try {
      const message = JSON.parse(data.toString());
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
