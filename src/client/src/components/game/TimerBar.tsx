import { Graphics } from "@pixi/react";

type TimerBarProps = {
  timeRemaining: number;
  totalTime: number;
  windowDimensions: { width: number; height: number };
};
const TimerBar = (props: TimerBarProps) => {
  const { timeRemaining, totalTime, windowDimensions } = props;
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
