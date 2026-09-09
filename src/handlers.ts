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
  type Room,
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

interface RelayBroadcastInput extends HandleRelayInput {
  room: Room;
}

interface RelayDirectInput extends HandleRelayInput {
  targetPeerId: number;
  room: Room;
}

export function handleCreate(input: HandleCreateInput): void {
  const { peerId, socket } = input;

  const room = createRoom({ hostId: peerId });

  setPeerRoom({ peerId, room });

  send(socket, {
    type: ServerMessageType.ROOM_JOINED,
    joinCode: room.joinCode,
    peers: room.peerIds,
    hostId: room.hostId,
  });

  console.log(`peer ${peerId} created room: ${room.joinCode}`);
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

  console.log(`peer ${peerId} joined room: ${room.joinCode}`);
}

export function handleRelay(input: HandleRelayInput): void {
  const { socket, peerId, message } = input;

  const targetPeerId = message.targetPeerId;

  const room = getPeerRoom(peerId);

  if (!room) {
    send(socket, {
      type: ServerMessageType.ERROR,
      message: "Room not found",
    });

    return;
  }

  if (targetPeerId === BROADCAST_TARGET) {
    relayBroadcast({ socket, peerId, message, room });

    return;
  }

  relayDirect({ socket, peerId, message, targetPeerId, room });
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

function relayBroadcast(input: RelayBroadcastInput): void {
  const { peerId, message, room } = input;

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

function relayDirect(input: RelayDirectInput): void {
  const { socket, peerId, message, targetPeerId, room } = input;

  if (getPeerRoom(targetPeerId) !== room) {
    send(socket, {
      type: ServerMessageType.ERROR,
      message: `Target peer ${targetPeerId} is not in the same room`,
    });

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
