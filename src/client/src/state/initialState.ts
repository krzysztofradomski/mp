import { Board } from "../utils/server-types";

export const initialState = {
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
