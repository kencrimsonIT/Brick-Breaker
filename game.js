//Note:
// 'N' - normal bricks
// 'M' - metal bricks
// 'P' - power-up items
// '.' - empty bricks
// '2', '3', '4',... - bricks that need 2, 3, 4,... hits to break
const STAGES = [
    {
        ballSpeed: 5,
        layout: [
            'NNNNNNNNN',
            'NNNNNNNNN',
            'NNNNNNNNN',
            'NNNNNNNNN',
            'NNNNNNNNN'
        ]
    },

    {
        ballSpeed: 5,
        layout: [
            'NNNNNNNNN',
            'NNNNNNNNN',
            'NNMMMMMNN',
            'NNNNNNNNN',
            'NNNNNNNNN'
        ]
    },

    {
        ballSpeed: 5.5,
        itemPool: ['extraLife', 'widePaddle', 'shield'],
        layout: [
            'NNNNNNNNN',
            'MMM...MMM',
            'NPNNNPNNN',
            'PNNNNNNNP',
            'NNNNPNNNN',
        ]
    },

    {
        ballSpeed: 5,
        layout: [
            'NNNNNNNNN',
            'N2NN3NN3N',
            '4NNN3NNNN',
            'NNNNNNNNN',
            '223NNN4N4'
        ]
    }
]



//Get elements id from HTML
const score = document.getElementById('score');
const life = document.getElementById('life');
const frame = document.getElementById('frame');
const ballElement = document.getElementById('ball');
const paddle = document.getElementById('paddle');
const message = document.getElementById('message');
const hud = document.getElementById('hud');
const bricksGrid = document.getElementById('bricks');
const stage = document.getElementById('stage');
const stageOption = document.getElementById('stageOption');
const stageGrid = document.getElementById('stageGrid');
const gameScreen = document.getElementById('gameScreen');
const backButton = document.getElementById('backBtn');

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

