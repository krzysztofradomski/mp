export const LoginForm = ({
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
