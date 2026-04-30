import { WebSocket } from "ws";
import type { Room } from "./rooms.js";

export const BROADCAST_TARGET = 0;

const peerToSocketMap = new Map<number, WebSocket>();
const peerToRoomMap = new Map<number, Room>();

export interface SetPeerRoomInput {
  peerId: number;
  room: Room;
}

export function addPeerSocket(peerId: number, socket: WebSocket): void {
  peerToSocketMap.set(peerId, socket);
}

export function removePeerSocket(peerId: number): void {
  peerToSocketMap.delete(peerId);
}

export function getPeerSocket(peerId: number): WebSocket | undefined {
  return peerToSocketMap.get(peerId);
}

export function setPeerRoom({ peerId, room }: SetPeerRoomInput): void {
  peerToRoomMap.set(peerId, room);
}

export function removePeerRoom(peerId: number): void {
  peerToRoomMap.delete(peerId);
}

export function getPeerRoom(peerId: number): Room | undefined {
  return peerToRoomMap.get(peerId);
}
