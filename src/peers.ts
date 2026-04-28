import { WebSocket } from "ws";

export const peerToSocketMap = new Map<number, WebSocket>();

export function addPeerSocket(peerId: number, socket: WebSocket): void {
  peerToSocketMap.set(peerId, socket);
}

export function removePeerSocket(peerId: number): void {
  peerToSocketMap.delete(peerId);
}

export function getPeerSocket(peerId: number): WebSocket | undefined {
  return peerToSocketMap.get(peerId);
}
