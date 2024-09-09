import { AUTO, Game } from "phaser";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import PathFindingScene from "./PathFindingScene";
import { EventEmitter } from "./EventEmitter";

const config: Phaser.Types.Core.GameConfig = {
  type: AUTO,
  parent: 'path-finding-container',
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
    PathFindingScene,
  ],
};

const PathFinding = () => {
  const [ position, setPosition ] = useState({ x: 0, y: 0, terrain: '', cost: 0 });
  const [ path, setPath ] = useState<Array<{ x: number; y: number }>>([]);
  const [ totalCost, setTotalCost ] = useState(0);

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

  useEffect(() => {
    EventEmitter.on('path', (path: Array<{ x: number; y: number }>, cost: number) => {
      setPath(path);
      setTotalCost(cost);
    });
    EventEmitter.on('position', (position: { x: number; y: number; terrain: string; cost: number }) => {
      setPosition(position);
    });
    return () => {
      EventEmitter.off('path');
      EventEmitter.off('position');
    };
  }, []);

  return (
    <div id="path-finding">
      <div id="path-finding-container" />
      <div id="controller" ref={refContoller}>
        <h3>Sprite Position</h3>
        <div>
          <label>X:</label>
          <span>{ position ? position.x : '--' }</span>
        </div>
        <div>
          <label>Y:</label>
          <span>{ position ? position.y : '--' }</span>
        </div>
        <div>
          <label>Terrain:</label>
          <span>{ position ? position.terrain : '--' }</span>
        </div>
        <div>
          <label>Cost:</label>
          <span>{ position ? position.cost : '--' }</span>
        </div>
        <hr />
        <h3>Path</h3>
        <div>
          <label>Cost:</label>
          <span>{ totalCost }</span>
        </div>
        <div>
          <label>Path:</label>
          <div className="path-list">
            {
              path.map((p, i) => (
                <div key={i}>{i + 1}. {`(${p.x}, ${p.y})`}</div>
              ))
            }
          </div>
        </div>
      </div>
    </div>
  );
};

export default PathFinding;
