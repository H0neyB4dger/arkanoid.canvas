"use strict"

class Point {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
}

class Ball {
  constructor(arr, ctx, radius, position, speed, color) {
    this.arr = arr;
    this.canvas = ctx.canvas;
    this.ctx = ctx;
    this.radius = radius;
    this.position = position;
    this.speed = speed;
    this.color = color;
  }
  bonkWithWall() {
    const xMin = 0;
    const yMin = 0;
    const xMax = this.canvas.width;
    const yMax = Infinity;
    const x = this.position.x;
    const y = this.position.y;
    const r = this.radius;
    if (x + r + this.speed.x > xMax && x - r + this.speed.x < xMax)
      this.speed.x = -Math.abs(this.speed.x);
    else if (x - r + this.speed.x < xMin && x + r + this.speed.x > xMin)
      this.speed.x = Math.abs(this.speed.x);
    if (y + r + this.speed.y > yMax && y - r + this.speed.y < yMax)
      this.speed.y = -Math.abs(this.speed.y);
    else if (y - r + this.speed.y < yMin && y + r + this.speed.y > yMin)
      this.speed.y = Math.abs(this.speed.y);
  }
  isCollide(block) {
    const isIntersecting =
      this.position.x + this.speed.x + this.radius > block.position.x - block.size.x / 2 &&
      this.position.x + this.speed.x - this.radius < block.position.x + block.size.x / 2 &&
      this.position.y + this.speed.y + this.radius > block.position.y - block.size.y / 2 &&
      this.position.y + this.speed.y - this.radius < block.position.y + block.size.y / 2;
    return isIntersecting;
  }
  dist(obj) {
    const point1 = this.position;
    const point2 = obj.position;
    return Math.sqrt((point1.x - point2.x) ** 2 + (point1.y - point2.y) ** 2);
  }
  bonkWithObject() {
    let closestBlock = null;
    let closestIndex = null;
    let minDist = Infinity;
    for (let i = 0; i < this.arr.length; i++) {
      const obj = this.arr[i];
      const dist = this.dist(obj);
      if (obj.constructor.name === "Block" && this.isCollide(obj) && dist < minDist) {
        closestBlock = obj;
        closestIndex = i;
        minDist = dist;
      }
      if (obj.constructor.name === "Platform" && this.isCollide(obj) && this.speed.y > 0) {
        const totalSpeed = Math.sqrt(this.speed.x ** 2 + this.speed.y ** 2);
        const alpha = Math.atan(this.speed.x / this.speed.y);
        const beta = Math.PI - alpha;
        const gamma = Math.PI / 2;
        const k = -(this.position.x - obj.position.x) / (obj.size.x / 2 + this.radius);
        const boundary = Math.PI / 8;
        const newBeta = Math.min(
          Math.max(beta + k * gamma, Math.PI / 2 + boundary),
          3 * 2 * Math.PI / 4 - boundary
        );
        this.speed.x = Math.sin(newBeta) * totalSpeed;
        this.speed.y = Math.cos(newBeta) * totalSpeed;
      }
    }
    if (closestBlock !== null) {
      const b = closestBlock;
      const x = this.position.x - b.position.x;
      const y = this.position.y - b.position.y;
      const alpha = Math.atan2(y, x);
      const br = Math.atan2(b.size.y / 2, b.size.x / 2);
      const bl = Math.atan2(b.size.y / 2, -b.size.x / 2);
      const tl = Math.atan2(-b.size.y / 2, -b.size.x / 2);
      const tr = Math.atan2(-b.size.y / 2, b.size.x / 2);
      //console.log(radToDeg(br), radToDeg(bl), radToDeg(tl), radToDeg(tr), radToDeg(alpha));
      if (alpha >= br && alpha <= bl) {
        this.speed.y = Math.abs(this.speed.y);
      }
      else if ((alpha > bl && alpha <= Math.PI * 2) || (alpha >= -Math.PI * 2 && alpha < tl)) {
        this.speed.x = -Math.abs(this.speed.x);

      }
      else if (alpha >= tl && alpha <= tr) {
        this.speed.y = -Math.abs(this.speed.y);
      }
      else {
        this.speed.x = Math.abs(this.speed.x);
      }
      this.arr.splice(closestIndex, 1);
    }
  }
  move() {
    this.position.x += this.speed.x;
    this.position.y += this.speed.y;
  }
  tick() {
    if (this.position.y + this.radius > ctx.canvas.height) {
      return false
    }
    this.bonkWithWall();
    this.bonkWithObject();
    this.move();
    return true;
  }
  draw() {
    this.ctx.beginPath();
    this.ctx.fillStyle = this.color;
    this.ctx.arc(this.position.x, this.position.y, this.radius, 0, 2 * Math.PI);
    this.ctx.fill();
    this.ctx.closePath();
  }
}

