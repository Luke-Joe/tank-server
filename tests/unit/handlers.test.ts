import type { WebSocket } from "ws";
import {
  handleCreate,
  handleJoin,
  handleLeave,
  handleRelay,
} from "../../src/handlers.js";
import {
  addPeerSocket,
  getPeerRoom,
  removePeerRoom,
  removePeerSocket,
  setPeerRoom,
} from "../../src/peers.js";
import { addPeer, createRoom, rooms } from "../../src/rooms.js";
import {
  MessageType,
  ServerMessageType,
  type RelayMessage,
} from "../../src/types.js";

const testPeerIds = new Set<number>();

function createSocket(): WebSocket {
  return { send: vi.fn() } as unknown as WebSocket;
}

function registerSocket(peerId: number): WebSocket {
  const socket = createSocket();
  testPeerIds.add(peerId);
  addPeerSocket(peerId, socket);
  return socket;
}

function registerSockets(peerIds: number[]): Map<number, WebSocket> {
  return new Map(peerIds.map((peerId) => [peerId, registerSocket(peerId)]));
}

type SentMessage = {
  type: ServerMessageType;
  [key: string]: unknown;
};

function sentMessages(socket: WebSocket): SentMessage[] {
  return vi
    .mocked(socket.send)
    .mock.calls.map(([message]) => JSON.parse(message as string) as SentMessage);
}

function createRoomWithPeers(hostId = 1, memberIds: number[] = []) {
  const room = createRoom({ hostId });
  testPeerIds.add(hostId);
  setPeerRoom({ peerId: hostId, room });

  for (const peerId of memberIds) {
    testPeerIds.add(peerId);
    addPeer({ room, peerId });
    setPeerRoom({ peerId, room });
  }

  return room;
}

function relayMessage(targetPeerId: number, data = "payload"): RelayMessage {
  return { type: MessageType.RELAY, targetPeerId, data };
}

beforeEach(() => {
  vi.spyOn(console, "log").mockImplementation(() => {});
});

afterEach(() => {
  rooms.clear();
  for (const peerId of testPeerIds) {
    removePeerRoom(peerId);
    removePeerSocket(peerId);
  }
  testPeerIds.clear();
});

describe("handleCreate", () => {
  it("creates a room containing the requesting peer", () => {
    const socket = registerSocket(1);

    handleCreate({ peerId: 1, socket, message: { type: MessageType.CREATE } });

    expect(rooms.size).toBe(1);
    expect([...rooms.values()][0]?.peerIds).toEqual([1]);
  });

  it("associates the peer with the room", () => {
    const socket = registerSocket(1);

    handleCreate({ peerId: 1, socket, message: { type: MessageType.CREATE } });

    expect(getPeerRoom(1)).toBe([...rooms.values()][0]);
  });

  it("sends ROOM_JOINED", () => {
    const socket = registerSocket(1);

    handleCreate({ peerId: 1, socket, message: { type: MessageType.CREATE } });

    const room = [...rooms.values()][0];
    expect(sentMessages(socket)).toEqual([
      {
        type: ServerMessageType.ROOM_JOINED,
        joinCode: room?.joinCode,
        peers: [1],
        hostId: 1,
      },
    ]);
  });

  it("returns an error when the peer is already in a room", () => {
    const socket = registerSocket(1);
    createRoomWithPeers(1);

    handleCreate({ peerId: 1, socket, message: { type: MessageType.CREATE } });

    expect(sentMessages(socket)).toEqual([
      { type: ServerMessageType.ERROR, message: "Peer is already in a room" },
    ]);
    expect(rooms.size).toBe(1);
  });
});

describe("handleJoin", () => {
  it("returns an error if the room does not exist", () => {
    const socket = registerSocket(2);

    handleJoin({
      peerId: 2,
      socket,
      message: { type: MessageType.JOIN, joinCode: "MISSING" },
    });

    expect(sentMessages(socket)).toEqual([
      { type: ServerMessageType.ERROR, message: "Room not found" },
    ]);
  });

  it("returns an error if the room is full", () => {
    const socket = registerSocket(5);
    const room = createRoomWithPeers(1, [2, 3, 4]);

    handleJoin({
      peerId: 5,
      socket,
      message: { type: MessageType.JOIN, joinCode: room.joinCode },
    });

    expect(room.peerIds).toEqual([1, 2, 3, 4]);
    expect(sentMessages(socket)).toEqual([
      { type: ServerMessageType.ERROR, message: "Room is full" },
    ]);
  });

  it("returns an error if the peer is already in another room", () => {
    const socket = registerSocket(2);
    createRoomWithPeers(1, [2]);
    const targetRoom = createRoomWithPeers(3);

    handleJoin({
      peerId: 2,
      socket,
      message: { type: MessageType.JOIN, joinCode: targetRoom.joinCode },
    });

    expect(sentMessages(socket)).toEqual([
      { type: ServerMessageType.ERROR, message: "Peer is already in a room" },
    ]);
    expect(targetRoom.peerIds).toEqual([3]);
  });

  it("adds the peer and associates it with the room", () => {
    const socket = registerSocket(2);
    const room = createRoomWithPeers(1);

    handleJoin({
      peerId: 2,
      socket,
      message: { type: MessageType.JOIN, joinCode: room.joinCode },
    });

    expect(room.peerIds).toEqual([1, 2]);
    expect(getPeerRoom(2)).toBe(room);
  });

  it("broadcasts PEER_CONNECTED to existing peers", () => {
    const sockets = registerSockets([1, 3, 2]);
    const room = createRoomWithPeers(1, [3]);

    handleJoin({
      peerId: 2,
      socket: sockets.get(2)!,
      message: { type: MessageType.JOIN, joinCode: room.joinCode },
    });

    expect(sentMessages(sockets.get(1)!)).toEqual([
      { type: ServerMessageType.PEER_CONNECTED, peerId: 2 },
    ]);
    expect(sentMessages(sockets.get(3)!)).toEqual([
      { type: ServerMessageType.PEER_CONNECTED, peerId: 2 },
    ]);
    expect(sentMessages(sockets.get(2)!)).toHaveLength(1);
  });

  it("sends ROOM_JOINED to the joining peer", () => {
    const socket = registerSocket(2);
    const room = createRoomWithPeers(1);

    handleJoin({
      peerId: 2,
      socket,
      message: { type: MessageType.JOIN, joinCode: room.joinCode },
    });

    expect(sentMessages(socket)).toContainEqual({
      type: ServerMessageType.ROOM_JOINED,
      joinCode: room.joinCode,
      peers: [1, 2],
      hostId: 1,
    });
  });
});

