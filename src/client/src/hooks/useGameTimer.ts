import { useState, useEffect } from "react";

export const useGameTimer = (endTime: number) => {
  const [timeRemaining, setTimeRemaining] = useState(0);
  useEffect(() => {
    const updateRemainingTime = () => {
      const now = Date.now();
      const remaining = Math.max(0, endTime - now);
      setTimeRemaining(remaining);
      if (remaining > 0) {
        requestAnimationFrame(updateRemainingTime);
      }
    };
    if (endTime) {
      requestAnimationFrame(updateRemainingTime);
    }
  }, [endTime]);
  return timeRemaining;
};
