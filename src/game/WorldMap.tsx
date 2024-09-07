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
  scene: [
    MapScene,
  ],
};

const WorldMap = () => {
  const refContoller = useRef<HTMLDivElement>(null);
  const refGame = useRef<Game | null>(null);

  useLayoutEffect(() => {
    if (! refGame.current && refContoller.current) {
      const width = window.innerWidth;
      const height = window.innerHeight
      const { width: widthController } = refContoller.current.getBoundingClientRect();
      refGame.current = new Game({ ...config, width: width - widthController, height });
    }

    // 绑定 resize 事件
    const resize = () => {
      if (refGame.current && refContoller.current) {
        const width = window.innerWidth;
        const height = window.innerHeight
        const { width: widthController } = refContoller.current.getBoundingClientRect();
        refGame.current.scale.resize(width - widthController, height);
      }
    };
    window.addEventListener('resize', resize);

    return () => {
      if (refGame.current) {
        refGame.current.destroy(true);
        refGame.current = null;
      }
      window.removeEventListener('resize', resize);
    };
  }, [ refContoller, refGame ]);

  return (
    <div id="world-map">
      <div id="world-map-container" />
      <div id="controller" ref={refContoller}>
      </div>
    </div>
  );
};

export default WorldMap;
