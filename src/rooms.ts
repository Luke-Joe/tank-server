export const MAX_PEERS = 4;

export interface Room {
  peerIds: number[];
  hostId: number;
  joinCode: string;
}

export interface CreateRoomInput {
  hostId: number;
}

export interface AddPeerInput {
  room: Room;
  peerId: number;
}

export interface RemovePeerInput {
  room: Room;
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

export function getRoom(joinCode: string): Room | undefined {
  return rooms.get(joinCode);
}

export function addPeer(input: AddPeerInput): Room {
  const { room, peerId } = input;

  room.peerIds.push(peerId);

  return room;
}

export function removePeer(input: RemovePeerInput): void {
  const { room, peerId } = input;

  room.peerIds = room.peerIds.filter((id) => id !== peerId);

  if (room.peerIds.length === 0) {
    rooms.delete(room.joinCode);
  }
}

function generateJoinCode(): string {
  let joinCode: string;

  do {
    joinCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  } while (rooms.has(joinCode));

  return joinCode;
}
