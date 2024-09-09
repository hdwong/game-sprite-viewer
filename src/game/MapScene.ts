import { forEach } from "lodash-es";

class MapScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MapScene' });
  }

  private _player: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody | null = null;
  private _collisionLayer: Phaser.Tilemaps.TilemapLayer | null = null;
  private _camera: Phaser.Cameras.Scene2D.Camera | null = null;
  private _cursors: Phaser.Types.Input.Keyboard.CursorKeys | undefined;
  private _targetPosition: { x: number, y: number } | undefined;
  private _moving = false;

  preload() {
    this.load.setBaseURL('assets');
    this.load.tilemapTiledJSON('map', 'maps/map1.json');
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
    map.tilesets.forEach((tileset: any) => {
      const { name } = tileset;
      if (name) {
        map.addTilesetImage(name, name);
      }
    });
    // get layer data
    const json = this.cache.tilemap.get('map');
    forEach(json.data.layers, (layer: any) => {
      if (layer.name === 'Collision') {
        this._collisionLayer = map.createLayer(layer.name, map.tilesets.map(ts => ts.name), 0, 0);
        if (this._collisionLayer) {
          this._collisionLayer.setCollisionByExclusion([ -1 ])
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
        return;
      }
      if (layer.type === 'tilelayer' && layer.visible) {
        map.createLayer(layer.name, map.tilesets.map(ts => ts.name), 0, 0);
      }
    });
    if (this._player && this._collisionLayer) {
      this.physics.add.collider(this._player, this._collisionLayer, this._collideCallback, undefined, this);
    }

    // get camera
    this._camera = this.cameras.main;
    this._camera.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this._camera.startFollow(this._player!, true);

    this._cursors = this.input.keyboard?.createCursorKeys();
  }

  update() {
    if (! this._moving && this._cursors) {
      if (this._cursors.left.isDown) {
        this._move('left');
      } else if (this._cursors.right.isDown) {
        this._move('right');
      } else if (this._cursors.up.isDown) {
        this._move('up');
      } else if (this._cursors.down.isDown) {
        this._move('down');
      } else {
        this._player?.anims.stop();
        this._player?.setFrame(0);
      }
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

export default MapScene;
