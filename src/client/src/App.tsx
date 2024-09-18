import { useReducer, useCallback } from "react";
import Game from "./components/game/Game";
import { LoginForm } from "./components/ui/LoginForm";
import { Messages } from "./components/ui/Message";
import { QueueInfo } from "./components/ui/QueueInfo";
import { useGameSocket } from "./hooks/useGameSocket";
import { useTileTextures } from "./hooks/useTileTextures";
import { useWindowDimensions } from "./hooks/useWindowDimensions";
import { initialState } from "./state/initialState";
import { gameReducer } from "./state/reducer";
import { Action } from "./state/types";
import { tileTexturesList, otherTexturesList } from "./utils/urls";

function App() {
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

  const handleTileDrop = (
    fromRow: number,
    fromCol: number,
    toRow: number,
    toCol: number
  ) => {
    const move = {
      type: "move" as const,
      fromCell: [fromRow, fromCol] as [number, number],
      toCell: [toRow, toCol] as [number, number],
    };
    sendMessage(move);
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
        <Game
          state={state}
          tileTexturesLoaded={tileTexturesLoaded}
          otherTexturesLoaded={otherTexturesLoaded}
          handleTileDrop={handleTileDrop}
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
}

export default App;
