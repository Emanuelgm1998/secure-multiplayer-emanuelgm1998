import Player from './Player.mjs';
import Collectible from './Collectible.mjs';

const socket = io();
const canvas = document.getElementById('game-canvas');
const context = canvas.getContext('2d');
const scoreBoard = document.getElementById('score-board');
let players = {};
let collectibles = {};
let myId = '';

socket.on('init', ({ players: p, collectibles: c, id }) => {
  myId = id;
  for (const k in p) players[k] = new Player(p[k]);
  for (const k in c) collectibles[k] = new Collectible(c[k]);
  gameLoop();
});
socket.on('newPlayer', (p) => { players[p.id] = new Player(p); });
socket.on('playerDisconnected', (id) => { delete players[id]; });
socket.on('playerMoved', (p) => {
  if (players[p.id]) {
    players[p.id].x = p.x;
    players[p.id].y = p.y;
  }
});
socket.on('newCollectible', (c) => { collectibles[c.id] = new Collectible(c); });
socket.on('collectibleRemoved', (id) => { delete collectibles[id]; });
socket.on('updateScore', (p) => {
  if (players[p.id]) {
    players[p.id].score = p.score;
    if (p.id === myId) players[myId].pop = 10;
  }
});

const keys = { w: false, a: false, s: false, d: false };
document.addEventListener('keydown', (e) => handleKeyEvent(e.key.toLowerCase(), true));
document.addEventListener('keyup', (e) => handleKeyEvent(e.key.toLowerCase(), false));

function handleKeyEvent(key, isPressed) {
  const k = {
    'w': 'w', 'arrowup': 'w',
    'a': 'a', 'arrowleft': 'a',
    's': 's', 'arrowdown': 's',
    'd': 'd', 'arrowright': 'd'
  }[key];
  if (k) keys[k] = isPressed;
}

function gameLoop() {
  const player = players[myId];
  if (player) {
    const speed = 4;
    let moved = false;
    if (keys.w) { player.movePlayer('up', speed); moved = true; }
    if (keys.s) { player.movePlayer('down', speed); moved = true; }
    if (keys.a) { player.movePlayer('left', speed); moved = true; }
    if (keys.d) { player.movePlayer('right', speed); moved = true; }
    if (moved) socket.emit('playerMovement', { x: player.x, y: player.y });
    if (player.pop > 0) player.pop -= 0.5;
  }
  context.clearRect(0, 0, canvas.width, canvas.height);
  for (const id in collectibles) {
    const c = collectibles[id];
    context.save();
    context.fillStyle = '#ffd700';
    context.shadowColor = '#ffd700';
    context.shadowBlur = 15;
    context.beginPath();
    context.arc(c.x, c.y, c.radius, 0, 2 * Math.PI);
    context.fill();
    context.restore();
  }
  for (const id in players) {
    const p = players[id];
    const currentRadius = p.radius + p.pop;
    context.strokeStyle = p.color;
    context.fillStyle = '#20232a';
    context.lineWidth = 3;
    context.beginPath();
    context.arc(p.x, p.y, currentRadius, 0, 2 * Math.PI);
    context.fill();
    context.stroke();
    if (p.id === myId) {
      context.fillStyle = '#ffffff';
      context.font = '12px Roboto';
      context.textAlign = 'center';
      context.fillText(p.id.substring(0, 5), p.x, p.y - currentRadius - 5);
    }
  }
  updateScoreboard();
  requestAnimationFrame(gameLoop);
}

function updateScoreboard() {
  const playersArr = Object.values(players);
  let html = '';
  if (players[myId]) html += `<p class="my-score"><b>${players[myId].calculateRank(playersArr)}</b></p>`;
  playersArr.sort((a, b) => b.score - a.score).forEach(p => {
    const you = p.id === myId ? " (You)" : "";
    html += `<p ${p.id === myId ? 'class="my-score"' : ''}>${p.id.substring(0, 5)}...: ${p.score}${you}</p>`;
  });
  scoreBoard.innerHTML = html;
}
