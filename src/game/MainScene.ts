import { EventEmitter } from "./EventEmitter";

class MainScene extends Phaser.Scene {
  private _sprite: Phaser.GameObjects.Sprite | null = null;
  private _cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private _spriteIndex = '0';
  private _frameRate = 10;
  private _direction = 'stand';

  constructor() {
    super('MainScene');
  }

  preload() {
    this.load.spritesheet('test0', 'assets/test.png', {
      frameWidth: 32,
      frameHeight: 32,
    });
    this.load.spritesheet('test1', 'assets/test1.png', {
      frameWidth: 32,
      frameHeight: 32,
    });
    this.load.spritesheet('test2', 'assets/test2.png', {
      frameWidth: 32,
      frameHeight: 32,
    });
  }

  private _getSpriteKey() {
    return `test${this._spriteIndex}`;
  }

  private _createAnimations() {
    this.anims.create({
      key: 'front',
      frames: this.anims.generateFrameNumbers(this._getSpriteKey(), { start: 0, end: 3 }),
      frameRate: this._frameRate,
      repeat: -1,
    });
    this.anims.create({
      key: 'right',
      frames: this.anims.generateFrameNumbers(this._getSpriteKey(), { start: 4, end: 7 }),
      frameRate: this._frameRate,
      repeat: -1,
    });
    this.anims.create({
      key: 'back',
      frames: this.anims.generateFrameNumbers(this._getSpriteKey(), { start: 8, end: 11 }),
      frameRate: this._frameRate,
      repeat: -1,
    });
    this.anims.create({
      key: 'left',
      frames: this.anims.generateFrameNumbers(this._getSpriteKey(), { start: 12, end: 15 }),
      frameRate: this._frameRate,
      repeat: -1,
    });
  }

  create() {
    const { width, height } = this.game.config;

    this._createAnimations();
    this._sprite = this.add.sprite(width as number >> 1, height as number >> 1, this._getSpriteKey(), 0)
        .setOrigin(0.5, 0.5);

    this._cursors = this.input.keyboard?.createCursorKeys();
  }

  update() {
    if (! this._sprite) {
      return;
    }
    if (this._cursors?.left?.isDown) {
      if (this._cursors?.up?.isDown) {
        this.move('up-left');
      } else if (this._cursors?.down?.isDown) {
        this.move('down-left');
      } else {
        this.move('left');
      }
    } else if (this._cursors?.right?.isDown) {
      if (this._cursors?.up?.isDown) {
        this.move('up-right');
      } else if (this._cursors?.down?.isDown) {
        this.move('down-right');
      } else {
        this.move('right');
      }
    } else if (this._cursors?.up?.isDown) {
      this.move('up');
    } else if (this._cursors?.down?.isDown) {
      this.move('down');
    }
  }

  move(direction: string) {
    switch (direction) {
      case 'up':
        this._sprite?.play('back', true);
        break;
      case 'down':
        this._sprite?.play('front', true);
        break;
      case 'left':
        this._sprite?.play('left', true);
        break;
      case 'right':
        this._sprite?.play('right', true);
        break;
      case 'up-left':
        break;
      case 'up-right':
        break;
      case 'down-left':
        break;
      case 'down-right':
        break;
      case 'stand':
        this._sprite?.setTexture(this._getSpriteKey(), 0).stop();
        break;
      default:
        return;
    }
    this._direction = direction;
    EventEmitter.emit('move', direction);
  }

  changeSpriteIndex(index: string) {
    this._spriteIndex = index;
    // update animation
    this.anims.remove('front');
    this.anims.remove('right');
    this.anims.remove('back');
    this.anims.remove('left');
    this._createAnimations();
    // update sprite
    this._sprite?.setTexture(this._getSpriteKey(), 0);
    this.move(this._direction);
  }

  changeFrameRate(frameRate: number) {
    this._frameRate = frameRate;
    // update animation
    this.anims.remove('front');
    this.anims.remove('right');
    this.anims.remove('back');
    this.anims.remove('left');
    this._createAnimations();
    // update sprite
    this.move(this._direction);
  }
}

export default MainScene;
