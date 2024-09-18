import { useRef, useEffect } from "react";
import {
  WS_SERVER_MESSAGE_TYPES,
  WS_SERVER_EVENT,
  WS_CLIENT_EVENT,
} from "../utils/messages";
import { Action, actionTypes } from "../state/types";

export const useGameSocket = (
  url: string,
  dispatch: React.Dispatch<Action>
) => {
  const socketRef = useRef<WebSocket>();

  useEffect(() => {
    let ws: WebSocket;

    const connect = () => {
      ws = new WebSocket(url);
      socketRef.current = ws;

      ws.onopen = () => {
        console.log("WebSocket connection established");
        dispatch({ type: actionTypes.SET_ERROR_MESSAGE, message: "" });
      };

      ws.onmessage = (event) => {
        const message = JSON.parse(event.data) as WS_SERVER_EVENT;
        switch (message.type) {
          case WS_SERVER_MESSAGE_TYPES.QUEUE_UPDATE:
            dispatch({
              type: actionTypes.SET_QUEUE_POSITION,
              position: message.position,
            });
            break;
          case WS_SERVER_MESSAGE_TYPES.GAME_START:
            // @ts-expect-error - need to narrow down the type
            dispatch({ type: actionTypes.START_GAME, gameData: message });
            break;
          case WS_SERVER_MESSAGE_TYPES.GAME_UPDATE:
            // @ts-expect-error - need to narrow down the type
            dispatch({ type: actionTypes.UPDATE_GAME, gameData: message });
            break;
          case WS_SERVER_MESSAGE_TYPES.MERGE:
            dispatch({
              type: actionTypes.HANDLE_MERGE,
              fromCell: message.fromCell,
              toCell: message.toCell,
            });
            setTimeout(() => {
              dispatch({ type: actionTypes.CLEAR_MERGE_EFFECT });
            }, 300);
            break;
          case WS_SERVER_MESSAGE_TYPES.SWAP:
            dispatch({
              type: actionTypes.HANDLE_SWAP,
              fromCell: message.fromCell,
              toCell: message.toCell,
            });
            setTimeout(() => {
              dispatch({ type: actionTypes.CLEAR_SWAP_EFFECT });
            }, 300);
            break;
          case WS_SERVER_MESSAGE_TYPES.GAME_OVER:
            // @ts-expect-error - need to narrow down the type
            dispatch({ type: actionTypes.END_GAME, gameOverData: message });
            break;
          case WS_SERVER_MESSAGE_TYPES.ERROR:
            dispatch({
              type: actionTypes.SET_ERROR_MESSAGE,
              message: message.message,
            });
            break;
          default:
            console.log("Unknown message type:", message.type);
            break;
        }
      };

      ws.onclose = (event) => {
        console.log("WebSocket connection closed", event);
        setTimeout(connect, 3000);
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        dispatch({
          type: actionTypes.SET_ERROR_MESSAGE,
          message: "WebSocket connection error. Please try again later.",
        });
      };
    };

    connect();

    return () => {
      if (ws) {
        // ws.close();
      }
    };
  }, [url, dispatch]);

  const sendMessage = (message: WS_CLIENT_EVENT) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(message));
    } else {
      console.error("Socket is not connected");
    }
  };

  return {
    sendMessage,
  };
};
