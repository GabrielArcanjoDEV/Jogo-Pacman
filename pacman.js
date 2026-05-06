class Pacman {
    constructor(x, y, width, height, speed) {
        this.x         = x;
        this.y         = y;
        this.width     = width;
        this.height    = height;
        this.speed     = speed;
        this.direction     = DIRECTION_RIGHT;
        this.nextDirection = DIRECTION_RIGHT;
        this.frame         = 0; 
    }

    moveProcess() {
        this.changeDirectionIfPossible();
        this.moveForwards();
        if (this.checkCollision()) {
            this.moveBackwards();
        }
        this.x = this._wrapX(this.x);
    }

    changeDirectionIfPossible() {
        if (this.direction === this.nextDirection) return;

        const prevDir  = this.direction;
        this.direction = this.nextDirection;
        this.moveForwards();

        if (this.checkCollision()) {
            this.moveBackwards();
            this.direction = prevDir;
        } else {
            this.moveBackwards();
        }
    }

    moveForwards() {
        switch (this.direction) {
            case DIRECTION_RIGHT:  this.x += this.speed; break;
            case DIRECTION_LEFT:   this.x -= this.speed; break;
            case DIRECTION_UP:     this.y -= this.speed; break;
            case DIRECTION_BOTTOM: this.y += this.speed; break;
        }
    }

    moveBackwards() {
        switch (this.direction) {
            case DIRECTION_RIGHT:  this.x -= this.speed; break;
            case DIRECTION_LEFT:   this.x += this.speed; break;
            case DIRECTION_UP:     this.y += this.speed; break;
            case DIRECTION_BOTTOM: this.y -= this.speed; break;
        }
    }
    checkCollision() {
        const margin = 2;
        const checks = [
            [this.y + margin,              this.x + margin             ],
            [this.y + margin,              this.x + this.width  - margin],
            [this.y + this.height - margin, this.x + margin             ],
            [this.y + this.height - margin, this.x + this.width  - margin],
        ];
        for (const [py, px] of checks) {
            const gr = Math.floor(py / ONE_BLOCK);
            const gc = Math.floor(px / ONE_BLOCK);
            if (gr < 0 || gr >= ROWS || gc < 0 || gc >= COLS) return true;
            if (map[gr][gc] === 1) return true;
        }
        return false;
    }

    _wrapX(x) {
        if (x + this.width <= 0)   return COLS * ONE_BLOCK - 1;
        if (x >= COLS * ONE_BLOCK) return 1 - this.width;
        return x;
    }
}
