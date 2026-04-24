import { WebSocketServer, WebSocket } from "ws";

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

  socket.on("close", () => {
    peerToSocketMap.delete(peerId);
    console.log(`peer ${peerId} disconnected`);
  });
});
