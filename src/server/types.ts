import WebSocket from "ws";
export enum ItemType {
  Red = "red",
  Green = "green",
  Blue = "blue",
  Pink = "pink",
  Orange = "orange",
  Yellow = "yellow",
}

export type Cell = [number, number];
export type Board = ItemType[][];

export interface Player {
  id: string;
  name: string;
  socket: WebSocket;
  score: number;
}

export interface Game {
  id: string;
  players: [Player, Player];
  board: Board;
  lastUpdateTime: number;
  endTime: number;
}

export interface Move {
  playerId: string;
  fromCell: Cell;
  toCell: Cell;
  timestamp: number;
}

// Controller
export interface IGameController {
  addToQueue(player: Player): void;
  handleMove(gameId: string, move: Move): void;
  removePlayer(playerId: string): void;
  getGameState(gameId: string): Game | null;
  gameExists(gameId: string): boolean;
  getQueueLength(): number;
  reconnectPlayer(playerId: string, socket: WebSocket): boolean;
}
