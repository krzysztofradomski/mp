import WebSocket from "ws";
import { v4 as uuidv4 } from "uuid";
import { createMessage, MESSAGE_TYPES } from "../shared/messages";
import { createEmptyBoard } from "./utils";
import { Player, Move, Game, Board, IGameController } from "./types";

export class GameController implements IGameController {
  private queue: Player[] = [
    {
      id: "1",
      name: "Player 1",
      socket: new WebSocket("ws://localhost:3000"),
      score: 0,
    },
  ];
  private games: Map<string, Game> = new Map();
  private moveBuffer: Map<string, Move[]> = new Map();
  private playerToGame: Map<string, string> = new Map();
  private gameLoopTimeout: NodeJS.Timeout | null = null;

  constructor() {
    this.startGameLoop();
  }

  private startGameLoop() {
    const gameLoop = () => {
      this.processBufferedMoves();
      this.checkGameTimers();
      this.gameLoopTimeout = setTimeout(gameLoop, 16); // Approx. 60 FPS
    };
    this.gameLoopTimeout = setTimeout(gameLoop, 16);
  }

  getGameIdForPlayer(playerId: string): string | undefined {
    return this.playerToGame.get(playerId);
  }

  addToQueue(player: Player): void {
    this.queue.push(player);
    this.checkQueue();
    player.socket.send(
      createMessage(MESSAGE_TYPES.QUEUE_UPDATE, { position: this.queue.length })
    );
  }

  handleMove(gameId: string, move: Move): void {
    console.log("Handling move", move);
    const game = this.games.get(gameId);
    if (!game) {
      throw new Error("Game not found");
    }
    if (!this.isValidMove(game, move)) {
      throw new Error("Invalid move");
    }
    const bufferedMoves = this.moveBuffer.get(gameId);
    if (bufferedMoves) {
      bufferedMoves.push(move);
    }
  }

  removePlayer(playerId: string): void {
    this.queue = this.queue.filter((player) => player.id !== playerId);
    const gameId = this.playerToGame.get(playerId);
    if (gameId) {
      const game = this.games.get(gameId);
      if (game) {
        const otherPlayer = game.players.find((p) => p.id !== playerId);
        if (otherPlayer) {
          this.endGame(game, otherPlayer.id, "playerDisconnected");
        }
      }
      this.playerToGame.delete(playerId);
    }
  }

  getGameState(gameId: string): Game | null {
    return this.games.get(gameId) || null;
  }

  gameExists(gameId: string): boolean {
    return this.games.has(gameId);
  }

  getQueueLength(): number {
    return this.queue.length;
  }

  reconnectPlayer(playerId: string, socket: WebSocket): boolean {
    const gameId = this.playerToGame.get(playerId);
    if (gameId) {
      const game = this.games.get(gameId);
      if (game) {
        const player = game.players.find((p) => p.id === playerId);
        if (player) {
          player.socket = socket;
          this.sendGameUpdate(game, player);
          return true;
        }
      }
    }
    return false;
  }

  private checkQueue(): void {
    if (this.queue.length >= 2) {
      const player1 = this.queue.shift()!;
      const player2 = this.queue.shift()!;
      this.createGame(player1, player2);
    }
  }

  private createGame(player1: Player, player2: Player): void {
    const gameId = uuidv4();
    const game: Game = {
      id: gameId,
      players: [player1, player2],
      board: createEmptyBoard(),
      lastUpdateTime: Date.now(),
      endTime: Date.now() + 60000, // Game ends 60 seconds from now
    };
    this.games.set(gameId, game);
    this.moveBuffer.set(gameId, []);
    this.playerToGame.set(player1.id, gameId);
    this.playerToGame.set(player2.id, gameId);

    const startGameMessage = createMessage(MESSAGE_TYPES.GAME_START, {
      gameId,
      players: [
        { id: player1.id, name: player1.name, score: player1.score },
        { id: player2.id, name: player2.name, score: player2.score },
      ],
      board: game.board,
      endTime: game.endTime,
    });
    player1.socket.send(startGameMessage);
    player2.socket.send(startGameMessage);
  }

  private processBufferedMoves(): void {
    for (const [gameId, moves] of this.moveBuffer.entries()) {
      const game = this.games.get(gameId);
      if (game && moves.length > 0) {
        moves.sort((a, b) => a.timestamp - b.timestamp);

        let updateNeeded = false;
        for (const move of moves) {
          updateNeeded = this.processMove(game, move) || updateNeeded;
        }

        moves.length = 0;

        if (updateNeeded) {
          this.sendGameUpdate(game);
        }

        if (this.isGameOver(game.board)) {
          const winner =
            game.players[0].score > game.players[1].score
              ? game.players[0]
              : game.players[1];
          this.endGame(game, winner.id, "noMoreMoves");
        }
      }
    }
  }

