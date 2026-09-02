import { afterEach, describe, expect, it } from "vitest";

import { addPeer, createRoom, removePeer, rooms } from "../../src/rooms.js";

afterEach(() => {
  rooms.clear();
});

describe("createRoom", () => {
  it("creates a room containing its host", () => {
    const room = createRoom({ hostId: 67 });

    expect(room.hostId).toBe(67);
    expect(room.peerIds).toEqual([67]);
    expect(room.joinCode).toMatch(/^[A-Z0-9]{6}$/);
  });

  it("adds the room to the rooms map", () => {
    const room = createRoom({ hostId: 67 });

    expect(rooms.get(room.joinCode)).toBe(room);
  });
});

describe("addPeer", () => {
  it("adds a peer to to an existing room", () => {
    const room = createRoom({ hostId: 67 });

    const result = addPeer({ room, peerId: 2 });

    expect(result).toBe(room);
    expect(room.peerIds).toEqual([67, 2]);
  });
});

describe("removePeer", () => {
  it("removes a peer from an existing room", () => {
    const room = createRoom({ hostId: 67 });

    addPeer({ room, peerId: 2 });
    addPeer({ room, peerId: 3 });

    removePeer({
      room,
      peerId: 2,
    });

    expect(room.peerIds).toEqual([67, 3]);
  });
});

describe("getRoom", () => {
  it("returns a room by its join code", () => {
    const room = createRoom({ hostId: 67 });

    const result = rooms.get(room.joinCode);

    expect(result).toBe(room);
  });
});
