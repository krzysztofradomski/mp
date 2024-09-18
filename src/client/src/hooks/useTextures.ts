import * as PIXI from "pixi.js";
import { useState, useEffect } from "react";
import { PixiTexture } from "../components/game/types";
import { TextureTypes } from "../utils/urls";

export const useTextures = (tileList: TextureTypes) => {
  const [texturesLoaded, setTexturesLoaded] = useState({});
  useEffect(() => {
    const loadTextures = async () => {
      const loadedTextures: { [key: string]: PixiTexture } = {};
      for (const tile of tileList) {
        try {
          // @ts-expect-error - property assets exists on PIXI and works, wtf
          const texture = await PIXI.Assets.load(tile.url);
          loadedTextures[tile.type] = texture;
          console.log({ texture });
        } catch (error) {
          console.error(`Failed to load texture for ${tile.type}:`, error);
        }
      }
      setTexturesLoaded(loadedTextures);
    };
    loadTextures();
  }, [tileList]);
  return texturesLoaded;
};
