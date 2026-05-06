const canvas = document.getElementById("canvas");
const ctx    = canvas.getContext("2d");
const scoreEl  = document.getElementById("score");
const livesEl  = document.getElementById("lives");
const messageEl= document.getElementById("message");
const startBtn = document.getElementById("startBtn");

const DIRECTION_RIGHT  = 4;
const DIRECTION_UP     = 3;
const DIRECTION_LEFT   = 2;
const DIRECTION_BOTTOM = 1;

const FPS          = 30;
const ONE_BLOCK    = 20;
const COLS         = 21;
const ROWS         = 23;
const WALL_COLOR   = "#2421c1";
const WALL_INNER   = "#000000";
const WALL_SPACE   = ONE_BLOCK / 1.1;
const WALL_OFFSET  = (ONE_BLOCK - WALL_SPACE) / 2;

canvas.width  = COLS * ONE_BLOCK;
canvas.height = ROWS * ONE_BLOCK;

const BASE_MAP = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,2,2,2,2,2,2,2,2,2,1,2,2,2,2,2,2,2,2,2,1],
    [1,3,1,1,1,2,1,1,1,2,1,2,1,1,1,2,1,1,1,3,1],
    [1,2,1,1,1,2,1,1,1,2,1,2,1,1,1,2,1,1,1,2,1],
    [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
    [1,2,1,1,1,2,1,2,1,1,1,1,1,2,1,2,1,1,1,2,1],
    [1,2,2,2,2,2,1,2,2,2,1,2,2,2,1,2,2,2,2,2,1],
    [1,1,1,1,1,2,1,1,1,2,1,2,1,1,1,2,1,1,1,1,1],
    [0,0,0,0,1,2,1,2,2,2,2,2,2,2,1,2,1,0,0,0,0],
    [1,1,1,1,1,2,1,2,1,1,4,1,1,2,1,2,1,1,1,1,1],
    [2,2,2,2,2,2,2,2,1,4,4,4,1,2,2,2,2,2,2,2,2],
    [1,1,1,1,1,2,1,2,1,4,4,4,1,2,1,2,1,1,1,1,1],
    [0,0,0,0,1,2,1,2,1,1,1,1,1,2,1,2,1,0,0,0,0],
    [0,0,0,0,1,2,1,2,2,2,2,2,2,2,1,2,1,0,0,0,0],
    [1,1,1,1,1,2,1,2,1,1,1,1,1,2,1,2,1,1,1,1,1],
    [1,2,2,2,2,2,2,2,2,2,1,2,2,2,2,2,2,2,2,2,1],
    [1,2,1,1,1,2,1,1,1,2,1,2,1,1,1,2,1,1,1,2,1],
    [1,3,2,2,1,2,2,2,2,2,2,2,2,2,2,2,1,2,2,3,1],
    [1,1,2,2,1,2,1,2,1,1,1,1,1,2,1,2,1,2,2,1,1],
    [1,2,2,2,2,2,1,2,2,2,1,2,2,2,1,2,2,2,2,2,1],
    [1,2,1,1,1,1,1,1,1,2,1,2,1,1,1,1,1,1,1,2,1],
    [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
];

let map, score, lives, pacman, ghosts;
let gameInterval = null;
let running      = false;
let powerActive  = false;
let powerTimer   = 0;
let ghostEatScore = 0; 

function cloneMap() {
    return BASE_MAP.map(row => row.map(cell => (cell === 4 ? 0 : cell)));
}

function countDots(m) {
    let n = 0;
    for (let r = 0; r < ROWS; r++)
        for (let c = 0; c < COLS; c++)
            if (m[r][c] === 2 || m[r][c] === 3) n++;
    return n;
}

function createRect(x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
}
function initGame() {
    clearInterval(gameInterval);
    map          = cloneMap();
    score        = 0;
    lives        = 3;
    running      = true;
    powerActive  = false;
    powerTimer   = 0;
    ghostEatScore = 200;
    scoreEl.textContent = "0";
    livesEl.textContent = "3";
    messageEl.textContent = "";

    pacman = new Pacman(
        10 * ONE_BLOCK,
        17 * ONE_BLOCK,
        ONE_BLOCK, ONE_BLOCK,
        2             
    );

    ghosts = [
        new Ghost(9  * ONE_BLOCK, 10 * ONE_BLOCK, ONE_BLOCK, ONE_BLOCK, 1.5, "#FF0000"),
        new Ghost(10 * ONE_BLOCK, 10 * ONE_BLOCK, ONE_BLOCK, ONE_BLOCK, 1.5, "#FFB8FF"),
        new Ghost(11 * ONE_BLOCK, 10 * ONE_BLOCK, ONE_BLOCK, ONE_BLOCK, 1.5, "#00FFFF"),
        new Ghost(10 * ONE_BLOCK, 11 * ONE_BLOCK, ONE_BLOCK, ONE_BLOCK, 1.5, "#FFB852"),
    ];

    gameInterval = setInterval(gameLoop, 1000 / FPS);
}
function gameLoop() {
    if (!running) return;
    update();
    draw();
}

function update() {
    if (powerActive) {
        powerTimer--;
        if (powerTimer <= 0) {
            powerActive = false;
            ghostEatScore = 200;
            ghosts.forEach(g => { g.scared = false; });
        }
    }

    pacman.moveProcess();
    eatDot();

    ghosts.forEach(g => g.moveProcess());
    checkGhostCollision();

    if (countDots(map) === 0) endGame(true);
}

function eatDot() {
    const gc = Math.round(pacman.x / ONE_BLOCK);
    const gr = Math.round(pacman.y / ONE_BLOCK);
    if (gr < 0 || gr >= ROWS || gc < 0 || gc >= COLS) return;

    if (map[gr][gc] === 2) {
        map[gr][gc] = 0;
        score += 10;
        scoreEl.textContent = score;
    } else if (map[gr][gc] === 3) {
        map[gr][gc] = 0;
        score += 50;
        scoreEl.textContent = score;
        powerActive  = true;
        powerTimer   = 300;  
        ghostEatScore = 200;
        ghosts.forEach(g => { g.scared = true; });
    }
}

function checkGhostCollision() {
    ghosts.forEach(g => {
        const dx = Math.abs(g.x - pacman.x);
        const dy = Math.abs(g.y - pacman.y);
        if (dx < ONE_BLOCK - 4 && dy < ONE_BLOCK - 4) {
            if (g.scared) {
                g.scared = false;
                g.x = 10 * ONE_BLOCK;
                g.y = 10 * ONE_BLOCK;
                g.direction = DIRECTION_LEFT;
                score += ghostEatScore;
                ghostEatScore = Math.min(ghostEatScore * 2, 1600);
                scoreEl.textContent = score;
            } else {
                lives--;
                livesEl.textContent = lives;
                if (lives <= 0) { endGame(false); return; }
                resetPositions();
            }
        }
    });
}

function resetPositions() {
    pacman.x = 10 * ONE_BLOCK;
    pacman.y = 17 * ONE_BLOCK;
    pacman.direction     = DIRECTION_RIGHT;
    pacman.nextDirection = DIRECTION_RIGHT;
    ghosts[0].x = 9  * ONE_BLOCK; ghosts[0].y = 10 * ONE_BLOCK;
    ghosts[1].x = 10 * ONE_BLOCK; ghosts[1].y = 10 * ONE_BLOCK;
    ghosts[2].x = 11 * ONE_BLOCK; ghosts[2].y = 10 * ONE_BLOCK;
    ghosts[3].x = 10 * ONE_BLOCK; ghosts[3].y = 11 * ONE_BLOCK;
    ghosts.forEach(g => { g.scared = false; });
}

function endGame(win) {
    clearInterval(gameInterval);
    running = false;
    messageEl.textContent = win
        ? "🎉 Você venceu! Parabéns!"
        : "💀 Game Over! Tente novamente.";
}
function draw() {
    createRect(0, 0, canvas.width, canvas.height, "#000");
    drawMap();
    drawPacman();
    ghosts.forEach(g => g.draw(ctx, ONE_BLOCK, powerTimer));
}

function drawMap() {
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const v = map[r][c];
            if (v === 1) {
                createRect(c * ONE_BLOCK, r * ONE_BLOCK, ONE_BLOCK, ONE_BLOCK, WALL_COLOR);
                if (c < COLS - 1 && map[r][c + 1] === 1)
                    createRect(c*ONE_BLOCK+WALL_OFFSET, r*ONE_BLOCK+WALL_OFFSET, WALL_SPACE+WALL_OFFSET, WALL_SPACE, WALL_INNER);
                if (r > 0 && map[r-1][c] === 1)
                    createRect(c*ONE_BLOCK+WALL_OFFSET, r*ONE_BLOCK, WALL_SPACE, WALL_SPACE+WALL_OFFSET, WALL_INNER);
                if (r < ROWS - 1 && map[r+1][c] === 1)
                    createRect(c*ONE_BLOCK+WALL_OFFSET, r*ONE_BLOCK+WALL_OFFSET, WALL_SPACE, WALL_SPACE+WALL_OFFSET, WALL_INNER);
                if (c > 0 && map[r][c-1] === 1)
                    createRect(c*ONE_BLOCK, r*ONE_BLOCK+WALL_OFFSET, WALL_SPACE+WALL_OFFSET, WALL_SPACE, WALL_INNER);
            } else if (v === 2) {
                ctx.fillStyle = "#FFFF99";
                ctx.beginPath();
                ctx.arc(c*ONE_BLOCK + ONE_BLOCK/2, r*ONE_BLOCK + ONE_BLOCK/2, 2, 0, Math.PI*2);
                ctx.fill();
            } else if (v === 3) {
                ctx.fillStyle = "#FFFFFF";
                ctx.beginPath();
                ctx.arc(c*ONE_BLOCK + ONE_BLOCK/2, r*ONE_BLOCK + ONE_BLOCK/2, 5, 0, Math.PI*2);
                ctx.fill();
            }
        }
    }
}

