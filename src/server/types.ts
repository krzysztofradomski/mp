import WebSocket from "ws";

export const itemTypes = [
  "red",
  "green",
  "blue",
  "yellow",
  "pink",
  "orange",
  null,
] as const;
export type ItemType = (typeof itemTypes)[number];

export type Cell = [number, number];
export type Board = ItemType[][];

export interface Player {
  id: string;
  name: string;
  socket: WebSocket | undefined;
  score: number;
}

export interface Game {
  id: string;
  players: [Player, Player];
  board: Board;
  endTime: number;
}

export interface Move {
  playerId: string;
  fromCell: Cell;
  toCell: Cell;
  timestamp: number;
}

export interface IGameController {
  addToQueue(player: Player): void;
  handleMove(gameId: string, move: Move): void;
  removePlayer(playerId: string): void;
  getGameState(gameId: string): Game | null;
  gameExists(gameId: string): boolean;
  getQueueLength(): number;
  reconnectPlayer(playerId: string, socket: WebSocket): boolean;
}
