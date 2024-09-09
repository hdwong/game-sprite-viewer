import { AUTO, Game } from "phaser";
import { useLayoutEffect, useRef } from "react";
import MapScene from "./MapScene";

const config: Phaser.Types.Core.GameConfig = {
  type: AUTO,
  parent: 'world-map-container',
  backgroundColor: '#fff',
  pixelArt: true,
  roundPixels: true,
  physics: {
    default: 'arcade',
    arcade: {
      debug: true,
    },
  },
  scale: {
    mode: Phaser.Scale.RESIZE,
    parent: 'world-map',
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: '100%',
    height: '100%',
  },
  scene: [
    MapScene,
  ],
};

const WorldMap = () => {
  const refGame = useRef<Game | null>(null);

  useLayoutEffect(() => {
    if (! refGame.current) {
      const width = window.innerWidth;
      const height = window.innerHeight
      refGame.current = new Game({ ...config, width, height });
    }
  }, [ refGame ]);

  return (
    <div id="world-map">
      <div id="world-map-container" />
    </div>
  );
};

export default WorldMap;
