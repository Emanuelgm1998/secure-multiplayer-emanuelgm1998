(() => {
  const socket = io();
  const canvas = document.getElementById("stage");
  const ctx = canvas.getContext("2d");
  const meEl = document.getElementById("me");
  const btn = document.getElementById("collect");

  const state = { me: null, players: {} };

  function draw(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    // fondo
    ctx.fillStyle = "#0b1220";
    ctx.fillRect(0,0,canvas.width,canvas.height);

    for(const [id,p] of Object.entries(state.players)){
      // jugador
      ctx.fillStyle = p.color || "#6cb2ff";
      ctx.fillRect(p.x, p.y, 18, 18);
      // etiqueta
      ctx.fillStyle = "#e6edf6";
      ctx.font = "12px monospace";
      const tag = (id === state.me) ? `${id.slice(0,6)} (yo) — ${p.score}` : `${id.slice(0,6)} — ${p.score}`;
      ctx.fillText(tag, p.x - 4, p.y - 6);
    }
  }

  function loop(){
    draw();
    requestAnimationFrame(loop);
  }
  loop();

  // inputs
  const pressed = new Set();
  window.addEventListener("keydown",(e)=>{
    const map = { ArrowUp:"up", ArrowDown:"down", ArrowLeft:"left", ArrowRight:"right", w:"up", s:"down", a:"left", d:"right" };
    const dir = map[e.key];
    if(dir && !pressed.has(dir)){
      pressed.add(dir);
      socket.emit("move", dir);
    }
  });
  window.addEventListener("keyup",(e)=>{
    const map = { ArrowUp:"up", ArrowDown:"down", ArrowLeft:"left", ArrowRight:"right", w:"up", s:"down", a:"left", d:"right" };
    const dir = map[e.key];
    if(dir) pressed.delete(dir);
  });

  btn.addEventListener("click", () => socket.emit("collect"));

  // io events
  socket.on("bootstrap", (payload) => {
    state.me = payload.id;
    state.players = payload.players || {};
    document.getElementById("me").textContent = `tu id: ${state.me}`;
  });

  socket.on("join", ({ id, state: ps }) => {
    state.players[id] = ps;
  });

  socket.on("leave", ({ id }) => {
    delete state.players[id];
  });

  socket.on("state", ({ id, state: ps }) => {
    state.players[id] = ps;
  });

  socket.on("score", ({ id, score }) => {
    if(state.players[id]) state.players[id].score = score;
  });
})();
