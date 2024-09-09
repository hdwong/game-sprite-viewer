import { chunk, forEach, range } from "lodash-es";
import EasyStar from "easystarjs";
import { EventEmitter } from "./EventEmitter";

class PathFindingScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PathFinding' });
  }

  private _map: Phaser.Tilemaps.Tilemap | null = null;
  private _player: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody | null = null;
  private _collisionLayer: Phaser.Tilemaps.TilemapLayer | null = null;
  private _camera: Phaser.Cameras.Scene2D.Camera | null = null;
  private _cursors: Phaser.Types.Input.Keyboard.CursorKeys | undefined;
  private _targetPosition: { x: number, y: number } | undefined;
  private _moving = false;

  private _easyStar: EasyStar.js | null = null;
  private _pathGraphics: Phaser.GameObjects.Graphics | null = null;
  private _pathTexts: Phaser.GameObjects.Text[] = [];

  private _moveTimeline: Phaser.Time.Timeline | null = null;

  preload() {
    this.load.setBaseURL('assets');
    this.load.tilemapTiledJSON('map', 'maps/map2.json');
    this.load.on('filecomplete-tilemapJSON-map', (_: string, __: string, data: any) => {
      // load tilesets images
      data.tilesets.forEach((tileset: any) => {
        const { name, image } = tileset;
        if (! name) {
          return;
        }
        this.load.image(name, `maps/${image}`);
      });
    }, this);

    this.load.spritesheet('sprite', 'sprites/test.png', {
      frameWidth: 32,
      frameHeight: 32,
    });
    this.load.on('filecomplete-spritesheet-sprite', () => {
      // add sprite animations
      this.anims.create({
        key: 'down',
        frames: this.anims.generateFrameNumbers('sprite', { start: 0, end: 3 }),
        frameRate: 10,
        repeat: -1,
      });
      this.anims.create({
        key: 'right',
        frames: this.anims.generateFrameNumbers('sprite', { start: 4, end: 7 }),
        frameRate: 10,
        repeat: -1,
      });
      this.anims.create({
        key: 'up',
        frames: this.anims.generateFrameNumbers('sprite', { start: 8, end: 11 }),
        frameRate: 10,
        repeat: -1,
      });
      this.anims.create({
        key: 'left',
        frames: this.anims.generateFrameNumbers('sprite', { start: 12, end: 15 }),
        frameRate: 10,
        repeat: -1,
      });
    });
  }

  create() {
    const map = this.make.tilemap({ key: 'map' });
    this._map = map;
    map.tilesets.forEach((tileset: any) => {
      const { name } = tileset;
      if (name) {
        map.addTilesetImage(name, name);
      }
    });
    // get layer data
    const json = this.cache.tilemap.get('map');
    forEach(json.data.layers, (layer: any) => {
      if (layer.type === 'objectgroup') {
        // add sprite
        // find start point
        const startPoint = { x: 0, y: 0 };
        if (layer.objects) {
          const startPointObject = layer.objects.find((obj: any) => obj.name === 'StartPoint');
          if (startPointObject) {
            startPoint.x = startPointObject.x;
            startPoint.y = startPointObject.y;
          }
        }
        this._player = this.physics.add.sprite(startPoint.x, startPoint.y, 'sprite', 0)
            .setOrigin(0, 0)
            .play('down');

        // emit position
        const x = startPoint.x / map.tileWidth << 0;
        const y = startPoint.y / map.tileHeight << 0;
        let terrain = '';
        let cost = 0;
        const tile0 = map!.getTileAt(x, y, true, 'Terrain');
        if (tile0 && tile0.properties) {
          terrain = tile0.properties.terrain;
        }
        const tile1 = map!.getTileAt(x, y, true, 'PathFinding');
        if (tile1 && tile1.properties) {
          cost = tile1.properties.cost;
        }
        EventEmitter.emit('position', { x, y, terrain, cost });
        return;
      }
      if (layer.name === 'PathFinding') {
        // 生成 EasyStar 实例
        this._easyStar = new EasyStar.js();
        // 生成 grid 二维数组
        const grid = chunk(layer.data, map.width) as Array<Array<number>>;
        this._easyStar.setGrid(grid);
        // 遍历 map.tileset 并生成 costMap
        const costTileset = map.getTileset('pathfinding_cost');
        if (! costTileset) {
          return;
        }
        const firstgid = costTileset.firstgid;
        forEach(costTileset.tileProperties, (v: { cost: number }, index) => {
          this._easyStar!.setTileCost(parseInt(index, 10) + firstgid, v.cost * 2);
        });
        this._easyStar.setAcceptableTiles(range(0, 14).map(v => v + firstgid));

        // 同时增加一个碰撞图层
        this._collisionLayer = map.createLayer(layer.name, map.tilesets.map(ts => ts.name), 0, 0);
        if (this._collisionLayer) {
          this._collisionLayer.setCollisionByProperty({ cost: -1 })
              .setAlpha(0);

          if (this.game.config.physics.arcade?.debug) {
            // 设置碰撞调试信息，确保看到 tile 的碰撞框
            this._collisionLayer.renderDebug(this.add.graphics(), {
              tileColor: null,
              collidingTileColor: new Phaser.Display.Color(255, 0, 0, 100),
              faceColor: new Phaser.Display.Color(255, 127, 0, 255)
            });
          }
        }
        return;
      }
      if (layer.type === 'tilelayer' && layer.visible) {
        map.createLayer(layer.name, map.tilesets.map(ts => ts.name), 0, 0);
      }
    });
    if (this._player && this._collisionLayer) {
      this._player.setCollideWorldBounds(true);
      this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
      this.physics.add.collider(this._player, this._collisionLayer, this._collideCallback, undefined, this);
    }

    // get camera
    this._camera = this.cameras.main;
    this._camera.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this._camera.startFollow(this._player!, true);

    this._cursors = this.input.keyboard?.createCursorKeys();

    // 增加点击事件
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (! this._easyStar || ! this._player) {
        return;
      }
      const startX = this._player.x / map.tileWidth << 0;
      const startY = this._player.y / map.tileHeight << 0;
      const endX = (pointer.x + this._camera!.scrollX) / map.tileWidth << 0;
      const endY = (pointer.y + this._camera!.scrollY) / map.tileHeight << 0;
      if (endX < 0 || endY < 0 || endX >= map.width || endY >= map.height) {
        return;
      }
      if (startX === endX && startY === endY) {
        return;
      }
      this._easyStar.findPath(startX, startY, endX, endY, path => {
        if (path) {
          this._moving = true;
          // 生成路径, 并使用 graphics 绘制
          if (this._pathGraphics) {
            this._pathGraphics.destroy();
          }
          this._pathTexts.forEach(v => v.destroy());
          this._pathTexts = [];
          if (this._moveTimeline) {
            this._moveTimeline.destroy();
          }

          this._pathGraphics = this.add.graphics();
          this._pathGraphics.fillStyle(0xffffff, 0.5);
          // 创建 timeline
          this._moveTimeline = this.add.timeline([]);
          let totalCost = 0;
          for (let i = 1; i < path.length; i++) {
            const point = path[i];
            // 显示半透明矩形
            this._pathGraphics.fillRect(point.x * map.tileWidth, point.y * map.tileHeight, map.tileWidth, map.tileHeight);
            // 获取当前 point 的 tile cost
            const tile = map.getTileAt(point.x, point.y);
            if (tile && tile.properties) {
              totalCost += tile.properties.cost;
              // 输出 tile.properties.cost 文本到 tile 中心
              this._pathTexts.push(this.add.text(point.x * map.tileWidth + map.tileWidth / 2,
                  point.y * map.tileHeight + map.tileHeight / 2,
                  tile.properties.cost, {
                    color: '#ff0000',
                    fontSize: '12px',
                  }).setOrigin(0.5, 0.5));
            }
            // 添加动画到 timeline
            this._moveTimeline.add({
              from: 200,
              tween: {
                targets: this._player,
                x: point.x * map.tileWidth,
                y: point.y * map.tileHeight,
                duration: 200,
                onStart: () => {
                  // 获取上一个 point
                  const lastPoint = path[i - 1];
                  // 计算方向
                  let direction = 'down';
                  if (lastPoint.x === point.x) {
                    if (lastPoint.y > point.y) {
                      direction = 'up';
                    }
                  } else {
                    if (lastPoint.x > point.x) {
                      direction = 'left';
                    } else {
                      direction = 'right';
                    }
                  }
                  this._player?.play(direction, true);
                },
                onComplete: () => {
                  // emit position
                  const x = point.x;
                  const y = point.y;
                  let terrain = '';
                  let cost = 0;
                  const tile0 = map!.getTileAt(x, y, true, 'Terrain');
                  if (tile0 && tile0.properties) {
                    terrain = tile0.properties.terrain;
                  }
                  const tile1 = map!.getTileAt(x, y, true, 'PathFinding');
                  if (tile1 && tile1.properties) {
                    cost = tile1.properties.cost;
                  }

                  EventEmitter.emit('position', { x, y, terrain, cost });
                  // 如果是最后一个 point
                  if (i === path.length - 1) {
                    this._moving = false;
                  }
                },
              },
            });
          }
          this._moveTimeline.play();
          EventEmitter.emit('path', path, totalCost);
        } else {
          this._moving = false;
        }
      });
      this._easyStar.calculate();
    });
  }

  update() {
    if (! this._moving && this._cursors) {
      if (this._cursors.left.isDown || this._cursors.right.isDown || this._cursors.up.isDown || this._cursors.down.isDown) {
        if (this._pathGraphics) {
          this._pathGraphics.destroy();
          this._pathGraphics = null;
        }
        this._pathTexts.forEach(v => v.destroy());
        this._pathTexts = [];
        if (this._moveTimeline) {
          this._moveTimeline.destroy();
          this._moveTimeline = null;
        }
      }
      if (this._cursors.left.isDown) {
        this._move('left');
      } else if (this._cursors.right.isDown) {
        this._move('right');
      } else if (this._cursors.up.isDown) {
        this._move('up');
      } else if (this._cursors.down.isDown) {
        this._move('down');
      }
    }
    if (! this._moving) {
      this._player?.anims.stop();
      this._player?.setFrame(0);
    }
  }

  private _movingTimer: Phaser.Time.TimerEvent;

  private _move(direction: string) {
    if (! this._player) {
      return;
    }
    const distance = 32;
    const duration = 200;
    let deltaX = 0, deltaY = 0;
    if (direction === 'left') {
      deltaX = -distance;
    } else if (direction === 'right') {
      deltaX = distance;
    } else if (direction === 'up') {
      deltaY = -distance;
    } else if (direction === 'down') {
      deltaY = distance;
    }
    this._targetPosition = {
      x: this._player.x + deltaX,
      y: this._player.y + deltaY,
    };
    this._moving = true;
    this._player.play(direction, true);

    // velocity
    if (deltaX) {
      this._player.setVelocityX(deltaX * 1000 / duration);
    } else if (deltaY) {
      this._player.setVelocityY(deltaY * 1000 / duration);
    }

    // stop moving after duration
    this._movingTimer = this.time.delayedCall(duration, () => {
      if (this._targetPosition) {
        this._stopMoving(this._targetPosition.x, this._targetPosition.y);
        // emit position
        const x = this._targetPosition.x / this._map!.tileWidth << 0;
        const y = this._targetPosition.y / this._map!.tileHeight << 0;
        let terrain = '';
        let cost = 0;
        const tile0 = this._map!.getTileAt(x, y, true, 'Terrain');
        if (tile0 && tile0.properties) {
          terrain = tile0.properties.terrain;
        }
        const tile1 = this._map!.getTileAt(x, y, true, 'PathFinding');
        if (tile1 && tile1.properties) {
          cost = tile1.properties.cost;
        }
        EventEmitter.emit('position', { x, y, terrain, cost });
        this._targetPosition = undefined;
      }
    });
  }

  private _collideCallback = (sprite: any) => {
    if (this._movingTimer) {
      this._movingTimer.remove();
    }
    this._stopMoving(sprite.x, sprite.y);
  }

  private _stopMoving(x: number, y: number) {
    this._moving = false;
    this._player!.setVelocity(0);
    // set position
    this._player!.x = x;
    this._player!.y = y;
  }
}

export default PathFindingScene;
