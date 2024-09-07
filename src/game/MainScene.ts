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
    this.load.setBaseURL('assets/sprites');
    this.load.spritesheet('test0', 'test.png', {
      frameWidth: 32,
      frameHeight: 32,
    });
    this.load.spritesheet('test1', 'test1.png', {
      frameWidth: 32,
      frameHeight: 32,
    });
    this.load.spritesheet('test2', 'test2.png', {
      frameWidth: 32,
      frameHeight: 32,
    });
    this.load.spritesheet('test3', 'test3.png', {
      frameWidth: 64,
      frameHeight: 64,
    });
  }

  private _getSpriteKey() {
    return `test${this._spriteIndex}`;
  }

  private _getSpriteFrameNumbers(direction: string)
  {
    switch (direction) {
      case 'front':
        if (this._spriteIndex === '3') {
          return { start: 18, end: 26 };
        }
        return { start: 0, end: 3 };
      case 'right':
        if (this._spriteIndex === '3') {
          return { start: 27, end: 35 };
        }
        return { start: 4, end: 7 };
      case 'left':
        if (this._spriteIndex === '3') {
          return { start: 9, end: 17 };
        }
        return { start: 12, end: 15 };
      case 'back':
        if (this._spriteIndex === '3') {
          return { start: 0, end: 8 };
        }
        return { start: 8, end: 11 };
      default:
    }
    return { start: 0, end: 0 };
  }

  private _createAnimations(remove = false) {
    const frameRateTimes = this._spriteIndex === '3' ? 2 : 1;

    if (remove) {
      this.anims.remove('front');
      this.anims.remove('right');
      this.anims.remove('back');
      this.anims.remove('left');
    }
    this.anims.create({
      key: 'front',
      frames: this.anims.generateFrameNumbers(this._getSpriteKey(), this._getSpriteFrameNumbers('front')),
      frameRate: this._frameRate * frameRateTimes,
      repeat: -1,
    });
    this.anims.create({
      key: 'right',
      frames: this.anims.generateFrameNumbers(this._getSpriteKey(), this._getSpriteFrameNumbers('right')),
      frameRate: this._frameRate * frameRateTimes,
      repeat: -1,
    });
    this.anims.create({
      key: 'back',
      frames: this.anims.generateFrameNumbers(this._getSpriteKey(), this._getSpriteFrameNumbers('back')),
      frameRate: this._frameRate * frameRateTimes,
      repeat: -1,
    });
    this.anims.create({
      key: 'left',
      frames: this.anims.generateFrameNumbers(this._getSpriteKey(), this._getSpriteFrameNumbers('left')),
      frameRate: this._frameRate * frameRateTimes,
      repeat: -1,
    });

    if (this._spriteIndex === '3') {
      this._sprite?.setScale(1);
    } else {
      this._sprite?.setScale(2);
    }
  }

  create() {
    const { width, height } = this.game.config;

    this._sprite = this.add.sprite(width as number >> 1, height as number >> 1, this._getSpriteKey(), 0)
        .setOrigin(0.5, 0.5);

    this._createAnimations();

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
        const standIndex = this._getSpriteFrameNumbers('front').start;
        this._sprite?.setTexture(this._getSpriteKey(), standIndex).stop();
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
    this._createAnimations(true);
    // update sprite
    this._sprite?.setTexture(this._getSpriteKey(), 0);
    this.move(this._direction);
  }

  changeFrameRate(frameRate: number) {
    this._frameRate = frameRate;
    // update animation
    this._createAnimations(true);
    // update sprite
    this.move(this._direction);
  }
}

export default MainScene;
