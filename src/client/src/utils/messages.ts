import { Board, Player } from "./server-types";

export const WS_SERVER_MESSAGE_TYPES = {
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
export type WS_SERVER_MSG_TYPE =
  (typeof WS_SERVER_MESSAGE_TYPES)[keyof typeof WS_SERVER_MESSAGE_TYPES];

// same as in the backend
export type WS_SERVER_MSG_PAYLOAD = {
  id?: string;
  gameId?: string;
  playerId?: string;
  board?: Board;
  players?: Player[];
  endTime?: number;
  reason?: string;
  winner?: string;
  finalScores?: { [key: string]: number };
  scores?: { [key: string]: number };
  fromCell?: [number, number];
  toCell?: [number, number];
  points?: number;
  timeRemaining?: number;
  position?: number;
  message?: unknown;
};

export type WS_SERVER_EVENT = {
  type: WS_SERVER_MSG_TYPE;
} & WS_SERVER_MSG_PAYLOAD;

export const WS_CLIENT_MSG_TYPES = {
  JOIN: "join",
  MOVE: "move",
  RECONNECT: "reconnect",
} as const;
export type WS_CLIENT_MSG_TYPE =
  (typeof WS_CLIENT_MSG_TYPES)[keyof typeof WS_CLIENT_MSG_TYPES];

export type WS_CLIENT_MSG_PAYLOAD = {
  gameId?: string;
  playerId?: string;
  move?: [number, number];
  name?: string;
};

export type WS_CLIENT_EVENT = {
  type: WS_CLIENT_MSG_TYPE;
} & WS_CLIENT_MSG_PAYLOAD;