//HP point for each brick
const BRICKS_HP = {
    N: 1,
    P: 1,
    '2': 2,
    '3': 3,
    '4': 4
};

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
const maxLife = 6; //maximum life value
const maxBalls = 10; //maximum balls number
const splitAngle = 20; //splitting angle between original & copy
let balls = [];

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
    },

    multiBall: {
        label: 'Multi Ball',
        color: '#bbff33',
        apply: () => { //splitting balls function
            if (!isLaunched) return;
            const source = balls.slice();
            for (const part of source) {
                if (balls.length >= maxBalls) break;
                const speed = Math.hypot(part.speedX, part.speedY) || ballSpeed;
                const directionY = part.speedY >= 0 ? 1 : -1;
                const currentAngle = Math.atan2(part.speedX, Math.abs(part.speedY)) * 180 / Math.PI;
                const deviationAngle = currentAngle >= 0 ? -splitAngle : splitAngle;
                const newAngle = Math.max(-maxBounceAngle, Math.min(maxBounceAngle, currentAngle + deviationAngle)) * Math.PI / 180;
                balls.push({
                    x: part.x,
                    y: part.y,
                    speedX: speed * Math.sin(newAngle),
                    speedY: directionY * speed * Math.cos(newAngle),
                    element: createBallPart()
                });
            }
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
let isLaunched = false;
let gameState = 'menu';
let keys = {};
let lastTime = 0;
let frameId = 0;
let currentStage = 0;


//Setup game UI
const setupFrame = () => {
    hud.style.width = frameWidth + 'px';
    frame.style.width = frameWidth + 'px';
    frame.style.height = frameHeight + 'px';
    bricksGrid.style.top = brickTop + 'px';
    bricksGrid.style.width = frameWidth + 'px';

    paddle.style.width = currentPaddleWidth + 'px';
    paddle.style.height = paddleHeight + 'px';
    paddle.style.background = paddleColor;

    ballElement.style.width = ballWidth + 'px';
    ballElement.style.height = ballHeight + 'px';
    ballElement.style.background = ballColor;

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

            const hpValue = BRICKS_HP[type] || 0; //0 for metal & empty bricks
            const brick = {
                cell,
                type,
                alive: hpValue > 0 || type === 'M',
                row: r,
                col: c,
                hpValue,
                maxHpValue: hpValue,
                hitFrame: -1
            };

            if (hpValue > 0) {
                cell.style.background = brickColors[r % brickColors.length];
                bricksLeft++;
                if (type === 'P') {
                    cell.classList.add('has-item');
                    cell.textContent = '?';
                }
                if (brick.maxHpValue > 1) updateBrickUI(brick);
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

const updateBrickUI = (brick) => {
    brick.cell.classList.remove('hp-1', 'hp-2', 'hp-3', 'hp-4');
    brick.cell.classList.add('multi', 'hp-' + brick.hpValue);
    brick.cell.textContent = brick.hpValue;
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
const startGame = (stageIndex = currentStage) => {
    scoreValue = 0;
    lifeValue = startLife;
    currentStage = stageIndex;
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
    removeAllBalls();
    isLaunched = false;
    paddleX = (frameWidth - currentPaddleWidth) / 2;
    ballElement.style.display = '';
    balls.push({
        x: paddleX + currentPaddleWidth / 2,
        y: paddleY - ballRadius,
        speedX: 0,
        speedY: 0,
        element: ballElement
    });
}

const removeAllBalls = () => {
    while (balls.length > 0) removeBall(balls.length - 1);
}

const removeBall = (index) => {
    const element = balls[index].element;
    if (element === ballElement) {
        element.style.display = 'none'; //hide the ball's copies
    } else {
        element.remove();
    }
    balls.splice(index, 1);
}

const createBallPart = () => {
    const ballPart = document.createElement('div');
    ballPart.style.position = 'absolute';
    ballPart.style.top = '0';
    ballPart.style.left = '0';
    ballPart.style.borderRadius = '50%';
    ballPart.style.width = ballWidth + 'px';
    ballPart.style.height = ballHeight + 'px';
    ballPart.style.background = ballColor;
    frame.insertBefore(ballPart, message);
    return ballPart;
}

const launchBall = () => {
    if (gameState !== 'playing' || isLaunched) return;
    isLaunched = true;
    const ballAngle = (Math.random() * 60 - 30) * Math.PI / 180;
    balls[0].speedX = ballSpeed * Math.sin(ballAngle);
    balls[0].speedY = -ballSpeed * Math.cos(ballAngle);
}

const endGame = (isClear) => {
    clearEffects();
    while (balls.length > 1) removeBall(balls.length - 1);
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

    gameState = isClear ? 'win' : 'over';
    showMessage(
        isClear ? 'You win!' : 'Game over',
        'Score: ' + scoreValue,
        isClear ? 'Click or press Space to go back to stage select' : 'Click or press Space to try again'
    );
}

const breakBrick = (brick) => {
    brick.alive = false;
    brick.cell.classList.add('broken');
    bricksLeft--;
    scoreValue += pointPerBrick * brick.maxHpValue;
    updateHud();
    if (brick.type === 'P') spawnItem(brick);
}

//Bounce when hit metal bricks, break when hit normal bricks
const hitBrick = (brick) => {
    if (brick.type === 'M') return;
    if (brick.hitFrame === frameId) return;
    brick.hitFrame = frameId;
    brick.hpValue--;
    if (brick.hpValue > 0) {
        updateBrickUI(brick);
        return;
    }
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
    for (const b of balls) {
        b.element.style.transform = `translate(${b.x - ballRadius}px, ${b.y - ballRadius}px)`;
    }
    shield.style.width = currentPaddleWidth + 'px';
    shield.style.transform = `translate(${paddleX}px, ${shieldY}px)`;
}

const gameLoop = (time) => {
    frameId++;
    const fps = Math.min((time - lastTime) / 16.67, 3) || 1;
    lastTime = time;
    if (gameState === 'playing') updateGameplay(fps);
    renderBricks();
    requestAnimationFrame(gameLoop);
}

const updateGameplay = (fps) => {
    updateItems(fps);
    updateEffects(fps);

    if (keys['ArrowLeft']) paddleX -= paddleSpeed * fps;
    if (keys['ArrowRight']) paddleX += paddleSpeed * fps;
    paddleX = Math.max(0, Math.min(frameWidth - currentPaddleWidth, paddleX));

    if (!isLaunched) {
        balls[0].x = paddleX + currentPaddleWidth / 2;
        balls[0].y = paddleY - ballRadius;
        return;
    }

    for (let i = balls.length - 1; i >= 0; i--) {
        if (updateBall(balls[i], fps)) removeBall(i);
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

const updateBall = (ball, fps) => {
    const directionX = Math.sign(ball.speedX);
    const directionY = Math.sign(ball.speedY);
    const nextX = ball.x + ball.speedX * fps;
    const nextY = ball.y + ball.speedY * fps;

    const brickX = brickPosition(nextX + directionX * ballRadius, ball.y);
    if (brickX) {
        hitBrick(brickX, ball);
        ball.speedX = -ball.speedX;
    } else {
        ball.x = nextX;
    }

    const brickY = brickPosition(ball.x, nextY + directionY * ballRadius);
    if (brickY) {
        hitBrick(brickY, ball);
        ball.speedY = -ball.speedY;
    } else {
        ball.y = nextY;
    }

    if (ball.x< ballRadius) {
        ball.x = ballRadius;
        ball.speedX = Math.abs(ball.speedX);
    }

    if (ball.x > frameWidth - ballRadius) {
        ball.x = frameWidth - ballRadius;
        ball.speedX = -Math.abs(ball.speedX);
    }

    if (ball.y < ballRadius) {
        ball.y = ballRadius;
        ball.speedY = Math.abs(ball.speedY);
    }

    if (
        ball.speedY > 0 &&
        ball.y + ballRadius >= paddleY &&
        ball.y + ballRadius <= paddleY + paddleHeight &&
        ball.x >= paddleX - ballRadius &&
        ball.x <= paddleX + currentPaddleWidth + ballRadius
    ) {
        const offset = (ball.x - (paddleX + currentPaddleWidth / 2)) / (currentPaddleWidth / 2);
        const angle = Math.max(-1, Math.min(1, offset)) * maxBounceAngle * Math.PI / 180;
        ball.speedX = ballSpeed * Math.sin(angle);
        ball.speedY = -ballSpeed * Math.cos(angle);
        ball.y = paddleY - ballRadius;
    }

    if (effects.shield && ball.speedY > 0 && ball.y + ballRadius > shieldY) {
        ball.y = shieldY - ballRadius;
        ball.speedY = -Math.abs(ball.speedY);
        effects.shield = false;
        shield.classList.add('hidden');
    }

    return ball.y - ballRadius > frameHeight;
}




//Stage option screen
const stageTiles = [];

const initStageOption = () => {
    stageGrid.innerHTML = '';
    stageTiles.length = 0;
    STAGES.forEach((data, index) => {
        const tile = document.createElement('buttom');
        tile.type = 'button';
        tile.className = 'stage-tile';
        tile.setAttribute('aria-label', 'Stage' + (index + 1));

        const number = document.createElement('span');
        number.className = 'stage-number';
        number.textContent = index + 1;

        const preview = document.createElement('div');
        preview.className = 'stage-preview';
        preview.style.gridTemplateColumns = `repeat(${brickCols}, 1fr)`;
        data.layout.forEach((rowTxt, r) => {
            for (let c = 0; c < brickCols; c++) {
                const type = rowTxt[c]; //brick type
                const cell = document.createElement('i');
                if (type === 'M') {
                    cell.style.background = '#737373'
                } else if (BRICKS_HP[type]) {
                    cell.style.background = brickColors[r % brickColors.length];
                    if (BRICKS_HP[type] > 1) cell.style.filter = `brightness(${1 - 0.2 * (BRICKS_HP[type] - 1)});`;
                }
                preview.appendChild(cell);
            }
        });

        tile.appendChild(number);
        tile.appendChild(preview);
        tile.addEventListener('click', () => selectStage(index));
        stageGrid.appendChild(tile);
        stageTiles.push(tile);
    })
}

const selectStage = (index) => {
    stageOption.classList.add('hidden');
    gameScreen.classList.remove('hidden');
    startGame(index);
}

const showStageOption = (focusTile = true) => {
    gameState = 'selected';
    clearEffects();
    removeAllBalls();
    gameScreen.classList.add('hidden');
    stageOption.classList.remove('hidden');
    if (focusTile && stageTiles[currentStage]) stageTiles[currentStage].focus();
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
        y: brickTop + brick.row * brickHeight + brickHeight,
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
            item.x - itemWidth / 2 <= paddleX + currentPaddleWidth;

        if (caught) {
            ITEMS_TYPE[item.type].apply();
            removeItem(i);
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
    paddleX = Math.max(0, Math.min(frameWidth - currentPaddleWidth, x - currentPaddleWidth / 2));
}

const handleAction = () => {
    if (gameState === 'selected') return;
    if (gameState === 'playing') launchBall();
    else if (gameState === 'clear') nextStage();
    else if (gameState === 'win') showStageOption();
    else startGame();
}

document.addEventListener('mousemove', e => { if (gameState === 'playing') paddleMovement(e.clientX); });
frame.addEventListener('click', handleAction);
backButton.addEventListener('click', () => showStageOption())
document.addEventListener('keydown', e => {
    keys[e.key] = true;

    //Key to return stage option
    if (e.key === 'Escape' && gameState !== 'selected') {
        showStageOption();
        return;
    }

    if (e.key === ' ' && !e.repeat && gameState !== 'selected') {
        e.preventDefault();
        handleAction();
    }
});
document.addEventListener('keyup', e => { keys[e.key] = false; });




setupFrame();
initStageOption()
showStageOption(false)
showMessage('Ping Pong', 'Click or press Space to start');
requestAnimationFrame(gameLoop);