describe("handleRelay", () => {
  it("returns an error when the sender has no room", () => {
    const socket = registerSocket(1);

    handleRelay({ peerId: 1, socket, message: relayMessage(0) });

    expect(sentMessages(socket)).toEqual([
      { type: ServerMessageType.ERROR, message: "Room not found" },
    ]);
  });

  it("broadcasts to every other peer in the room", () => {
    const senderSocket = registerSocket(1);
    const secondSocket = registerSocket(2);
    const thirdSocket = registerSocket(3);
    createRoomWithPeers(1, [2, 3]);

    handleRelay({
      peerId: 1,
      socket: senderSocket,
      message: relayMessage(0, "hello"),
    });

    const expected = { type: ServerMessageType.RELAY, from: 1, data: "hello" };
    expect(sentMessages(secondSocket)).toEqual([expected]);
    expect(sentMessages(thirdSocket)).toEqual([expected]);
    expect(senderSocket.send).not.toHaveBeenCalled();
  });

  it("returns an error when a direct target has no socket", () => {
    const senderSocket = registerSocket(1);
    createRoomWithPeers(1, [2]);

    handleRelay({ peerId: 1, socket: senderSocket, message: relayMessage(2) });

    expect(sentMessages(senderSocket)).toEqual([
      {
        type: ServerMessageType.ERROR,
        message: "Socket not found for peer: 2",
      },
    ]);
  });

  it("relays directly to a target in the same room", () => {
    const senderSocket = registerSocket(1);
    const targetSocket = registerSocket(2);
    createRoomWithPeers(1, [2]);

    handleRelay({
      peerId: 1,
      socket: senderSocket,
      message: relayMessage(2, "direct"),
    });

    expect(sentMessages(targetSocket)).toEqual([
      { type: ServerMessageType.RELAY, from: 1, data: "direct" },
    ]);
    expect(senderSocket.send).not.toHaveBeenCalled();
  });

  it("rejects a direct target in another room", () => {
    const senderSocket = registerSocket(1);
    const targetSocket = registerSocket(2);
    createRoomWithPeers(1);
    createRoomWithPeers(2);

    handleRelay({ peerId: 1, socket: senderSocket, message: relayMessage(2) });

    expect(sentMessages(senderSocket)).toEqual([
      {
        type: ServerMessageType.ERROR,
        message: "Target peer 2 is not in the same room",
      },
    ]);
    expect(targetSocket.send).not.toHaveBeenCalled();
  });
});

describe("handleLeave", () => {
  it("returns an error when the peer has no room", () => {
    const socket = registerSocket(1);

    handleLeave({ peerId: 1, socket });

    expect(sentMessages(socket)).toEqual([
      { type: ServerMessageType.ERROR, message: "Room not found" },
    ]);
  });

  it("removes a non-host peer and notifies the remaining peers", () => {
    const hostSocket = registerSocket(1);
    const leavingSocket = registerSocket(2);
    const room = createRoomWithPeers(1, [2]);

    handleLeave({ peerId: 2, socket: leavingSocket });

    expect(room.peerIds).toEqual([1]);
    expect(getPeerRoom(2)).toBeUndefined();
    expect(sentMessages(hostSocket)).toEqual([
      { type: ServerMessageType.PEER_DISCONNECTED, peerId: 2 },
    ]);
  });

  it("closes the room and clears associations when the host leaves", () => {
    const hostSocket = registerSocket(1);
    const peerSocket = registerSocket(2);
    const room = createRoomWithPeers(1, [2]);

    handleLeave({ peerId: 1, socket: hostSocket });

    expect(rooms.has(room.joinCode)).toBe(false);
    expect(room.peerIds).toEqual([]);
    expect(getPeerRoom(1)).toBeUndefined();
    expect(getPeerRoom(2)).toBeUndefined();
    expect(sentMessages(peerSocket)).toEqual([
      { type: ServerMessageType.ROOM_CLOSED },
    ]);
  });

  it("deletes the room when its last peer leaves", () => {
    const socket = registerSocket(1);
    const room = createRoomWithPeers(1);

    handleLeave({ peerId: 1, socket });

    expect(rooms.has(room.joinCode)).toBe(false);
    expect(getPeerRoom(1)).toBeUndefined();
  });
});
