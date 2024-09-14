import express from "express";
import http from "http";
import WebSocket from "ws";
import { handleConnection } from "./src/server/ws/handleConnection";

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static("public"));

app.use("/assets", express.static("public/assets"));

wss.on("connection", handleConnection);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port http://localhost:${PORT}`);
});
