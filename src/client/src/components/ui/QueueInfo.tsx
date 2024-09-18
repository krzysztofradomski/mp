export const QueueInfo = ({
  queuePosition,
}: {
  queuePosition: number | null;
}) => {
  return (
    <div id="queueInfo">
      <p>
        You are in queue. Position:{" "}
        <span id="queuePosition">{queuePosition}</span>
      </p>
    </div>
  );
};
