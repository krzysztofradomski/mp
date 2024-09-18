/* eslint-disable no-case-declarations */
import { useState, useEffect, useRef, useCallback, useReducer } from "react";
import { Stage, Sprite, Container, Graphics } from "@pixi/react";
import * as PIXI from "pixi.js";
import { Board, type Game } from "./server-types";

const MESSAGE_TYPES = {
  QUEUE_UPDATE: "queueUpdate",
  GAME_START: "gameStart",
  GAME_UPDATE: "update",
  MERGE: "merge",
  SWAP: "swap",
  GAME_OVER: "gameOver",
  ERROR: "error",
  RECONNECT_SUCCESS: "reconnectSuccess",
  RECONNECT_FAILED: "reconnectFailed",
};

type Action = {
  type: string;
  board?: Board | undefined;
  endTime?: number;
  gameOverData?: {
    reason: string;
    winner: string;
    finalScores: { [key: string]: number };
  };
  message?: unknown;
  name?: string;
  selectedTile?: [number, number] | null;
  position?: number;
  gameData?: Game & {
    scores: { [key: string]: number };
    endTime: number;
  };
  scores?: { [key: string]: number };
  fromCell?: [number, number];
  toCell?: [number, number];
};

//@ts-expect-error - cannot find proper type
type PixiTexture = PIXI.Texture;

// for local development
// const hostingUrl = `http://${window.location.hostname}:3000`;
const hostingUrl =
  process.env.NODE_ENV === "development"
    ? `http://${window.location.hostname}:3000`
    : `http://${window.location.host}`;

const tileTexturesList = [
  { type: "red", url: `${hostingUrl}/assets/tile-red.svg` },
  { type: "green", url: `${hostingUrl}/assets/tile-green.svg` },
  { type: "blue", url: `${hostingUrl}/assets/tile-blue.svg` },
  { type: "pink", url: `${hostingUrl}/assets/tile-pink.svg` },
  { type: "orange", url: `${hostingUrl}/assets/tile-orange.svg` },
  { type: "yellow", url: `${hostingUrl}/assets/tile-yellow.svg` },
];

const otherTexturesList = [
  { type: "win-bg", url: `${hostingUrl}/assets/win-bg.svg` },
  { type: "win-text", url: `${hostingUrl}/assets/win-text.svg` },
  { type: "fail-bg", url: `${hostingUrl}/assets/fail-bg.svg` },
  { type: "fail-text", url: `${hostingUrl}/assets/fail-text.svg` },
];

const grid = 4;

