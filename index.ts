import express from "express";
import http from "http";
import WebSocket from "ws";
import { v4 as uuidv4 } from "uuid";

// Model
interface Player {
  id: string;
  name: string;
  socket: WebSocket;
  board: any; // Replace 'any' with your actual board type
}

interface Game {
  id: string;
  players: [Player, Player];
}

// Controller
class GameController {
  private queue: Player[] = [];
  private games: Map<string, Game> = new Map();

  addToQueue(player: Player): void {
    this.queue.push(player);
    this.checkQueue();
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
    };
    this.games.set(gameId, game);

    // Notify players that the game has started
    const startGameMessage = JSON.stringify({
      type: "gameStart",
      gameId,
      opponent: player2.name,
    });
    player1.socket.send(startGameMessage);

    const startGameMessage2 = JSON.stringify({
      type: "gameStart",
      gameId,
      opponent: player1.name,
    });
    player2.socket.send(startGameMessage2);
  }

  handleMove(playerId: string, move: any): void {
    // Find the game that the player is in
    const game = Array.from(this.games.values()).find(
      (g) => g.players[0].id === playerId || g.players[1].id === playerId
    );

    if (game) {
      // Process the move and update the game state
      // This is where you'd implement your game logic

      // Notify both players of the move
      const moveMessage = JSON.stringify({ type: "move", playerId, move });
      game.players[0].socket.send(moveMessage);
      game.players[1].socket.send(moveMessage);

      // Check for game end conditions
      // If the game is over, notify players and remove the game
    }
  }
}

// View (in this case, it's the WebSocket server that sends data to clients)
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const gameController = new GameController();

wss.on("connection", (ws: WebSocket) => {
  let player: Player | null = null;

  ws.on("message", (message: string) => {
    const data = JSON.parse(message);

    switch (data.type) {
      case "join":
        player = {
          id: uuidv4(),
          name: data.name,
          socket: ws,
          board: [], // Initialize with an empty board
        };
        gameController.addToQueue(player);
        break;
      case "move":
        if (player) {
          gameController.handleMove(player.id, data.move);
        }
        break;
      // Add other message types as needed
    }
  });

  ws.on("close", () => {
    // Handle player disconnection
    // Remove from queue or end the game if in progress
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
