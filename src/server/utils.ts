import { Board, ItemType, itemTypes } from "./types";

export function createEmptyBoard(): Board {
  return Array(4)
    .fill(null)
    .map(() =>
      Array(4)
        .fill(null)
        .map(() => getRandomItemType())
    );
}

export function getRandomItemType(): ItemType {
  const types = Object.values(itemTypes).filter(Boolean);
  console.log({ types });
  return types[Math.floor(Math.random() * types.length)];
}
