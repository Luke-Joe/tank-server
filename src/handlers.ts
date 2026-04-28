import { WebSocket } from "ws";

import {
  ServerMessageType,
  type CreateRoomMessage,
  type JoinRoomMessage,
  type RelayMessage,
} from "./types.js";
import { addPeer, createRoom, getRoom, MAX_PEERS } from "./rooms.js";
import { send } from "./utils.js";

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
  const { peerId, socket } = input;

  const room = createRoom({ hostId: peerId });

  send(socket, {
    type: ServerMessageType.ROOM_JOINED,
    joinCode: room.joinCode,
    peers: room.peerIds,
    hostId: room.hostId,
  });
}

export function handleJoin(input: HandleJoinInput): void {
  const { peerId, socket, message } = input;

  const room = getRoom(message.joinCode);

  if (!room) {
    send(socket, {
        type: ServerMessageType.ERROR,
        message: "Room not found"
    })
    
    return;
  }

  if (room.peerIds.length >= MAX_PEERS) {
    send(socket, {
        type: ServerMessageType.ERROR,
        message: "Room is full"
    })

    return;
  }
  

  addPeer({ room, peerId });

  send(socket, {
    type: ServerMessageType.PEER_CONNECTED,
    joinCode: 
  })
}

export function handleRelay(input: HandleRelayInput): void {
  throw new Error("not implemented");
}

export function handleLeave(input: HandleLeaveInput): void {
  throw new Error("not implemented");
}