// Custom Hooks
const useWindowDimensions = () => {
  const [windowDimensions, setWindowDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  useEffect(() => {
    const handleResize = () => {
      setWindowDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  return windowDimensions;
};

const useTileTextures = (tileList: typeof tileTexturesList) => {
  const [texturesLoaded, setTexturesLoaded] = useState({});
  useEffect(() => {
    const loadTextures = async () => {
      const loadedTextures: { [key: string]: PixiTexture } = {};
      for (const tile of tileList) {
        try {
          // @ts-expect-error - property assets exists on PIXI and works, wtf
          const texture = await PIXI.Assets.load(tile.url);
          loadedTextures[tile.type] = texture;
          console.log({ texture });
        } catch (error) {
          console.error(`Failed to load texture for ${tile.type}:`, error);
        }
      }
      setTexturesLoaded(loadedTextures);
    };
    loadTextures();
  }, [tileList]);
  return texturesLoaded;
};

const useGameTimer = (endTime: number) => {
  const [timeRemaining, setTimeRemaining] = useState(0);
  useEffect(() => {
    const updateRemainingTime = () => {
      const now = Date.now();
      const remaining = Math.max(0, endTime - now);
      setTimeRemaining(remaining);
      if (remaining > 0) {
        requestAnimationFrame(updateRemainingTime);
      }
    };
    if (endTime) {
      requestAnimationFrame(updateRemainingTime);
    }
  }, [endTime]);
  return timeRemaining;
};

const useGameSocket = (url: string, dispatch: React.Dispatch<Action>) => {
  const socketRef = useRef<WebSocket>();

  useEffect(() => {
    let ws: WebSocket;

    const connect = () => {
      ws = new WebSocket(url);
      socketRef.current = ws;

      ws.onopen = () => {
        console.log("WebSocket connection established");
        dispatch({ type: "SET_ERROR_MESSAGE", message: "" });
      };

      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        switch (message.type) {
          case MESSAGE_TYPES.QUEUE_UPDATE:
            dispatch({
              type: "SET_QUEUE_POSITION",
              position: message.position,
            });
            break;
          case MESSAGE_TYPES.GAME_START:
            dispatch({ type: "START_GAME", gameData: message });
            break;
          case MESSAGE_TYPES.GAME_UPDATE:
            dispatch({ type: "UPDATE_GAME", gameData: message });
            break;
          case MESSAGE_TYPES.MERGE:
            dispatch({
              type: "HANDLE_MERGE",
              fromCell: message.fromCell,
              toCell: message.toCell,
            });
            setTimeout(() => {
              dispatch({ type: "CLEAR_MERGE_EFFECT" });
            }, 300);
            break;
          case MESSAGE_TYPES.SWAP:
            dispatch({
              type: "HANDLE_SWAP",
              fromCell: message.fromCell,
              toCell: message.toCell,
            });
            setTimeout(() => {
              dispatch({ type: "CLEAR_SWAP_EFFECT" });
            }, 300);
            break;
          case MESSAGE_TYPES.GAME_OVER:
            dispatch({ type: "END_GAME", gameOverData: message });
            break;
          case MESSAGE_TYPES.ERROR:
            dispatch({ type: "SET_ERROR_MESSAGE", message: message.message });
            break;
          default:
            console.log("Unknown message type:", message.type);
            break;
        }
      };

      ws.onclose = (event) => {
        console.log("WebSocket connection closed", event);
        setTimeout(connect, 3000);
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        dispatch({
          type: "SET_ERROR_MESSAGE",
          message: "WebSocket connection error. Please try again later.",
        });
      };
    };

    connect();

    return () => {
      if (ws) {
        // ws.close();
      }
    };
  }, [url, dispatch]);

  const sendMessage = (message: Action) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(message));
    } else {
      console.error("Socket is not connected");
    }
  };

  return {
    sendMessage,
  };
};

// Reducer and Initial State
const initialState = {
  playerId: "",
  playerName: "",
  opponentName: "",
  opponentId: "",
  selectedTile: null as [number, number] | null,
  queuePosition: null as number | null,
  gameStarted: false,
  board: [] as Board,
  scores: {} as { [key: string]: number },
  timeRemaining: 0,
  totalTime: 0,
  messages: "",
  winnerId: "",
  finalScores: {},
  errorMessage: "",
  mergeEffect: null as {
    fromCell: [number, number];
    toCell: [number, number];
  } | null,
  swapEffect: null as {
    fromCell: [number, number];
    toCell: [number, number];
  } | null,
  endTime: 0,
};

