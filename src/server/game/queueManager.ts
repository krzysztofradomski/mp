import { createMessage, WS_SERVER_MESSAGE_TYPES } from "../messages";
import { Player } from "../types";

export class QueueManager {
  private queue: Player[] = [];

  addToQueue(player: Player): void {
    if (player.socket) {
      this.queue.push(player);
      player.socket.send(
        createMessage(WS_SERVER_MESSAGE_TYPES.QUEUE_UPDATE, {
          position: this.queue.length,
        })
      );
    }
  }

  removeFromQueue(playerId: string): void {
    this.queue = this.queue.filter((player) => player.id !== playerId);
  }

  getQueueLength(): number {
    return this.queue.length;
  }

  getPlayersForGame(): [Player, Player] | null {
    if (this.queue.length >= 2) {
      return [this.queue.shift()!, this.queue.shift()!];
    }
    return null;
  }
}