class Block {
  constructor(ctx, size, position, color) {
    this.canvas = ctx.canvas;
    this.ctx = ctx;
    this.size = size;
    this.position = position;
    this.color = color;
  }
  tick() {
    return true;
  }
  draw() {
    this.ctx.beginPath();
    this.ctx.fillStyle = this.color;
    this.ctx.strokeStyle = "#000";
    this.ctx.rect(
      this.position.x - this.size.x / 2,
      this.position.y - this.size.y / 2,
      this.size.x,
      this.size.y
    );
    this.ctx.fill();
    this.ctx.stroke();
    this.ctx.closePath();
  }
}

class Platform {
  constructor(ctx, size, position, speed, platformProps, color) {
    this.ctx = ctx;
    this.size = size;
    this.position = position;
    this.speed = speed;
    this.platformProps = platformProps;
    this.color = color;
  }
  tick() {
    const right = this.platformProps.right;
    const left = this.platformProps.left;
    const xDif = right > left ? this.speed : right < left ? -this.speed : 0;
    this.position.x = Math.max(
      Math.min(this.position.x + xDif, this.ctx.canvas.width - this.size.x / 2),
      this.size.x / 2
    );
    return true;
  }
  draw() {
    ctx.beginPath();
    ctx.fillStyle = this.color;
    ctx.rect(
      this.position.x - this.size.x / 2,
      this.position.y - this.size.y / 2,
      this.size.x,
      this.size.y
    );
    ctx.fill();
    ctx.closePath();
  }
}


function radToDeg(rad) {
  return rad * 180 / Math.PI;
}

function degToRad(deg) {
  return deg * Math.PI / 180;
}

function crtPoint(x, y) {
  return new Point(x, y);
}

function crtBall(position, speed) {
  const ball = new Ball(
    objects,
    ctx,
    constProps.ball.radius,
    position,
    speed,
    constProps.ball.color
  );
  return ball;
}

function crtBlock(position) {
  const block = new Block(
    ctx,
    constProps.block.size,
    position,
    constProps.block.color
  );
  return block;
}

function crtPlatform() {
  const platform = new Platform(
    ctx,
    constProps.platform.size,
    crtPoint(canvas.width / 2, canvas.height - constProps.platform.size.y / 2),
    constProps.platform.speed,
    platformProps,
    constProps.platform.color
  );
  return platform;
}

function fillField(arr, position, rows, cols) {
  const size = constProps.block.size;
  const cornerPosition = crtPoint(
    position.x + size.x / 2,
    position.y + size.y / 2
  );
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      const newPosition = crtPoint(
        cornerPosition.x + i * size.x,
        cornerPosition.y + j * size.y
      );
      const block = crtBlock(newPosition);
      arr.push(block);
    }
  }
}

function setSize(element, width, height) {
  element.width = width;
  element.height = height;
}

