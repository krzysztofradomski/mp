import { createMessage, MESSAGE_TYPES } from "../messages";
import WebSocket from "ws";
import { Player } from "../types";

export class QueueManager {
  private queue: Player[] = [
    {
      id: "1",
      name: "Player 1",
      socket: new WebSocket("ws://localhost:3000"),
      score: 0,
    },
    // {
    //   id: "2",
    //   name: "Player 2",
    //   socket: null!,
    //   score: 0,
    // },
  ];

  addToQueue(player: Player): void {
    this.queue.push(player);
    player.socket.send(
      createMessage(MESSAGE_TYPES.QUEUE_UPDATE, { position: this.queue.length })
    );
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
