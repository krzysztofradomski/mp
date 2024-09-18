import { v4 as uuidv4 } from "uuid";
import { Game, Player } from "../types";
import { createEmptyBoard } from "../utils";

export class GameManager {
  private games: Map<string, Game> = new Map();
  private playerToGame: Map<string, string> = new Map();

  createGame(player1: Player, player2: Player): Game {
    const gameId = uuidv4();
    const game: Game = {
      id: gameId,
      players: [player1, player2],
      board: createEmptyBoard(),
      lastUpdateTime: Date.now(),
      endTime: Date.now() + 60000, // Game ends 60 seconds from now
    };
    this.games.set(gameId, game);
    this.playerToGame.set(player1.id, gameId);
    this.playerToGame.set(player2.id, gameId);
    return game;
  }

  getGame(gameId: string): Game | undefined {
    return this.games.get(gameId);
  }

  getGameIdForPlayer(playerId: string): string | undefined {
    return this.playerToGame.get(playerId);
  }

  removeGame(gameId: string): void {
    const game = this.games.get(gameId);
    if (game) {
      game.players.forEach((player) => this.playerToGame.delete(player.id));
      this.games.delete(gameId);
    }
  }

  getAllGames(): Game[] {
    return Array.from(this.games.values());
  }
}
