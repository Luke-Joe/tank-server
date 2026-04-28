import { WebSocket } from "ws";

import type {
  CreateRoomMessage,
  JoinRoomMessage,
  RelayMessage,
} from "./types.js";

interface BaseMessageInput {
  socket: WebSocket;
  peerId: number;
}

export interface HandleCreateInput extends BaseMessageInput {
  message: CreateRoomMessage;
}
export interface HandleJoinInput extends BaseMessageInput {
  message: JoinRoomMessage;
}

export interface HandleRelayInput extends BaseMessageInput {
  message: RelayMessage;
}

export interface HandleLeaveInput extends BaseMessageInput {}

export function handleCreate(input: HandleCreateInput): void {
  throw new Error("not implemented");
}

export function handleJoin(input: HandleJoinInput): void {
  throw new Error("not implemented");
}

export function handleRelay(input: HandleRelayInput): void {
  throw new Error("not implemented");
}

export function handleLeave(input: HandleLeaveInput): void {
  throw new Error("not implemented");
}
