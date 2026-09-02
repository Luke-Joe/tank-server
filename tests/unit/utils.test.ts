import type { WebSocket } from "ws";
import { getPeerSocket } from "../../src/peers.js";
import { broadcast, send } from "../../src/utils.js";

vi.mock("../../src/peers.js", () => ({
  getPeerSocket: vi.fn(),
}));

const getPeerSocketMock = vi.mocked(getPeerSocket);

function createSocket(): WebSocket {
  return {
    send: vi.fn(),
  } as unknown as WebSocket;
}

beforeEach(() => {
  getPeerSocketMock.mockReset();
});

describe("broadcast", () => {
  const payload = { type: "TEST" };

  let firstSocket: WebSocket;
  let secondSocket: WebSocket;
  let thirdSocket: WebSocket;
  let sockets: Map<number, WebSocket>;

  beforeEach(() => {
    firstSocket = createSocket();
    secondSocket = createSocket();
    thirdSocket = createSocket();

    sockets = new Map<number, WebSocket>([
      [1, firstSocket],
      [2, secondSocket],
      [3, thirdSocket],
    ]);

    getPeerSocketMock.mockImplementation((peerId) => {
      return sockets.get(peerId);
    });
  });

  it("sends a message to all peers in a room", () => {
    broadcast([1, 2, 3], payload);

    expect(firstSocket.send).toHaveBeenCalledExactlyOnceWith(
      JSON.stringify(payload),
    );
    expect(secondSocket.send).toHaveBeenCalledExactlyOnceWith(
      JSON.stringify(payload),
    );
    expect(thirdSocket.send).toHaveBeenCalledExactlyOnceWith(
      JSON.stringify(payload),
    );
  });

  it("should not send a message to a peer that is excluded", () => {
    broadcast([1, 2, 3], payload, 2);

    expect(firstSocket.send).toHaveBeenCalledExactlyOnceWith(
      JSON.stringify(payload),
    );
    expect(secondSocket.send).not.toHaveBeenCalled();
    expect(thirdSocket.send).toHaveBeenCalledExactlyOnceWith(
      JSON.stringify(payload),
    );
  });

  it("continues broadcasing when a peer does not have a socket", () => {
    sockets.delete(2);

    broadcast([1, 2, 3], payload);

    expect(firstSocket.send).toHaveBeenCalledExactlyOnceWith(
      JSON.stringify(payload),
    );
    expect(secondSocket.send).not.toHaveBeenCalled();
    expect(thirdSocket.send).toHaveBeenCalledExactlyOnceWith(
      JSON.stringify(payload),
    );
  });
});

describe("send", () => {
  it("sends a message to a peer's socket", () => {
    const socket = createSocket();
    const payload = {
      type: "TEST",
      peerId: 42,
    };

    send(socket, payload);

    expect(socket.send).toHaveBeenCalledExactlyOnceWith(
      JSON.stringify(payload),
    );
  });
});
