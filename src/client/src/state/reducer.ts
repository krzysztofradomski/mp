/* eslint-disable no-case-declarations */
import { Action, actionTypes } from "./types";
import { initialState } from "./initialState";

export function gameReducer(state: typeof initialState, action: Action) {
  console.log("Reducer action:", action);
  const { gameData } = action;
  switch (action.type) {
    case actionTypes["SET_QUEUE_POSITION"]:
      return { ...state, queuePosition: action.position || null };
    case actionTypes["START_GAME"]:
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
    case actionTypes["UPDATE_GAME"]:
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
    case actionTypes["HANDLE_MERGE"]:
      return {
        ...state,
        mergeEffect:
          action.fromCell && action.toCell
            ? { fromCell: action.fromCell, toCell: action.toCell }
            : null,
      };
    case actionTypes["CLEAR_MERGE_EFFECT"]:
      return {
        ...state,
        mergeEffect: null,
      };
    case actionTypes["HANDLE_SWAP"]:
      return {
        ...state,
        swapEffect:
          action.fromCell && action.toCell
            ? { fromCell: action.fromCell, toCell: action.toCell }
            : null,
      };
    case actionTypes["CLEAR_SWAP_EFFECT"]:
      return {
        ...state,
        swapEffect: null,
      };
    case actionTypes["END_GAME"]:
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
    case actionTypes["SET_ERROR_MESSAGE"]:
      return { ...state, errorMessage: action.message as string };
    case actionTypes["SET_PLAYER_NAME"]:
      return { ...state, playerName: action.name || "" };
    case actionTypes["SET_SELECTED_TILE"]:
      return { ...state, selectedTile: action.selectedTile || null };
    default:
      return state;
  }
}