function gameReducer(state: typeof initialState, action: Action) {
  console.log("Reducer action:", action);
  const { gameData } = action;
  switch (action.type) {
    case "SET_QUEUE_POSITION":
      return { ...state, queuePosition: action.position || null };
    case "START_GAME":
      const player = gameData?.players.find((p) => p.name === state.playerName);
      if (!player) {
        console.error("Player not found in game data:", state.playerName);
        return state;
      }
      const opponent = gameData?.players.find((p) => p.id !== player.id);
      return {
        ...state,
        queuePosition: null,
        gameStarted: true,
        playerId: player.id,
        opponentName: opponent?.name || "",
        opponentId: opponent?.id || "",
        board: gameData?.board || [],
        scores: gameData?.scores || {},
        totalTime: gameData?.endTime ? gameData?.endTime - Date.now() : 0,
        endTime: gameData?.endTime || 0,
      };
    case "UPDATE_GAME":
      return {
        ...state,
        board: action?.gameData?.board || [],
        scores: action?.gameData?.scores || {},
        timeRemaining: Math.max(
          0,
          action?.endTime ? action?.endTime - Date.now() : 0
        ),
        endTime: action?.endTime || state.endTime,
      };
    case "HANDLE_MERGE":
      return {
        ...state,
        mergeEffect:
          action.fromCell && action.toCell
            ? { fromCell: action.fromCell, toCell: action.toCell }
            : null,
      };
    case "CLEAR_MERGE_EFFECT":
      return {
        ...state,
        mergeEffect: null,
      };
    case "HANDLE_SWAP":
      return {
        ...state,
        swapEffect:
          action.fromCell && action.toCell
            ? { fromCell: action.fromCell, toCell: action.toCell }
            : null,
      };
    case "CLEAR_SWAP_EFFECT":
      return {
        ...state,
        swapEffect: null,
      };
    case "END_GAME":
      const opponentScore =
        action.gameOverData?.finalScores[state.opponentId!] || 0;
      const playerScore =
        action.gameOverData?.finalScores[state.playerId!] || 0;
      return {
        ...state,
        winnerId: action.gameOverData?.winner || "",
        finalScores: action.gameOverData?.finalScores || {},
        messages: `Game Over! Winner: ${
          action.gameOverData?.winner === state.playerId
            ? state.playerName
            : state.opponentName
        }. Scores: ${state.playerName}: ${playerScore}, ${
          state.opponentName
        }: ${opponentScore}`,
      };
    case "SET_ERROR_MESSAGE":
      return { ...state, errorMessage: action.message as string };
    case "SET_PLAYER_NAME":
      return { ...state, playerName: action.name || "" };
    case "SET_SELECTED_TILE":
      return { ...state, selectedTile: action.selectedTile || null };
    default:
      return state;
  }
}

// Components
const LoginForm = ({
  playerName,
  setPlayerName,
  joinGame,
  errorMessage,
}: {
  playerName: string;
  setPlayerName: (name: string) => void;
  joinGame: () => void;
  errorMessage: string;
}) => {
  return (
    <div id="loginForm">
      <input
        type="text"
        value={playerName}
        onChange={(e) => setPlayerName(e.target.value)}
        placeholder="Enter your name"
      />
      <button onClick={joinGame}>Join Game</button>
      {errorMessage && <div>Error: {errorMessage}</div>}
    </div>
  );
};

const QueueInfo = ({ queuePosition }: { queuePosition: number | null }) => {
  return (
    <div id="queueInfo">
      <p>
        You are in queue. Position:{" "}
        <span id="queuePosition">{queuePosition}</span>
      </p>
    </div>
  );
};

const Messages = ({ messages }: { messages: string }) => {
  return <div id="messages">{messages && <div>{messages}</div>}</div>;
};

