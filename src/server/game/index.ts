import WebSocket from "ws";
import { Player, Move, Game, IGameController } from "../types";
import { GameManager } from "./gameManager";
import { MessageSender } from "./messageSender";
import { MoveProcessor } from "./moveProcessor";
import { QueueManager } from "./queueManager";
import { GameStateManager } from "./stateManager";

export class GameController implements IGameController {
  private queueManager: QueueManager;
  private gameManager: GameManager;
  private moveProcessor: MoveProcessor;
  private gameStateManager: GameStateManager;
  private messageSender: MessageSender;
  private gameLoopTimeout: NodeJS.Timeout | null = null;

  constructor() {
    this.queueManager = new QueueManager();
    this.gameManager = new GameManager();
    this.moveProcessor = new MoveProcessor();
    this.gameStateManager = new GameStateManager();
    this.messageSender = new MessageSender();
    this.startGameLoop();
  }

  private startGameLoop() {
    const gameLoop = () => {
      this.processGames();
      this.checkGameTimers();
      this.gameLoopTimeout = setTimeout(gameLoop, 16); // Approx. 60 FPS
    };
    this.gameLoopTimeout = setTimeout(gameLoop, 16);
  }

  getGameIdForPlayer(playerId: string): string | undefined {
    return this.gameManager.getGameIdForPlayer(playerId);
  }

  addToQueue(player: Player): void {
    this.queueManager.addToQueue(player);
    this.checkQueue();
  }

  handleMove(gameId: string, move: Move): void {
    const game = this.gameManager.getGame(gameId);
    if (!game) {
      throw new Error("Game not found");
    }
    if (!this.moveProcessor.isValidMove(game, move)) {
      throw new Error("Invalid move");
    }
    this.moveProcessor.addMove(gameId, move);
  }

  removePlayer(playerId: string): void {
    this.queueManager.removeFromQueue(playerId);
    const gameId = this.gameManager.getGameIdForPlayer(playerId);
    if (gameId) {
      const game = this.gameManager.getGame(gameId);
      if (game) {
        const otherPlayer = game.players.find((p) => p.id !== playerId);
        if (otherPlayer) {
          this.endGame(game, otherPlayer.id, "playerDisconnected");
        }
      }
    }
  }

  getGameState(gameId: string): Game | null {
    return this.gameManager.getGame(gameId) || null;
  }

  gameExists(gameId: string): boolean {
    return this.gameManager.getGame(gameId) !== undefined;
  }

  getQueueLength(): number {
    return this.queueManager.getQueueLength();
  }

  reconnectPlayer(playerId: string, socket: WebSocket): boolean {
    const gameId = this.gameManager.getGameIdForPlayer(playerId);
    if (gameId) {
      const game = this.gameManager.getGame(gameId);
      if (game) {
        const player = game.players.find((p) => p.id === playerId);
        if (player) {
          player.socket = socket;
          this.messageSender.sendGameUpdate(game);
          return true;
        }
      }
    }
    return false;
  }

  private checkQueue(): void {
    const players = this.queueManager.getPlayersForGame();
    if (players) {
      const [player1, player2] = players;
      const game = this.gameManager.createGame(player1, player2);
      this.messageSender.sendGameStart(game);
    }
  }

  private processGames(): void {
    for (const game of this.gameManager.getAllGames()) {
      const updateNeeded = this.moveProcessor.processBufferedMoves(
        game,
        this.messageSender
      );
      if (updateNeeded) {
        this.messageSender.sendGameUpdate(game);
      }
      if (this.gameStateManager.isGameOver(game.board)) {
        const winner = this.gameStateManager.getWinner(game);
        this.endGame(game, winner.id, "noMoreMoves");
      }
    }
  }

  private checkGameTimers(): void {
    const now = Date.now();
    for (const game of this.gameManager.getAllGames()) {
      if (now >= game.endTime) {
        const winner = this.gameStateManager.getWinner(game);
        this.endGame(game, winner.id, "timeUp");
      }
    }
  }

  private endGame(game: Game, winnerId: string, reason: string): void {
    this.messageSender.sendGameOver(game, winnerId, reason);
    this.gameManager.removeGame(game.id);
  }
}
