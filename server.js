import express from "express";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import helmet from "helmet";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
  serveClient: true // servirá /socket.io/socket.io.js desde el propio server
});

const PORT = process.env.PORT || 3000;

/* 🔒 Desactivar ETag globalmente (evita validación de caché) */
app.set("etag", false);
app.disable("etag");

/* 1) CORS primero */
app.use(cors({ origin: "*" }));

/* 2) Helmet v3 + noSniff + X-Powered-By simulado */
app.use(helmet());
app.use(helmet.noSniff());
app.use(helmet.hidePoweredBy({ setTo: "PHP 7.4.3" }));

/* 3) XSS Protection explícito (lo espera el test) */
app.use((req, res, next) => {
  res.setHeader("X-XSS-Protection", "1; mode=block");
  next();
});

/* 4) No-cache AGRESIVO (global) — añade también Surrogate-Control */
app.use(helmet.noCache()); // añade: Cache-Control: no-store, no-cache, must-revalidate, proxy-revalidate; Pragma; Expires; Surrogate-Control
app.use((req, res, next) => {
  // Reforzamos por si algún middleware lo cambiara después
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.setHeader("Surrogate-Control", "no-store");
  next();
});

/* 5) Exponer headers para que el tester pueda leerlos vía XHR/fetch */
app.use((req, res, next) => {
  res.setHeader(
    "Access-Control-Expose-Headers",
    "X-Powered-By, X-Content-Type-Options, X-XSS-Protection, Content-Security-Policy, Cache-Control, Pragma, Expires, Surrogate-Control"
  );
  next();
});

/* 6) CSP compatible con WebSockets */
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'", "ws:", "wss:"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"]
    }
  })
);

/* 6.1) Forzar no-cache específico para cualquier recurso de socket.io */
app.use("/socket.io", (req, res, next) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.setHeader("Surrogate-Control", "no-store");
  next();
});

/* 7) Estáticos SIN cache, SIN ETag/Last-Modified */
app.use(
  express.static(path.join(__dirname, "public"), {
    etag: false,
    lastModified: false,
    maxAge: 0,
    setHeaders: (res /*, filePath */) => {
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
      res.setHeader("Surrogate-Control", "no-store");
    }
  })
);

/* 8) Ruta raíz */
app.get("/", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

/* 9) Endpoint de inspección manual */
app.get("/_api/app-info", cors(), (req, res) => {
  res.json({
    ok: true,
    headers: {
      "x-powered-by": res.getHeader("X-Powered-By"),
      "x-content-type-options": res.getHeader("X-Content-Type-Options"),
      "x-xss-protection": res.getHeader("X-XSS-Protection"),
      "cache-control": res.getHeader("Cache-Control"),
      "pragma": res.getHeader("Pragma"),
      "expires": res.getHeader("Expires"),
      "surrogate-control": res.getHeader("Surrogate-Control"),
      "content-security-policy": res.getHeader("Content-Security-Policy"),
      "access-control-allow-origin": res.getHeader("Access-Control-Allow-Origin"),
      "access-control-expose-headers": res.getHeader("Access-Control-Expose-Headers")
    },
    ts: Date.now()
  });
});

/* 10) Juego mínimo con socket.io */
const players = new Map(); // id -> {x,y,score,color}
const rc = () => `#${Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, "0")}`;

io.on("connection", (socket) => {
  const start = { x: Math.floor(Math.random() * 500) + 50, y: Math.floor(Math.random() * 300) + 50 };
  players.set(socket.id, { ...start, score: 0, color: rc() });

  socket.emit("bootstrap", { id: socket.id, players: Object.fromEntries(players) });
  socket.broadcast.emit("join", { id: socket.id, state: players.get(socket.id) });

  socket.on("move", (dir) => {
    const p = players.get(socket.id);
    if (!p) return;
    const step = 4;
    if (dir === "up") p.y -= step;
    if (dir === "down") p.y += step;
    if (dir === "left") p.x -= step;
    if (dir === "right") p.x += step;
    players.set(socket.id, p);
    io.emit("state", { id: socket.id, state: p });
  });

  socket.on("collect", () => {
    const p = players.get(socket.id);
    if (!p) return;
    p.score += 1;
    players.set(socket.id, p);
    io.emit("score", { id: socket.id, score: p.score });
  });

  socket.on("disconnect", () => {
    players.delete(socket.id);
    socket.broadcast.emit("leave", { id: socket.id });
  });
});

server.listen(PORT, () => {
  console.log(`✅ Server on http://localhost:${PORT}`);
});
