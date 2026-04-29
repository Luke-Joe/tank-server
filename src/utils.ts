import { WebSocket } from "ws";
import { getPeerSocket } from "./peers.js";

export function send(socket: WebSocket, payload: object): void {
  socket.send(JSON.stringify(payload));
}

export function broadcast(
  peerIds: number[],
  payload: object,
  exclude?: number,
): void {
  for (const peerId of peerIds) {
    if (peerId === exclude) {
      return;
    }

    const socket = getPeerSocket(peerId);

    if (socket) send(socket, payload);
  }
}
