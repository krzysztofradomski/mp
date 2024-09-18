import { Move, Game } from "../types";
import { MessageSender } from "./messageSender";

export class MoveProcessor {
  private moveBuffer: Map<string, Move[]> = new Map();

  addMove(gameId: string, move: Move): void {
    const bufferedMoves = this.moveBuffer.get(gameId) || [];
    bufferedMoves.push(move);
    this.moveBuffer.set(gameId, bufferedMoves);
  }

  processBufferedMoves(game: Game, messageSender: MessageSender): boolean {
    const moves = this.moveBuffer.get(game.id) || [];
    let updateNeeded = false;

    moves.sort((a, b) => a.timestamp - b.timestamp);

    for (const move of moves) {
      updateNeeded =
        this.processMove(game, move, messageSender) || updateNeeded;
    }

    this.moveBuffer.set(game.id, []);
    return updateNeeded;
  }

  private processMove(
    game: Game,
    move: Move,
    messageSender: MessageSender
  ): boolean {
    const [fromRow, fromCol] = move.fromCell;
    const [toRow, toCol] = move.toCell;
    const fromItem = game.board[fromRow][fromCol];
    const toItem = game.board[toRow][toCol];

    if (fromItem === toItem && fromItem !== null) {
      game.board[toRow][toCol] = null;
      game.board[fromRow][fromCol] = null;
      const player = game.players.find((p) => p.id === move.playerId);
      if (player) {
        player.score += 10;
        messageSender.sendMergeEvent(game, player, move, 10);
      }
      return true;
    } else {
      game.board[toRow][toCol] = fromItem;
      game.board[fromRow][fromCol] = toItem;
      messageSender.sendSwapEvent(game, move);
      return true;
    }
  }

  isValidMove(game: Game, move: Move): boolean {
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

    if (game.board[toRow][toCol] === null) {
      return false;
    }

    const rowDiff = Math.abs(fromRow - toRow);
    const colDiff = Math.abs(fromCol - toCol);
    return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
  }
}
