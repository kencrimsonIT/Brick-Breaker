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
const paddleY = frameHeight - 45;
const paddleSpeed = 10;
let ballSpeed = 5;
const startLife = 3;
const pointPerBrick = 15;
const maxBounceAngle = 65;
const firstStage = 0;

//Game state
const ballRadius = ballWidth / 2;
let scoreValue = 0;
let lifeValue = startLife;
let bricksLeft = 0;
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
                alive: type === 'N' || type === 'M'
            };

            if (type === 'N') {
                cell.style.background = brickColors[r % brickColors.length];
                bricksLeft++;
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
}

const hitMetalBrick = (brick) => {
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
        breakBrick(brickX);
        ballSpeedX = -ballSpeedX;
    } else {
        ballX = nextX;
    }

    const brickY = brickPosition(ballX, nextY + directionY * ballRadius);
    if (brickY) {
        breakBrick(brickY);
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
createBricks();
resetBall();
updateHud();
showMessage('Brick Breaker', 'Click or press Space to start');
requestAnimationFrame(gameLoop);