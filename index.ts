import express from "express";
import http from "http";
import WebSocket from "ws";
import { v4 as uuidv4 } from "uuid";
import { GameController } from "./src/server";
import { Move, Player } from "./src/server/types";
import { createMessage, MESSAGE_TYPES } from "./src/shared/messages";

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const gameController = new GameController();

app.use(express.static("public"));

app.use("/assets", express.static("public/assets"));

wss.on("connection", (ws: WebSocket) => {
  let player: Player | null = null;
  let currentGameId: string | null = null;

  ws.on("message", (message: string) => {
    try {
      const data = JSON.parse(message);
      console.log({ data, player, currentGameId });
      switch (data.type) {
        case "join":
          player = {
            id: uuidv4(),
            name: data.name,
            socket: ws,
            score: 0,
          };
          player && gameController.addToQueue(player);
          break;
        case "move":
          if (player) {
            const gameId = gameController.getGameIdForPlayer(player.id);
            if (gameId) {
              const move: Move = {
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
          break;
        case "reconnect":
          if (
            data.playerId &&
            gameController.reconnectPlayer(data.playerId, ws)
          ) {
            player = { ...player!, socket: ws };
            ws.send(createMessage(MESSAGE_TYPES.RECONNECT_SUCCESS, {}));
          } else {
            ws.send(createMessage(MESSAGE_TYPES.RECONNECT_FAILED, {}));
          }
          break;
      }
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
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port http://localhost:${PORT}`);
});
