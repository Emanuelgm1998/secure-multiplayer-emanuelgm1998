const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const helmet = require('helmet');
const cors = require('cors');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

// Seguridad: Headers requeridos por los tests 16–19 de freeCodeCamp
app.use(helmet.hidePoweredBy({ setTo: 'PHP 7.4.3' })); // Test 19
app.use(helmet.noSniff());                             // Test 16
app.use(helmet.xssFilter());                           // Test 17
app.use(helmet.noCache());                             // Test 18

// Habilitar CORS para evitar errores en el evaluador
app.use(cors());

// Middleware extra para controlar caché en archivos estáticos
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

// Servir archivos estáticos desde /public
app.use(express.static(path.join(__dirname, 'public')));

// Lógica del juego
const players = {};
let collectibles = {};
let collectibleIdCounter = 0;
const PLAYER_RADIUS = 10;
const COLLECTIBLE_RADIUS = 5;

function createCollectible() {
  const id = collectibleIdCounter++;
  collectibles[id] = {
    id,
    x: Math.floor(Math.random() * 780) + 10,
    y: Math.floor(Math.random() * 580) + 10,
    value: 1
  };
  io.emit('newCollectible', collectibles[id]);
}
createCollectible();

io.on('connection', (socket) => {
  players[socket.id] = {
    id: socket.id,
    x: Math.floor(Math.random() * 780) + 10,
    y: Math.floor(Math.random() * 580) + 10,
    score: 0,
    color: `hsl(${Math.random() * 360}, 100%, 70%)`
  };
  socket.emit('init', { players, collectibles, id: socket.id });
  socket.broadcast.emit('newPlayer', players[socket.id]);

  socket.on('disconnect', () => {
    delete players[socket.id];
    io.emit('playerDisconnected', socket.id);
  });

  socket.on('playerMovement', (movementData) => {
    const player = players[socket.id];
    if (!player) return;
    player.x = movementData.x;
    player.y = movementData.y;

    for (const id in collectibles) {
      const collectible = collectibles[id];
      const dx = player.x - collectible.x;
      const dy = player.y - collectible.y;
      if (Math.sqrt(dx * dx + dy * dy) < PLAYER_RADIUS + COLLECTIBLE_RADIUS) {
        player.score += collectible.value;
        delete collectibles[id];
        io.emit('updateScore', player);
        io.emit('collectibleRemoved', id);
        createCollectible();
      }
    }
    socket.broadcast.emit('playerMoved', player);
  });
});

// Iniciar servidor
const listener = server.listen(process.env.PORT || 3000, () => {
  console.log('✅ Secure Multiplayer Game listening on port ' + listener.address().port);
});
