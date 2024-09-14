import WebSocket from "ws";
import { v4 as uuidv4 } from "uuid";
import { Player } from "../types";
import { createMessage, MESSAGE_TYPES } from "../../shared/messages";
import { GameController } from "../index";

const gameController = new GameController();

export function handleConnection(ws: WebSocket) {
  let player: Player | null = null;
  let currentGameId: string | null = null;

  ws.on("message", (message: string) => {
    try {
      const data = JSON.parse(message);
      console.log({ data, player, currentGameId });
      handleMessage(data);
    } catch (error) {
      console.error("Error processing message:", error);
      ws.send(
        createMessage(MESSAGE_TYPES.ERROR, {
          message: "Invalid message format or server error",
        })
      );
    }
  });

  ws.on("close", () => {
    if (player) {
      gameController.removePlayer(player.id);
    }
  });

  function handleMessage(data: any) {
    switch (data.type) {
      case "join":
        handleJoin(data);
        break;
      case "move":
        handleMove(data);
        break;
      case "reconnect":
        handleReconnect(data);
        break;
      default:
        ws.send(
          createMessage(MESSAGE_TYPES.ERROR, {
            message: "Unknown message type",
          })
        );
    }
  }

  function handleJoin(data: any) {
    player = {
      id: uuidv4(),
      name: data.name,
      socket: ws,
      score: 0,
    };
    player && gameController.addToQueue(player);
  }

  function handleMove(data: any) {
    if (player) {
      const gameId = gameController.getGameIdForPlayer(player.id);
      if (gameId) {
        const move = {
          playerId: player.id,
          fromCell: data.fromCell,
          toCell: data.toCell,
          timestamp: Date.now(),
        };
        gameController.handleMove(gameId, move);
      } else {
        ws.send(
          createMessage(MESSAGE_TYPES.ERROR, { message: "Not in a game" })
        );
      }
    } else {
      ws.send(
        createMessage(MESSAGE_TYPES.ERROR, {
          message: "Player not initialized",
        })
      );
    }
  }

  function handleReconnect(data: any) {
    if (data.playerId && gameController.reconnectPlayer(data.playerId, ws)) {
      player = { ...player!, socket: ws };
      ws.send(createMessage(MESSAGE_TYPES.RECONNECT_SUCCESS, {}));
    } else {
      ws.send(createMessage(MESSAGE_TYPES.RECONNECT_FAILED, {}));
    }
  }
}
