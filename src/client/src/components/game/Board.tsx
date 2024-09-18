/* eslint-disable @typescript-eslint/no-explicit-any */
import { Sprite, Container } from "@pixi/react";
import { useState, useEffect } from "react";
import { grid } from "../../utils/grid";
import { Board } from "../../utils/server-types";
import { PixiTexture } from "./types";

type BoardProps = {
  board: Board;
  tileTexturesLoaded: { [key: string]: PixiTexture };
  selectedTile: [number, number] | null;
  handleTileDrop: (
    fromRow: number,
    fromCol: number,
    toRow: number,
    toCol: number
  ) => void;
  mergeEffect: { fromCell: [number, number]; toCell: [number, number] } | null;
  swapEffect: { fromCell: [number, number]; toCell: [number, number] } | null;
  windowDimensions: { width: number; height: number };
};

const GameBoard = (props: BoardProps) => {
  const {
    board,
    tileTexturesLoaded,
    selectedTile,
    handleTileDrop,
    mergeEffect,
    swapEffect,
    windowDimensions,
  } = props;
  const [tileSize, setTileSize] = useState(0);
  const [padding, setPadding] = useState(0);
  const [draggingTile, setDraggingTile] = useState<{
    row: number;
    col: number;
    offsetX: number;
    offsetY: number;
    x: number;
    y: number;
  } | null>(null);

  useEffect(() => {
    const updateDimensions = () => {
      const minDimension = Math.min(
        windowDimensions.width,
        windowDimensions.height
      );
      const newTileSize = minDimension / (grid + 1);
      setTileSize(newTileSize);
      setPadding(newTileSize / 7);
    };
    updateDimensions();
  }, [windowDimensions]);

  const handlePointerDown = (
    event: {
      data: { getLocalPosition: (arg0: any) => any };
      currentTarget: { parent: any };
      stopPropagation: () => void;
    },
    rowIndex: number,
    colIndex: number
  ) => {
    const cell = board[rowIndex][colIndex];
    if (!cell) return; // Only proceed if cell is not empty

    const x = colIndex * (tileSize + padding);
    const y = rowIndex * (tileSize + padding);

    // Get the initial position of the pointer relative to the tile
    const localPosition = event.data.getLocalPosition(
      event.currentTarget.parent
    );
    const offsetX = localPosition.x - x;
    const offsetY = localPosition.y - y;

    setDraggingTile({
      row: rowIndex,
      col: colIndex,
      offsetX,
      offsetY,
      x,
      y,
    });

    event.stopPropagation();
  };

  const handlePointerMove = (event: any) => {
    if (!draggingTile) return;

    const localPosition = event.data.getLocalPosition(event.currentTarget);
    const newX = localPosition.x - draggingTile.offsetX;
    const newY = localPosition.y - draggingTile.offsetY;

    // Update the position of the dragging tile
    setDraggingTile((prev) => prev && { ...prev, x: newX, y: newY });
  };

  const handlePointerUp = (event: any) => {
    if (!draggingTile) return;

    const localPosition = event.data.getLocalPosition(event.currentTarget);
    const dropX = localPosition.x;
    const dropY = localPosition.y;

    // Calculate which tile the pointer is over
    const targetCol = Math.floor(dropX / (tileSize + padding));
    const targetRow = Math.floor(dropY / (tileSize + padding));

    // Check if the target is within the board boundaries
    if (
      targetRow >= 0 &&
      targetRow < grid &&
      targetCol >= 0 &&
      targetCol < grid &&
      (targetRow !== draggingTile.row || targetCol !== draggingTile.col)
    ) {
      // Perform the swap
      handleTileDrop(draggingTile.row, draggingTile.col, targetRow, targetCol);
    }

    // Clear dragging state
    setDraggingTile(null);

    event.stopPropagation();
  };

  if (!tileTexturesLoaded || Object.keys(tileTexturesLoaded).length === 0) {
    return null; // Textures not loaded yet
  }

  const tiles = [] as JSX.Element[];

  board.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      const x = colIndex * (tileSize + padding);
      const y = rowIndex * (tileSize + padding);
      let texture = null;
      if (cell && tileTexturesLoaded[cell]) {
        texture = tileTexturesLoaded[cell];
      }
      const isSelected =
        selectedTile &&
        selectedTile[0] === rowIndex &&
        selectedTile[1] === colIndex;
      const isMerging =
        mergeEffect &&
        ((mergeEffect.fromCell[0] === rowIndex &&
          mergeEffect.fromCell[1] === colIndex) ||
          (mergeEffect.toCell[0] === rowIndex &&
            mergeEffect.toCell[1] === colIndex));
      const alpha = cell ? (isMerging ? 0.5 : 1) : 0;

      let posX = x;
      let posY = y;

      if (swapEffect) {
        const fromIndex = swapEffect.fromCell;
        const toIndex = swapEffect.toCell;
        if (fromIndex[0] === rowIndex && fromIndex[1] === colIndex) {
          posX = toIndex[1] * (tileSize + padding);
          posY = toIndex[0] * (tileSize + padding);
        } else if (toIndex[0] === rowIndex && toIndex[1] === colIndex) {
          posX = fromIndex[1] * (tileSize + padding);
          posY = fromIndex[0] * (tileSize + padding);
        }
      }

      if (
        draggingTile &&
        draggingTile.row === rowIndex &&
        draggingTile.col === colIndex
      ) {
        // Do not render this tile here, we'll render it later
        return;
      }

      if (texture) {
        tiles.push(
          <Sprite
            key={`${rowIndex}-${colIndex}`}
            texture={texture}
            x={posX}
            y={posY}
            width={tileSize}
            height={tileSize}
            eventMode={cell ? "dynamic" : "none"}
            onpointerdown={(event: any) =>
              handlePointerDown(event, rowIndex, colIndex)
            }
            cursor={cell ? "pointer" : "default"}
            tint={isSelected ? 0xdddddd : 0xffffff}
            alpha={alpha}
          />
        );
      }
    });
  });

  return (
    <Container
      eventMode="dynamic"
      onpointermove={handlePointerMove}
      onpointerup={handlePointerUp}
      onpointerupoutside={handlePointerUp}
    >
      {tiles}
      {draggingTile &&
        (() => {
          const { row, col, x, y } = draggingTile;
          const cell = board[row][col];
          const texture = cell ? tileTexturesLoaded[cell] : null;
          return (
            <Sprite
              key={`dragging-${row}-${col}`}
              texture={texture}
              x={x}
              y={y}
              width={tileSize}
              height={tileSize}
              eventMode="none"
              cursor="grabbing"
              alpha={1}
            />
          );
        })()}
    </Container>
  );
};

export default GameBoard;
