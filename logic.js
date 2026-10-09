//Get elements id from HTML
const score = document.getElementById('score');
const life = document.getElementById('life');
const frame = document.getElementById('frame');
const ball = document.getElementById('ball');
const paddle = document.getElementById('paddle');
const message = document.getElementById('message');
const hud = document.getElementById('hud');
const bricksGrid = document.getElementById('bricks');
const stage = document.getElementById('stage');

//Initialize brick UI
const brickCols = 9;
let brickRows = 5;
const brickColors = [
    '#ff3333',
    '#5cd65c',
    '#4dd2ff',
    '#ffff4d',
    '#a64dff'
];
const brickWidth = 72;
const brickHeight = 20;
let bricks = []; //empty bricks array

//Initialize ball UI
const paddleWidth = 100;
const paddleHeight = 15;
const paddleColor = '#777';

//Initialize ball UI
const ballWidth = 15;
const ballHeight = 15;
const ballColor = '#ffffb3';

//Game settings
const frameWidth = brickWidth * brickCols;
const frameHeight = 600;
const brickTop = 60;
const paddleY = frameHeight - 45; //paddle position
const paddleSpeed = 10;
let ballSpeed = 5;
const startLife = 3;
const pointPerBrick = 15;
const maxBounceAngle = 65;
const firstStage = 0;
const maxLife = 6; //maximum life value

//Power-up item settings
const itemWidth = 30;
const itemHeight = 20;
const itemDropSpeed = 2.75;
const widePaddleScale = 1.7;
const widePaddleDuration = 600;
const shieldHeight = 8;
const shieldY = frameHeight - 15; //shield position (below the paddle)

//Item state
let items = [];
let effects = {
    widePaddleTimer: 0,
    shield: false
}
const shield = document.createElement('div');

//Item types
const ITEMS_TYPE = {
    extraLife: {
        label: '+1 life',
        color: '#ff3333',
        apply: () => {
            lifeValue = Math.min(lifeValue + 1, maxLife);
            updateHud();
        }
    },

    widePaddle: {
        label: 'Wide paddle',
        color: '#66b3ff',
        apply: () => {
            effects.widePaddleTimer = widePaddleDuration;
            setPaddleWidth(paddleWidth * widePaddleScale);
        }
    },

    shield: {
        label: 'Shield',
        color: '#ffff70',
        apply: () => {
            effects.shield = true;
            shield.classList.remove('hidden');
        }
    }
};

//Game state
const ballRadius = ballWidth / 2;
let scoreValue = 0;
let lifeValue = startLife;
let bricksLeft = 0;
let currentPaddleWidth = paddleWidth;
let paddleX = 0;
let ballX = 0, ballY = 0, ballSpeedX = 0, ballSpeedY = 0;
let isLaunched = false;
let gameState = 'menu';
let keys = {};
let lastTime = 0;
let currentStage = firstStage;


//Setup game UI
const setupFrame = () => {
    hud.style.width = frameWidth + 'px';
    frame.style.width = frameWidth + 'px';
    frame.style.height = frameHeight + 'px';
    bricksGrid.style.top = brickTop + 'px';
    bricksGrid.style.width = frameWidth + 'px';

    paddle.style.width = paddleWidth + 'px';
    paddle.style.height = paddleHeight + 'px';
    paddle.style.background = paddleColor;

    ball.style.width = ballWidth + 'px';
    ball.style.height = ballHeight + 'px';
    ball.style.background = ballColor;

    shield.id = 'shield';
    shield.classList.add('hidden');
    shield.style.top = shieldY + 'px';
    shield.style.height = shieldHeight + 'px';
    frame.insertBefore(shield, message);
}

const createBricks = () => {
    const layout = STAGES[currentStage].layout;
    brickRows = layout.length;
    bricksGrid.innerHTML = '';
    bricks = [];
    bricksLeft = 0;
    for (let r = 0; r < brickRows; r++) {
        const gridRow = bricksGrid.insertRow();
        const row = [];
        for (let c = 0; c < brickCols; c++) {
            const type = layout[r][c];
            const cell = gridRow.insertCell();
            cell.style.width = brickWidth + 'px';
            cell.style.height = brickHeight + 'px';

            const brick = {
                cell,
                type,
                alive: type === 'N' || type === 'M' || type === 'P', row: r, col: c
            };

            if (type === 'N' || type === 'P') {
                cell.style.background = brickColors[r % brickColors.length];
                bricksLeft++;
                if (type === 'P') {
                    cell.classList.add('has-item');
                    cell.textContent = '?';
                }
            } else if (type === 'M') {
                cell.classList.add('metal');
                cell.style.background = '#737373';
            } else {
                cell.classList.add('broken');
            }
            row.push(brick);
        }
        bricks.push(row);
    }
}

