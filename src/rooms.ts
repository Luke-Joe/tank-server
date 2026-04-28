export const MAX_PEERS = 4;

interface Room {
  peerIds: number[];
  hostId: number;
  joinCode: string;
}

export interface CreateRoomInput {
  hostId: number;
}

export interface AddPeerInput {
  joinCode: string;
  peerId: number;
}

export interface RemovePeerInput {
  joinCode: string;
  peerId: number;
}

export const rooms = new Map<string, Room>();

export function createRoom(input: CreateRoomInput): Room {
  const joinCode = generateJoinCode();

  const room: Room = {
    joinCode,
    hostId: input.hostId,
    peerIds: [input.hostId],
  };

  rooms.set(joinCode, room);

  return room;
}

export function getRoom(joinCode: string): Room {
  const room = rooms.get(joinCode);

  if (!room) {
    throw new Error(`No rooms with joinCode: ${joinCode}`);
  }

  return room;
}

export function addPeer(input: AddPeerInput): Room {
  const room = getRoom(input.joinCode);

  room.peerIds.push(input.peerId);

  return room;
}

export function removePeer(input: RemovePeerInput): void {
  const room = getRoom(input.joinCode);

  room.peerIds = room.peerIds.filter((id) => id !== input.peerId);

  throw new Error("Not Implemented");
}

function generateJoinCode(): string {
  let joinCode: string;

  do {
    joinCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  } while (rooms.has(joinCode));

  return joinCode;
}
