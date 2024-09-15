import { Board, Game, Player } from "../types";

export class GameStateManager {
  isGameOver(board: Board): boolean {
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

  getWinner(game: Game): Player {
    return game.players[0].score > game.players[1].score
      ? game.players[0]
      : game.players[1];
  }
}
