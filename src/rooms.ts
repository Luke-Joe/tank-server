export const MAX_PEERS = 4;

interface Room {
  name: string;
  peerIds: number[];
  hostId: number;
  maxPeers: number;
  joinCode: string;
}

export const rooms = new Map<string, Room>();
