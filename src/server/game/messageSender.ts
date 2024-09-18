import { createMessage, WS_SERVER_MESSAGE_TYPES } from "../messages";
import { Game, Player, Move } from "../types";

export class MessageSender {
  sendGameStart(game: Game): void {
    const startGameMessage = createMessage(WS_SERVER_MESSAGE_TYPES.GAME_START, {
      gameId: game.id,
      players: game.players.map((p) => ({
        id: p.id,
        name: p.name,
        score: p.score,
        socket: undefined,
      })),
      board: game.board,
      endTime: game.endTime,
    });
    game.players.forEach((player) => player.socket!.send(startGameMessage));
  }

  sendGameUpdate(game: Game): void {
    const updateMessage = createMessage(WS_SERVER_MESSAGE_TYPES.GAME_UPDATE, {
      board: game.board,
      scores: Object.fromEntries(game.players.map((p) => [p.id, p.score])),
      timeRemaining: Math.max(0, game.endTime - Date.now()),
    });
    game.players.forEach((player) => player.socket!.send(updateMessage));
  }

  sendGameOver(game: Game, winnerId: string, reason: string): void {
    const gameOverMessage = createMessage(WS_SERVER_MESSAGE_TYPES.GAME_OVER, {
      reason: reason,
      winner: winnerId,
      finalScores: Object.fromEntries(game.players.map((p) => [p.id, p.score])),
    });
    game.players.forEach((player) => player.socket!.send(gameOverMessage));
  }

  sendMergeEvent(game: Game, player: Player, move: Move, points: number): void {
    const mergeEvent = createMessage(WS_SERVER_MESSAGE_TYPES.MERGE, {
      playerId: player.id,
      fromCell: move.fromCell,
      toCell: move.toCell,
      points: points,
    });
    game.players.forEach((p) => p.socket!.send(mergeEvent));
  }

  sendSwapEvent(game: Game, move: Move): void {
    const swapEvent = createMessage(WS_SERVER_MESSAGE_TYPES.SWAP, {
      playerId: move.playerId,
      fromCell: move.fromCell,
      toCell: move.toCell,
    });
    game.players.forEach((p) => p.socket!.send(swapEvent));
  }
}
