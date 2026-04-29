import { WebSocket } from "ws";

import {
  ServerMessageType,
  type CreateRoomMessage,
  type JoinRoomMessage,
  type RelayMessage,
} from "./types.js";
import {
  addPeer,
  createRoom,
  getRoom,
  MAX_PEERS,
  removePeer,
} from "./rooms.js";
import { broadcast, send } from "./utils.js";
import {
  BROADCAST_TARGET,
  getPeerRoom,
  getPeerSocket,
  removePeerRoom,
  setPeerRoom,
} from "./peers.js";

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
      message: "Room not found",
    });

    return;
  }

  if (room.peerIds.length >= MAX_PEERS) {
    send(socket, {
      type: ServerMessageType.ERROR,
      message: "Room is full",
    });

    return;
  }

  const existingPeers = [...room.peerIds];
  addPeer({ room, peerId });
  setPeerRoom({ peerId, room });

  broadcast(existingPeers, {
    type: ServerMessageType.PEER_CONNECTED,
    peerId,
  });

  send(socket, {
    type: ServerMessageType.ROOM_JOINED,
    joinCode: room.joinCode,
    peers: room.peerIds,
    hostId: room.hostId,
  });
}

export function handleRelay(input: HandleRelayInput): void {
  const { socket, peerId, message } = input;

  const targetPeerId = message.targetPeerId;

  if (targetPeerId === BROADCAST_TARGET) {
    const room = getPeerRoom(peerId);

    if (!room) {
      send(socket, {
        type: ServerMessageType.ERROR,
        message: "Room not found",
      });

      return;
    }

    const peerIds = room.peerIds;

    broadcast(
      peerIds,
      {
        type: ServerMessageType.RELAY,
        from: peerId,
        data: message.data,
      },
      peerId,
    );

    return;
  }

  const targetSocket = getPeerSocket(targetPeerId);

  if (!targetSocket) {
    send(socket, {
      type: ServerMessageType.ERROR,
      message: `Socket not found for peer: ${targetPeerId}`,
    });

    return;
  }

  send(targetSocket, {
    type: ServerMessageType.RELAY,
    from: peerId,
    data: message.data,
  });
}

export function handleLeave(input: HandleLeaveInput): void {
  const { socket, peerId } = input;

  const room = getPeerRoom(peerId);

  if (!room) {
    send(socket, {
      type: ServerMessageType.ERROR,
      message: `Room not found`,
    });

    return;
  }

  removePeerRoom(peerId);
  removePeer({ room, peerId });

  broadcast(room.peerIds, {
    type: ServerMessageType.PEER_DISCONNECTED,
    peerId,
  });
}