function clear() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function init(objects) {
  const speedX = -Math.cos(Math.PI / 4) * constProps.ball.speed;
  const speedY = -Math.sin(Math.PI / 4) * constProps.ball.speed;
  const ball = crtBall(
    crtPoint(
      canvas.width / 2,
      canvas.height - constProps.platform.size.y - constProps.ball.radius
    ),
    crtPoint(speedX, speedY)
  );
  const platform = crtPlatform();
  objects.splice(0, objects.length);
  objects.push(ball);
  objects.push(platform);
  fillField(
    objects,
    crtPoint(0, constProps.block.size.y * 4),
    constProps.canvas.width / constProps.block.size.x,
    1
  );
  requestAnimationFrame(animate);
}

function writeCenter(text, font, color) {
  ctx.beginPath();
  ctx.fillStyle = color;
  ctx.font = font
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);
  ctx.closePath();
}

function animate(timeStamp) {
  if (isStoped) {
    return;
  }
  if (timeStamp - lastTimeStamp < constProps.framePeriodMs) {
    requestAnimationFrame(animate);
    return;
  }
  clear();
  let blockCount = 0;
  for (let i = 0; i < objects.length; i++) {
    const obj = objects[i];
    const t = obj.tick();
    obj.draw();
    if (t === false) {
      clear();
      writeCenter("Game over", constProps.text.font, constProps.text.loseColor);
      return;
    }
    if (obj.constructor.name === "Block")
      blockCount++;
  }
  if (blockCount === 0) {
    clear();
    writeCenter("Win", constProps.text.font, constProps.text.winColor);
    return;
  }
  lastTimeStamp = timeStamp;
  requestAnimationFrame(animate);
}

function setPlatformKeys(event) {
  const code = event.code;
  if (code === "ArrowRight" || code === "KeyD") {
    platformProps.right = true;
  }
  else if (code === "ArrowLeft" || code === "KeyA") {
    platformProps.left = true;
  }
}

function restart(event) {
  if (event.code === "KeyR") {
    isStoped = true;
    clear();
    setTimeout(() => {
      isStoped = false;
      init(objects);
    }, 100);
  }
}

function unsetPlatformKeys(event) {
  const code = event.code;
  if (code === "ArrowRight" || code === "KeyD") {
    platformProps.right = false;
  }
  else if (code === "ArrowLeft" || code === "KeyA") {
    platformProps.left = false;
  }
}

const sizeCoefficient = 1;
const color = {
  blue: "#0065d2",
  darkGrey: "#222",
  grey: "#888",
  yellow: "#ff0",
  orange: "#f55500",
  purple: "#af46bc",
  red: "#f44",
  green: "#00a92e",
}
const constProps = {
  canvas: {
    width: 640 * sizeCoefficient,
    height: 480 * sizeCoefficient,
    color: color.darkGrey,
  },
  text: {
    font: `${50 * sizeCoefficient}px Monospace`,
    loseColor: color.red,
    winColor: color.green,
  },
  ball: {
    radius: 10 * sizeCoefficient,
    speed: 7 * sizeCoefficient,
    color: color.orange,
  },
  block: {
    size: {
      x: 40 * sizeCoefficient,
      y: 20 * sizeCoefficient,
    },
    color: color.green,
  },
  platform: {
    size: {
      x: 100 * sizeCoefficient,
      y: 20 * sizeCoefficient,
    },
    speed: 9 * sizeCoefficient,
    color: color.blue,
  },
  framePeriodMs: 16,
};
const platformProps = {
  right: false,
  left: false,
};
const objects = [];
const canvas = document.querySelector("#screen");
const ctx = canvas.getContext("2d");
let isStoped = false;
let lastTimeStamp = 0;

setSize(canvas, constProps.canvas.width, constProps.canvas.height);
window.addEventListener("keydown", setPlatformKeys);
window.addEventListener("keydown", restart);
window.addEventListener("keyup", unsetPlatformKeys);
init(objects);