const GamePlay = ({
  state,
  tileTexturesLoaded,
  otherTexturesLoaded,
  handleTileClick,
  windowDimensions,
}: {
  state: typeof initialState;
  tileTexturesLoaded: { [key: string]: PixiTexture };
  otherTexturesLoaded: { [key: string]: PixiTexture };
  handleTileClick: (row: number, col: number) => void;
  windowDimensions: { width: number; height: number };
}) => {
  const timeRemaining = useGameTimer(state.endTime);
  console.log({
    state,
  });
  return (
    <div
      id="gameContainer"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <h1 id="playerInfo">Welcome, {state.playerName}!</h1>
      <div id="scores">
        {state.playerName}: {state.scores[state.playerId!] || 0} |{" "}
        {state.opponentName}: {state.scores[state.opponentId!] || 0}
      </div>
      <div id="timeRemaining">
        Time remaining: {Math.ceil(timeRemaining / 1000)}s
      </div>
      <div
        id="pixiContainer"
        style={{
          margin: "0 auto",
          padding: 0,
          width: "100%",
          height: "100%",
        }}
      >
        <Stage
          options={{ backgroundAlpha: 0, resizeTo: window }}
          width={windowDimensions.width}
          height={windowDimensions.height}
        >
          <GameBoard
            board={state.board}
            tileTexturesLoaded={tileTexturesLoaded}
            selectedTile={state.selectedTile}
            handleTileClick={handleTileClick}
            mergeEffect={state.mergeEffect}
            swapEffect={state.swapEffect}
            windowDimensions={windowDimensions}
          />
          <TimerBar
            timeRemaining={timeRemaining}
            totalTime={state.totalTime}
            windowDimensions={windowDimensions}
          />
          {state.winnerId === state.playerId &&
            otherTexturesLoaded["win-bg"] && (
              <>
                <Sprite
                  texture={otherTexturesLoaded["win-bg"]}
                  width={windowDimensions.width}
                  height={windowDimensions.height}
                  x={0}
                  y={0}
                />
                <Sprite
                  texture={otherTexturesLoaded["win-text"]}
                  width={windowDimensions.width / 2}
                  height={windowDimensions.height / 2}
                  x={windowDimensions.width / 4}
                  y={windowDimensions.height / 4}
                />
              </>
            )}
          {state.winnerId &&
            state.winnerId !== state.playerId &&
            otherTexturesLoaded["fail-bg"] && (
              <>
                <Sprite
                  texture={otherTexturesLoaded["fail-bg"]}
                  width={windowDimensions.width}
                  height={windowDimensions.height}
                  x={0}
                  y={0}
                />
                <Sprite
                  texture={otherTexturesLoaded["fail-text"]}
                  width={windowDimensions.width / 2}
                  height={windowDimensions.height / 2}
                  x={windowDimensions.width / 4}
                  y={windowDimensions.height / 4}
                />
              </>
            )}
        </Stage>
      </div>
    </div>
  );
};

// Main Game Component
const Game = () => {
  const [state, dispatch] = useReducer<
    React.Reducer<typeof initialState, Action>
  >(gameReducer, initialState);
  const windowDimensions = useWindowDimensions();
  const tileTexturesLoaded = useTileTextures(tileTexturesList);
  const otherTexturesLoaded = useTileTextures(otherTexturesList);

  const wsProtocol = window.location.protocol === "https:" ? "wss" : "ws";

  const wsUrl =
    process.env.NODE_ENV === "development"
      ? `${wsProtocol}://${window.location.hostname}:3000/ws`
      : `${wsProtocol}://${window.location.host}/ws`;
  const { sendMessage } = useGameSocket(wsUrl, dispatch);

  const handleTileClick = (row: number, col: number) => {
    console.log("Tile clicked:", row, col);
    if (state.selectedTile === null) {
      dispatch({ type: "SET_SELECTED_TILE", selectedTile: [row, col] });
    } else {
      const move = {
        type: "move",
        fromCell: state.selectedTile,
        toCell: [row, col] as [number, number],
      };
      sendMessage(move);
      dispatch({ type: "SET_SELECTED_TILE", selectedTile: null });
    }
  };

  const joinGame = useCallback(() => {
    if (state.playerName) {
      sendMessage({ type: "join", name: state.playerName });
    } else {
      dispatch({
        type: "SET_ERROR_MESSAGE",
        message: "Please enter your name before joining the game.",
      });
    }
  }, [state.playerName, sendMessage, dispatch]);

  return (
    <div
      style={{
        fontFamily: "Arial, sans-serif",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        backgroundImage: "url(/assets/bg.svg)",
        backgroundSize: "cover",
        overflow: "hidden",
        height: "100vh",
      }}
    >
      {state.gameStarted ? (
        <GamePlay
          state={state}
          tileTexturesLoaded={tileTexturesLoaded}
          otherTexturesLoaded={otherTexturesLoaded}
          handleTileClick={handleTileClick}
          windowDimensions={windowDimensions}
        />
      ) : state.queuePosition !== null ? (
        <QueueInfo queuePosition={state.queuePosition} />
      ) : (
        <LoginForm
          playerName={state.playerName}
          setPlayerName={(name: string) =>
            dispatch({ type: "SET_PLAYER_NAME", name })
          }
          joinGame={joinGame}
          errorMessage={state.errorMessage}
        />
      )}
      <Messages messages={state.messages} />
    </div>
  );
};

