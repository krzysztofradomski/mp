import { Stage, Sprite } from "@pixi/react";
import { useGameTimer } from "../../hooks/useGameTimer";
import { initialState } from "../../state/initialState";
import GameBoard from "./Board";
import TimerBar from "./TimerBar";
import { PixiTexture } from "./types";

type GameWrapperProps = {
  state: typeof initialState;
  tileTexturesLoaded: { [key: string]: PixiTexture };
  otherTexturesLoaded: { [key: string]: PixiTexture };
  handleTileDrop: (
    fromRow: number,
    fromCol: number,
    toRow: number,
    toCol: number
  ) => void;
  windowDimensions: { width: number; height: number };
};

const GameWrapper = (props: GameWrapperProps) => {
  const {
    state,
    tileTexturesLoaded,
    otherTexturesLoaded,
    handleTileDrop,
    windowDimensions,
  } = props;
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
            handleTileDrop={handleTileDrop}
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

export default GameWrapper;