const showMessage = (title, line1, line2) => {
    message.innerHTML = `<h2>${title}</h2>` +
        (line1 ? `<p>${line1}</p>` : ``) +
        (line2 ? `<p>${line2}</p>` : ``);
    message.classList.remove('hidden');
}

const updateHud = () => {
    score.textContent = scoreValue;
    life.textContent = lifeValue;
    stage.textContent = `${currentStage + 1}`;
}




//Gameplay flow
const startGame = () => {
    scoreValue = 0;
    lifeValue = startLife;
    currentStage = firstStage;
    loadStages();
    gameState = 'playing';
    message.classList.add('hidden');
}

const loadStages = () => {
    ballSpeed = STAGES[currentStage].ballSpeed;
    createBricks();
    resetBall();
    updateHud();
}

const nextStage = () => {
    currentStage++;
    loadStages();
    gameState = 'playing';
    message.classList.add('hidden');
}

const resetBall = () => {
    clearEffects();
    isLaunched = false;
    paddleX = (frameWidth - paddleWidth) / 2;
    ballSpeedX = 0;
    ballSpeedY = 0;
    ballX = paddleX + paddleWidth / 2;
    ballY = paddleY - ballRadius;
}

const launchBall = () => {
    if (gameState !== 'playing' || isLaunched) return;
    isLaunched = true;
    const ballAngle = (Math.random() * 60 - 30) * Math.PI / 180;
    ballSpeedX = ballSpeed * Math.sin(ballAngle);
    ballSpeedY = -ballSpeed * Math.cos(ballAngle);
}

const endGame = (isClear) => {
    clearEffects();
    const isLastStage = currentStage === STAGES.length - 1;
    if (isClear && !isLastStage) {
        gameState = 'clear';
        showMessage(
            'Stage clear!',
            'Score: ' + scoreValue,
            'Click or press Space for the next stage'
        );
        return;
    }

    gameState = 'over';
    showMessage(
        isClear ? 'You win!' : 'Game over',
        'Score: ' + scoreValue,
        'Click or press Space to play again'
    );
}

const breakBrick = (brick) => {
    brick.alive = false;
    brick.cell.classList.add('broken');
    bricksLeft--;
    scoreValue += pointPerBrick;
    updateHud();
    if (brick.type === 'P') spawnItem(brick);
}

//Bounce when hit metal bricks, break when hit normal bricks
const hitBrick = (brick) => {
    if (brick.type === 'M') return;
    breakBrick(brick);
}

const brickPosition = (x, y) => {
    const col = Math.floor(x / brickWidth);
    const row = Math.floor((y - brickTop) / brickHeight);
    if (row < 0 || row >= brickRows || col < 0 || col >= brickCols) return null;
    return bricks[row][col].alive ? bricks[row][col] : null;
}

const renderBricks = () => {
    paddle.style.transform = `translate(${paddleX}px, ${paddleY}px)`;
    ball.style.transform = `translate(${ballX - ballRadius}px, ${ballY - ballRadius}px)`;
}

const gameLoop = (time) => {
    const fps = Math.min((time - lastTime) / 16.67, 3) || 1;
    lastTime = time;
    if (gameState === 'playing') updateGameplay(fps);
    renderBricks();
    requestAnimationFrame(gameLoop);
}

const updateGameplay = (fps) => {
    if (keys['ArrowLeft']) paddleX -= paddleSpeed * fps;
    if (keys['ArrowRight']) paddleX += paddleSpeed * fps;
    paddleX = Math.max(0, Math.min(frameWidth - paddleWidth, paddleX));

    if (!isLaunched) {
        ballX = paddleX + paddleWidth / 2;
        ballY = paddleY - ballRadius;
        return;
    }

    const directionX = Math.sign(ballSpeedX);
    const directionY = Math.sign(ballSpeedY);
    const nextX = ballX + ballSpeedX * fps;
    const nextY = ballY + ballSpeedY * fps;

    const brickX = brickPosition(nextX + directionX * ballRadius, ballY);
    if (brickX) {
        hitBrick(brickX);
        ballSpeedX = -ballSpeedX;
    } else {
        ballX = nextX;
    }

    const brickY = brickPosition(ballX, nextY + directionY * ballRadius);
    if (brickY) {
        hitBrick(brickY);
        ballSpeedY = -ballSpeedY;
    } else {
        ballY = nextY;
    }

    if (ballX < ballRadius) {
        ballX = ballRadius;
        ballSpeedX = Math.abs(ballSpeedX);
    }

    if (ballX > frameWidth - ballRadius) {
        ballX = frameWidth - ballRadius;
        ballSpeedX = -Math.abs(ballSpeedX);
    }

    if (ballY < ballRadius) {
        ballY = ballRadius;
        ballSpeedY = Math.abs(ballSpeedY);
    }

    if (
        ballSpeedY > 0 &&
        ballY + ballRadius >= paddleY &&
        ballY + ballRadius <= paddleY + paddleHeight &&
        ballX >= paddleX - ballRadius &&
        ballX <= paddleX + paddleWidth + ballRadius
    ) {
        const offset = (ballX - (paddleX + paddleWidth / 2)) / (paddleWidth / 2);
        const angle = Math.max(-1, Math.min(1, offset)) * maxBounceAngle * Math.PI / 180;
        ballSpeedX = ballSpeed * Math.sin(angle);
        ballSpeedY = -ballSpeed * Math.cos(angle);
        ballY = paddleY - ballRadius;
    }

    if (effects.shield && ballSpeedY > 0 && ballY + ballRadius > shieldY) {
        ballY = shieldY - ballRadius;
        ballSpeedY = -Math.abs(ballSpeedY);
        effects.shield = false;
        shield.classList.add('hidden');
    }

    if (ballY - ballRadius > frameHeight) {
        lifeValue--;
        updateHud();
        if (lifeValue <= 0) {
            endGame(false);
            return;
        }
        resetBall();
        return;
    }

    if (bricksLeft === 0) endGame(true);
}




