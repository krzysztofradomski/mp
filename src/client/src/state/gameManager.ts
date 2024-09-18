import { useReducer, useCallback } from "react";
import { useGameSocket } from "../hooks/useGameSocket";
import { initialState } from "./initialState";
import { gameReducer } from "./reducer";
import { Action } from "./types";

export function useGameManager() {
  const [state, dispatch] = useReducer<
    React.Reducer<typeof initialState, Action>
  >(gameReducer, initialState);

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

  const setPlayerName = useCallback(
    (name: string) => dispatch({ type: "SET_PLAYER_NAME", name }),
    [dispatch]
  );

  return { state, handleTileDrop, joinGame, setPlayerName };
}
