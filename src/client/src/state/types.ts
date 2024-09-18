import { Board, type Game } from "../utils/server-types";

export const actionTypes = {
  SET_QUEUE_POSITION: "SET_QUEUE_POSITION",
  START_GAME: "START_GAME",
  UPDATE_GAME: "UPDATE_GAME",
  HANDLE_MERGE: "HANDLE_MERGE",
  CLEAR_MERGE_EFFECT: "CLEAR_MERGE_EFFECT",
  HANDLE_SWAP: "HANDLE_SWAP",
  CLEAR_SWAP_EFFECT: "CLEAR_SWAP_EFFECT",
  END_GAME: "END_GAME",
  SET_ERROR_MESSAGE: "SET_ERROR_MESSAGE",
  SET_PLAYER_NAME: "SET_PLAYER_NAME",
  SET_SELECTED_TILE: "SET_SELECTED_TILE",
} as const;

type ActionType = (typeof actionTypes)[keyof typeof actionTypes];

export type Action = {
  type: ActionType;
  board?: Board | undefined;
  endTime?: number;
  gameOverData?: {
    reason: string;
    winner: string;
    finalScores: { [key: string]: number };
  };
  message?: unknown;
  name?: string;
  selectedTile?: [number, number] | null;
  position?: number;
  gameData?: Game & {
    scores?: { [key: string]: number };
  };
  scores?: { [key: string]: number };
  fromCell?: [number, number];
  toCell?: [number, number];
};
