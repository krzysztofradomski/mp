import express from "express";
import http from "http";
import WebSocket from "ws";
import cors from "cors";
import { handleConnection } from "./src/server/connection/handleConnection";

const PORT = process.env.PORT || 3000;

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// if (process.env.NODE_ENV === "development") {
app.use(cors());
// }

app.use("/assets", express.static("public/assets"));

// Serve react app here
app.use("/react", express.static("public"));

// Server old version js client here
app.use("/js", express.static("public/__old"));

wss.on("connection", handleConnection);

server.listen(PORT, () => {
  console.log(`Node server is running on port http://localhost:${PORT}`);
  console.log(`WebSocket server is running on ws://localhost:${PORT}`);
  console.log(`React app is running on http://localhost:${PORT}/react`);
  console.log(
    `Js client (early version) is running on http://localhost:${PORT}/js`
  );
});
