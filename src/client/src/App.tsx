import Game from "./components/game/Game";
import { LoginForm } from "./components/ui/LoginForm";
import { Messages } from "./components/ui/Message";
import { QueueInfo } from "./components/ui/QueueInfo";
import { useTextures } from "./hooks/useTextures";
import { useWindowDimensions } from "./hooks/useWindowDimensions";
import { tileTexturesList, otherTexturesList } from "./utils/urls";
import { useGameManager } from "./state/gameManager";

function App() {
  const windowDimensions = useWindowDimensions();
  const tileTexturesLoaded = useTextures(tileTexturesList);
  const otherTexturesLoaded = useTextures(otherTexturesList);
  const { state, handleTileDrop, joinGame, setPlayerName } = useGameManager();

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
          setPlayerName={setPlayerName}
          joinGame={joinGame}
          errorMessage={state.errorMessage}
        />
      )}
      <Messages messages={state.messages} />
    </div>
  );
}

export default App;