function drawPacman() {
    const cx = pacman.x + ONE_BLOCK / 2;
    const cy = pacman.y + ONE_BLOCK / 2;
    const r  = ONE_BLOCK / 2 - 1;
    const mouth = (Math.sin(pacman.frame * Math.PI / 10) + 1) * 0.15 + 0.05;

    let startAngle = mouth;
    let endAngle   = Math.PI * 2 - mouth;

    if (pacman.direction === DIRECTION_LEFT) {
        startAngle = Math.PI + mouth; endAngle = Math.PI - mouth;
    } else if (pacman.direction === DIRECTION_UP) {
        startAngle = Math.PI * 1.5 + mouth; endAngle = Math.PI * 1.5 - mouth;
    } else if (pacman.direction === DIRECTION_BOTTOM) {
        startAngle = Math.PI * 0.5 + mouth; endAngle = Math.PI * 0.5 - mouth;
    }

    ctx.fillStyle = "#FFD700";
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, startAngle, endAngle);
    ctx.closePath();
    ctx.fill();

    pacman.frame = (pacman.frame + 1) % 20;
}
window.addEventListener("keydown", e => {
    if (!pacman) return;
    if ([37,38,39,40].includes(e.keyCode)) e.preventDefault();
    if      (e.keyCode === 37) pacman.nextDirection = DIRECTION_LEFT;
    else if (e.keyCode === 38) pacman.nextDirection = DIRECTION_UP;
    else if (e.keyCode === 39) pacman.nextDirection = DIRECTION_RIGHT;
    else if (e.keyCode === 40) pacman.nextDirection = DIRECTION_BOTTOM;
});

startBtn.addEventListener("click", initGame);

// Tela inicial
createRect(0, 0, canvas.width, canvas.height, "#000");
ctx.fillStyle = "#FFD700";
ctx.font = "16px Arial";
ctx.textAlign = "center";
ctx.fillText('Clique em "Iniciar / Reiniciar" para começar', canvas.width / 2, canvas.height / 2);