  private processMove(game: Game, move: Move): boolean {
    const [fromRow, fromCol] = move.fromCell;
    const [toRow, toCol] = move.toCell;
    const fromItem = game.board[fromRow][fromCol];
    const toItem = game.board[toRow][toCol];

    console.log("Processing move", move, fromItem, toItem);

    if (fromItem === toItem) {
      game.board[toRow][toCol] = null;
      game.board[fromRow][fromCol] = null;
      const player = game.players.find((p) => p.id === move.playerId);
      if (player) {
        player.score += 10;
        this.sendMergeEvent(game, player, move, 10);
      }
      return true; // Update needed
    } else {
      game.board[toRow][toCol] = fromItem;
      game.board[fromRow][fromCol] = toItem;
      this.sendSwapEvent(game, move);
      return false; // No update needed for unsuccessful merges
    }
  }

  private isGameOver(board: Board): boolean {
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        const currentItem = board[row][col];
        if (
          (col < 3 && board[row][col + 1] === currentItem) ||
          (row < 3 && board[row + 1][col] === currentItem)
        ) {
          return false;
        }
      }
    }
    return true;
  }

  private sendGameUpdate(game: Game, specificPlayer?: Player): void {
    const updateMessage = createMessage(MESSAGE_TYPES.GAME_UPDATE, {
      board: game.board,
      scores: {
        [game.players[0].id]: game.players[0].score,
        [game.players[1].id]: game.players[1].score,
      },
      timeRemaining: Math.max(0, game.endTime - Date.now()),
    });
    if (specificPlayer) {
      specificPlayer.socket.send(updateMessage);
    } else {
      game.players[0].socket.send(updateMessage);
      game.players[1].socket.send(updateMessage);
    }
  }

  private sendMergeEvent(
    game: Game,
    player: Player,
    move: Move,
    points: number
  ): void {
    const mergeEvent = createMessage(MESSAGE_TYPES.MERGE, {
      playerId: player.id,
      fromCell: move.fromCell,
      toCell: move.toCell,
      points: points,
    });
    game.players[0].socket.send(mergeEvent);
    game.players[1].socket.send(mergeEvent);
  }

  private sendSwapEvent(game: Game, move: Move): void {
    const swapEvent = createMessage(MESSAGE_TYPES.SWAP, {
      playerId: move.playerId,
      fromCell: move.fromCell,
      toCell: move.toCell,
    });
    game.players[0].socket.send(swapEvent);
    game.players[1].socket.send(swapEvent);
  }

  private checkGameTimers(): void {
    const now = Date.now();
    for (const [gameId, game] of this.games) {
      if (now >= game.endTime) {
        const winner =
          game.players[0].score > game.players[1].score
            ? game.players[0]
            : game.players[1];
        this.endGame(game, winner.id, "timeUp");
      }
    }
  }

  private endGame(game: Game, winnerId: string, reason: string): void {
    const gameOverMessage = createMessage(MESSAGE_TYPES.GAME_OVER, {
      reason: reason,
      winner: winnerId,
      finalScores: {
        [game.players[0].id]: game.players[0].score,
        [game.players[1].id]: game.players[1].score,
      },
    });
    game.players[0].socket.send(gameOverMessage);
    game.players[1].socket.send(gameOverMessage);
    this.games.delete(game.id);
    this.moveBuffer.delete(game.id);
    this.playerToGame.delete(game.players[0].id);
    this.playerToGame.delete(game.players[1].id);
  }

  private isValidMove(game: Game, move: Move): boolean {
    const { fromCell, toCell } = move;
    const [fromRow, fromCol] = fromCell;
    const [toRow, toCol] = toCell;

    if (
      fromRow < 0 ||
      fromRow >= 4 ||
      fromCol < 0 ||
      fromCol >= 4 ||
      toRow < 0 ||
      toRow >= 4 ||
      toCol < 0 ||
      toCol >= 4
    ) {
      return false;
    }

    const rowDiff = Math.abs(fromRow - toRow);
    const colDiff = Math.abs(fromCol - toCol);
    if ((rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1)) {
      return true;
    }

    return false;
  }
}