//Item logic
const setPaddleWidth = (width) => {
    const center = paddleX + currentPaddleWidth / 2;
    currentPaddleWidth = width;
    paddleX = Math.max(0, Math.min(frameWidth - currentPaddleWidth, center - currentPaddleWidth / 2));
    paddle.style.width = currentPaddleWidth + 'px';
}

const spawnItem = (brick) => {
    const pool = STAGES[currentStage].itemPool || Object.keys(ITEMS_TYPE);
    const type = pool[Math.floor(Math.random() * pool.length)];
    const data = ITEMS_TYPE[type];

    const element = document.createElement('div');
    element.className = 'powerup-item';
    element.textContent = data.label;
    element.style.width = itemWidth + 'px';
    element.style.height = itemHeight + 'px';
    element.style.background = data.color;
    frame.insertBefore(element, message);

    const item = {
        type,
        x: brick.col * brickWidth + brickWidth / 2,
        y: brick.row * brickHeight + brickHeight,
        element,
    };

    items.push(item);
    renderItem(item);
}

const renderItem = (item) => {
    item.element.style.transform = `translate(${item.x - itemWidth / 2}px, ${item.y}px)`;
}

const removeItem = (index) => {
    items[index].element.remove();
    items.splice(index, 1);
}

const updateItems = (fps) => {
    for (let i = items.length - 1; i >= 0; i--) {
        const item = items[i];
        item.y += itemDropSpeed * fps;

        const caught =
            item.y + itemHeight >= paddleY &&
            item.y <= paddleY + paddleHeight &&
            item.x + itemWidth / 2 >= paddleX &&
            item.y + itemWidth / 2 <= paddleX + currentPaddleWidth;

        if (caught) {
            ITEMS_TYPE[item.type].apply();
            renderItem(i);
        } else if (item.y > frameHeight) {
            removeItem(i); //didn't catch the item (missed)
        } else {
            renderItem(item);
        }
    }
}

const updateEffects = (fps) => {
    if (effects.widePaddleTimer > 0) {
        effects.widePaddleTimer -= fps;
        if (effects.widePaddleTimer <= 0) {
            effects.widePaddleTimer = 0;
            setPaddleWidth(paddleWidth);
        }
    }
}

const clearEffects = () => {
    while (items.length > 0) removeItem(items.length - 1);
    effects.widePaddleTimer = 0;
    effects.shield = false;
    shield.classList.add('hidden');
    currentPaddleWidth = paddleWidth;
    paddle.style.width = currentPaddleWidth + 'px';
}



//Game controller
const paddleMovement = (clientX) => {
    const rect = frame.getBoundingClientRect();
    const x = (clientX - rect.left) * (frameWidth / rect.width);
    paddleX = Math.max(0, Math.min(frameWidth - paddleWidth, x - paddleWidth / 2));
}

const handleAction = () => {
    if (gameState === 'playing') launchBall();
    else if (gameState === 'clear') nextStage();
    else startGame();
}

document.addEventListener('mousemove', e => { if (gameState === 'playing') paddleMovement(e.clientX); });
frame.addEventListener('click', handleAction);
document.addEventListener('keydown', e => {
    keys[e.key] = true;
    if (e.key === ' ' && !e.repeat) {
        e.preventDefault();
        handleAction();
    }
});
document.addEventListener('keyup', e => { keys[e.key] = false; });




setupFrame();
loadStages()
showMessage('Brick Breaker', 'Click or press Space to start');
requestAnimationFrame(gameLoop);