import { Graphics } from "@pixi/react";

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

export default TimerBar;
