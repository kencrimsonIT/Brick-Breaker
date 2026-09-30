//Get elements id from HTML
const score = document.getElementById('score');
const life = document.getElementById('life');
const frame = document.getElementById('frame');
const ball = document.getElementById('ball');
const paddle = document.getElementById('paddle');
const message = document.getElementById('message');

//Initialize brick UI
const brickCols = 9;
const brickRows = 5;
const brickColors = [
    '#ff3333',
    '#5cd65c',
    '#4dd2ff',
    '#ffff4d',
    '#a64dff'
];
const brickWidth = 63;
const brickHeight = 20;
let bricks = []; //empty bricks array

//Initialize ball UI
const paddleWidth = 70;
const paddleHeight = 20;
const paddleColor = '#777';

//Initialize ball UI
const ballWidth = 15;
const ballHeight = 15;
const ballColor = '#ffffb3';