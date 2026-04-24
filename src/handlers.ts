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

export function createRoom(input: CreateRoomInput): void {
  throw new Error("Not Implemented");
}

export function getRoom(joinCode: string): void {
  throw new Error("Not Implemented");
}

export function addPeer(input: AddPeerInput): void {
  throw new Error("Not Implemented");
}

export function removePeer(input: RemovePeerInput): void {
  throw new Error("Not Implemented");
}
