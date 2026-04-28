import { WebSocket } from "ws";

export function send(socket: WebSocket, payload: object): void {
  socket.send(JSON.stringify(payload));
}
