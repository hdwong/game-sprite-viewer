import { AUTO, Game } from "phaser";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import MainScene from "./MainScene";
import { EventEmitter } from "./EventEmitter";

const config: Phaser.Types.Core.GameConfig = {
  type: AUTO,
  width: 32,
  height: 32,
  parent: 'game-container',
  backgroundColor: '#fff',
  scene: [
    MainScene,
  ],
};

const SpriteViewer = () => {
  const refGame = useRef<Game | null>(null);

  const [ frameRate, setFrameRate ] = useState('1');
  const [ spriteIndex, setSpriteIndex ] = useState('0');
  const [ direction, setDirection ] = useState<string>('stand');

  useLayoutEffect(() => {
    if (! refGame.current) {
      refGame.current = new Game(config);
    }
    return () => {
      if (refGame.current) {
        refGame.current.destroy(true);
        refGame.current = null;
      }
    };
  }, [ refGame ]);

  useEffect(() => {
    EventEmitter.on('move', (direction: string) => {
      setDirection(direction);
    });
    return () => {
      EventEmitter.off('move');
    };
  }, []);

  const _move = (direction: string) => () => {
    if (refGame.current) {
      (refGame.current.scene.getScene('MainScene') as MainScene).move(direction);
    }
  };

  return (
    <div id="game">
      <div id="game-container" />
      <div id="controller">
        <div className="arrow">
          {
            [ 'up', 'down', 'left', 'right', 'up-left', 'up-right', 'down-left', 'down-right', 'stand' ].map((dir) => (
              <button key={dir} id={`${dir}-arrow`}
                  className={direction === dir ? 'active' : undefined}
                  onClick={_move(dir)} />
            ))
          }
        </div>
      </div>
      <div id="information">
        <div><label>Sprite:</label>
          <select value={spriteIndex} onChange={e => {
            const spriteIndex = e.target.value;
            setSpriteIndex(spriteIndex);
            if (refGame.current) {
              (refGame.current.scene.getScene('MainScene') as MainScene).changeSpriteIndex(spriteIndex);
            }
          }}>
            <option value="0">Preset 1</option>
            <option value="1">Preset 2</option>
            <option value="2">Preset 3</option>
          </select>
        </div>
        {
          [ '0', '1', '2' ].indexOf(spriteIndex) !== -1 && (
            <div className="source">Preset Sprite by: <a href="https://thedangercrew.com/" target="blank">https://thedangercrew.com/</a></div>
          )
        }
        <div><label>Animation FrameRate:</label>
          <select value={frameRate} onChange={e => {
            setFrameRate(e.target.value);
            if (refGame.current) {
              const frameRate = e.target.value === '0' ? 5 : (e.target.value === '2' ? 15 : 10);
              (refGame.current.scene.getScene('MainScene') as MainScene).changeFrameRate(frameRate);
            }
          }}>
            <option value="0">5</option>
            <option value="1">10</option>
            <option value="2">15</option>
          </select>
        </div>
        <div><label>Direction:</label> {direction}</div>
      </div>
    </div>
  );
};

export default SpriteViewer;
