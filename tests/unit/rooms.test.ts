import { afterEach, describe, expect, it } from "vitest";

import { createRoom, rooms } from "../../src/rooms.js";

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
});