// GameBoard Component remains the same
const GameBoard = ({
  board,
  tileTexturesLoaded,
  selectedTile,
  handleTileClick,
  mergeEffect,
  swapEffect,
  windowDimensions,
}: {
  board: Board;
  tileTexturesLoaded: { [key: string]: PixiTexture };
  selectedTile: [number, number] | null;
  handleTileClick: (row: number, col: number) => void;
  mergeEffect: { fromCell: [number, number]; toCell: [number, number] } | null;
  swapEffect: { fromCell: [number, number]; toCell: [number, number] } | null;
  windowDimensions: { width: number; height: number };
}) => {
  const [tileSize, setTileSize] = useState(0);
  const [padding, setPadding] = useState(0);

  useEffect(() => {
    const updateDimensions = () => {
      const minDimension = Math.min(
        windowDimensions.width,
        windowDimensions.height
      );
      const newTileSize = minDimension / (grid + 1);
      setTileSize(newTileSize);
      setPadding(newTileSize / 7);
    };
    updateDimensions();
  }, [windowDimensions]);

  if (!tileTexturesLoaded || Object.keys(tileTexturesLoaded).length === 0) {
    return null; // Textures not loaded yet
  }

  return (
    <Container>
      {board.map((row, rowIndex) =>
        row.map((cell, colIndex) => {
          const x = colIndex * (tileSize + padding);
          const y = rowIndex * (tileSize + padding);
          let texture = null;
          if (cell && tileTexturesLoaded[cell]) {
            texture = tileTexturesLoaded[cell];
          }
          const isSelected =
            selectedTile &&
            selectedTile[0] === rowIndex &&
            selectedTile[1] === colIndex;
          const isMerging =
            mergeEffect &&
            ((mergeEffect.fromCell[0] === rowIndex &&
              mergeEffect.fromCell[1] === colIndex) ||
              (mergeEffect.toCell[0] === rowIndex &&
                mergeEffect.toCell[1] === colIndex));
          const alpha = cell ? (isMerging ? 0.5 : 1) : 0;

          let posX = x;
          let posY = y;

          if (swapEffect) {
            const fromIndex = swapEffect.fromCell;
            const toIndex = swapEffect.toCell;
            if (fromIndex[0] === rowIndex && fromIndex[1] === colIndex) {
              posX = toIndex[1] * (tileSize + padding);
              posY = toIndex[0] * (tileSize + padding);
            } else if (toIndex[0] === rowIndex && toIndex[1] === colIndex) {
              posX = fromIndex[1] * (tileSize + padding);
              posY = fromIndex[0] * (tileSize + padding);
            }
          }

          return texture ? (
            <Sprite
              key={`${rowIndex}-${colIndex}`}
              texture={texture}
              x={posX}
              y={posY}
              width={tileSize}
              height={tileSize}
              eventMode={cell ? "dynamic" : "none"}
              onpointerdown={() => handleTileClick(rowIndex, colIndex)}
              cursor={cell ? "pointer" : "default"}
              tint={isSelected ? 0xdddddd : 0xffffff}
              alpha={alpha}
            />
          ) : null;
        })
      )}
    </Container>
  );
};

const TimerBar = ({
  timeRemaining,
  totalTime,
  windowDimensions,
}: {
  timeRemaining: number;
  totalTime: number;
  windowDimensions: { width: number; height: number };
}) => {
  const percentage = totalTime > 0 ? timeRemaining / totalTime : 0;

  return (
    <Graphics
      draw={(g) => {
        g.clear();

        // Background bar
        g.beginFill(0x000000);
        g.drawRect(0, 0, windowDimensions.width, 24);
        g.endFill();

        // Foreground bar
        g.beginFill(0x00ff00);
        g.drawRect(0, 0, windowDimensions.width * percentage, 20);
        g.endFill();
      }}
    />
  );
};

export default Game;
