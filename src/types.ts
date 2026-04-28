export enum MessageType {
  CREATE = "CREATE",
  JOIN = "JOIN",
  RELAY = "RELAY",
  LEAVE = "LEAVE",
}

export enum ServerMessageType {
  ID_ASSIGNED = "ID_ASSIGNED",
  ROOM_JOINED = "ROOM_JOINED",
  PEER_CONNECTED = "PEER_CONNECTED",
  PEER_DISCONNECTED = "PEER_DISCONNECTED",
  RELAY = "RELAY",
  ERROR = "ERROR",
}

export type CreateRoomMessage = {
  type: MessageType.CREATE;
};

export type JoinRoomMessage = {
  type: MessageType.JOIN;
  joinCode: string;
};

export type RelayMessage = {
  type: MessageType.RELAY;
  targetPeerId: number;
  data: string;
};

export type LeaveMessage = {
  type: MessageType.LEAVE;
};

export type ClientMessage =
  | CreateRoomMessage
  | JoinRoomMessage
  | RelayMessage
  | LeaveMessage;
