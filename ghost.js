class Ghost {
  constructor(x, y, width, height, speed, color) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.speed = speed * 1.5;
    this.color = color;
    this.scared = false;
    this.direction = DIRECTION_LEFT;
  }

  moveProcess(targetX, targetY) {
    const spd = this.scared ? this.speed * 0.55 : this.speed;

    if (
      !this._canMove(this.x, this.y, this.direction, spd) ||
      Math.random() < 0.02
    ) {
      this.direction = this._smartDirection(spd, targetX, targetY);
    }

    if (this._canMove(this.x, this.y, this.direction, spd)) {
      switch (this.direction) {
        case DIRECTION_RIGHT:
          this.x += spd;
          break;
        case DIRECTION_LEFT:
          this.x -= spd;
          break;
        case DIRECTION_UP:
          this.y -= spd;
          break;
        case DIRECTION_BOTTOM:
          this.y += spd;
          break;
      }
      this.x = this._wrapX(this.x);
    }
  }

  draw(ctx, blockSize, powerTimer) {
    const x = this.x,
      y = this.y,
      w = blockSize,
      h = blockSize;

    let bodyColor = this.scared
      ? powerTimer < 100 && Math.floor(powerTimer / 10) % 2 === 0
        ? "#FFFFFF"
        : "#0000FF"
      : this.color;

    ctx.fillStyle = bodyColor;

    ctx.beginPath();
    ctx.arc(x + w / 2, y + h / 2, w / 2 - 1, Math.PI, 0);
    ctx.lineTo(x + w - 1, y + h);
    const waveCount = 4;
    for (let i = waveCount; i >= 0; i--) {
      ctx.lineTo(x + (w * i) / waveCount, y + h - (i % 2 === 0 ? 6 : 0));
    }
    ctx.lineTo(x + 1, y + h);
    ctx.closePath();
    ctx.fill();

    if (!this.scared) {
      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      ctx.arc(x + w * 0.35, y + h * 0.4, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x + w * 0.65, y + h * 0.4, 3.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#0000AA";
      ctx.beginPath();
      ctx.arc(x + w * 0.37, y + h * 0.43, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x + w * 0.67, y + h * 0.43, 2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 1.5;
      const ex1 = x + w * 0.33,
        ey = y + h * 0.38,
        sz = 3;
      ctx.beginPath();
      ctx.moveTo(ex1 - sz, ey - sz);
      ctx.lineTo(ex1 + sz, ey + sz);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(ex1 + sz, ey - sz);
      ctx.lineTo(ex1 - sz, ey + sz);
      ctx.stroke();
      const ex2 = x + w * 0.63;
      ctx.beginPath();
      ctx.moveTo(ex2 - sz, ey - sz);
      ctx.lineTo(ex2 + sz, ey + sz);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(ex2 + sz, ey - sz);
      ctx.lineTo(ex2 - sz, ey + sz);
      ctx.stroke();
    }
  }

  _canMove(x, y, dir, spd) {
    let nx = x,
      ny = y;
    if (dir === DIRECTION_RIGHT) nx += spd;
    else if (dir === DIRECTION_LEFT) nx -= spd;
    else if (dir === DIRECTION_UP) ny -= spd;
    else if (dir === DIRECTION_BOTTOM) ny += spd;

    const margin = 2;
    const checks = [
      [ny + margin, nx + margin],
      [ny + margin, nx + this.width - margin],
      [ny + this.height - margin, nx + margin],
      [ny + this.height - margin, nx + this.width - margin],
    ];
    for (const [py, px] of checks) {
      const gr = Math.floor(py / ONE_BLOCK);
      const gc = Math.floor(px / ONE_BLOCK);
      if (gr < 0 || gr >= ROWS || gc < 0 || gc >= COLS) return false;
      if (map[gr][gc] === 1) return false;
    }
    return true;
  }

  _smartDirection(spd, targetX, targetY) {
    const dirs = [
      DIRECTION_RIGHT,
      DIRECTION_LEFT,
      DIRECTION_UP,
      DIRECTION_BOTTOM,
    ];
    let validDirs = [];

    for (let dir of dirs) {
      if (this._canMove(this.x, this.y, dir, spd)) {
        validDirs.push(dir);
      }
    }

    if (validDirs.length === 0) return this.direction;

    if (this.scared || targetX === undefined || targetY === undefined) {
      return validDirs[Math.floor(Math.random() * validDirs.length)];
    }

    let bestDir = validDirs[0];
    let minDistance = Infinity;

    for (let dir of validDirs) {
      let nextX = this.x;
      let nextY = this.y;

      if (dir === DIRECTION_RIGHT) nextX += spd;
      if (dir === DIRECTION_LEFT) nextX -= spd;
      if (dir === DIRECTION_UP) nextY -= spd;
      if (dir === DIRECTION_BOTTOM) nextY += spd;

      let dist = Math.pow(nextX - targetX, 2) + Math.pow(nextY - targetY, 2);

      if (dist < minDistance) {
        minDistance = dist;
        bestDir = dir;
      }
    }

    return bestDir;
  }

  _wrapX(x) {
    if (x + this.width <= 0) return COLS * ONE_BLOCK - 1;
    if (x >= COLS * ONE_BLOCK) return 1 - this.width;
    return x;
  }
}
