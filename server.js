const express  = require('express');
const http     = require('http');
const socketio = require('socket.io');
const helmet   = require('helmet');
const path     = require('path');

const app    = express();
const server = http.createServer(app);
const io     = socketio(server);

// Seguridad tests 16‑19
app.use(helmet.hidePoweredBy({ setTo: 'PHP 7.4.3' }));
app.use(helmet.noSniff());
app.use((req, res, next) => {
  res.setHeader('X-XSS-Protection', '0');
  next();
});
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  next();
});

app.use(express.static(path.join(__dirname, 'public')));

const players = {};
let collectibles = {};
let collectibleIdCounter = 0;
const PLAYER_RADIUS = 10;
const COLLECTIBLE_RADIUS = 5;

function createCollectible() {
  const id = collectibleIdCounter++;
  collectibles[id] = { id, x: Math.random()*780+10, y: Math.random()*580+10, value:1 };
  io.emit('newCollectible', collectibles[id]);
}
createCollectible();

io.on('connection', socket => {
  players[socket.id] = {
    id: socket.id,
    x: Math.random()*780+10,
    y: Math.random()*580+10,
    score: 0,
    color: `hsl(${Math.random()*360},100%,70%)`
  };
  socket.emit('init', { players, collectibles, id: socket.id });
  socket.broadcast.emit('newPlayer', players[socket.id]);

  socket.on('disconnect', () => {
    delete players[socket.id];
    io.emit('playerDisconnected', socket.id);
  });

  socket.on('playerMovement', movementData => {
    const p = players[socket.id];
    if (!p) return;
    p.x = movementData.x;
    p.y = movementData.y;
    for (const id in collectibles) {
      const c = collectibles[id];
      if (Math.hypot(p.x - c.x, p.y - c.y) < PLAYER_RADIUS + COLLECTIBLE_RADIUS) {
        p.score += c.value;
        delete collectibles[id];
        io.emit('updateScore', p);
        io.emit('collectibleRemoved', id);
        createCollectible();
      }
    }
    socket.broadcast.emit('playerMoved', p);
  });
});

// Aquí se arranca el servidor y se imprime en consola:
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`✅ Secure Multiplayer Game listening on port ${PORT}`);
});
