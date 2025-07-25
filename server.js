const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const helmet = require('helmet');
const nocache = require('nocache');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

// Seguridad tests 16‑19
app.use(helmet.hidePoweredBy({ setTo: 'PHP 7.4.3' })); // 19
app.use(helmet.noSniff());                             // 16
app.use(helmet.xssFilter());                           // 17
app.use(nocache());                                    // 18

// Middleware personalizado para headers de cache
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

app.use(express.static(path.join(__dirname, 'public')));

// ... resto del código igual ...