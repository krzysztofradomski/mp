export const MESSAGE_TYPES = {
  QUEUE_UPDATE: "queueUpdate",
  GAME_START: "gameStart",
  GAME_UPDATE: "update",
  MERGE: "merge",
  SWAP: "swap",
  GAME_OVER: "gameOver",
  ERROR: "error",
  RECONNECT_SUCCESS: "reconnectSuccess",
  RECONNECT_FAILED: "reconnectFailed",
} as const;

export type MessageType = (typeof MESSAGE_TYPES)[keyof typeof MESSAGE_TYPES];

// TODO: properly type the payload
export function createMessage(type: MessageType, payload: any) {
  console.log("Creating message", { type, payload });
  return JSON.stringify({ type, ...payload });
}
