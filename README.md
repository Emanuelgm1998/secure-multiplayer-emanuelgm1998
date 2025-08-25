🔒 Secure Real Time Multiplayer Game

Proyecto final del certificado Information Security de freeCodeCamp
.
Implementa un juego multijugador en tiempo real con medidas de seguridad web avanzadas.

✨ Características principales

Node.js + Express → servidor HTTP.

Socket.io → comunicación en tiempo real (WebSockets).

Helmet v3 → cabeceras de seguridad (CSP, noSniff, hidePoweredBy, etc.).

CORS habilitado → permite que el tester de freeCodeCamp pueda validar cabeceras.

Anti-cache global → todos los recursos se sirven con Cache-Control: no-store y sin ETag/Last-Modified.

Cabeceras de seguridad requeridas por FCC:

X-Powered-By: PHP 7.4.3 (simulación)

X-Content-Type-Options: nosniff

X-XSS-Protection: 1; mode=block

Cache-Control: no-store, no-cache, must-revalidate, proxy-revalidate

Pragma: no-cache / Expires: 0

Content-Security-Policy con soporte para ws:// y wss://

🕹️ Gameplay

Cada jugador aparece con un avatar cuadrado de color aleatorio.

Controles: Flechas o WASD para moverse.

Botón “+1 punto” para sumar score.

El estado se sincroniza en tiempo real entre todos los jugadores conectados.

Ranking dinámico basado en el puntaje.

⚙️ Instalación y uso
# Clonar repositorio
git clone https://github.com/<tu-usuario>/<tu-repo>.git
cd <tu-repo>

# Instalar dependencias
npm install

# Iniciar servidor
npm start


Abrir en navegador:

http://localhost:3000

🛡️ Seguridad implementada

Helmet v3 configurado con:

noSniff

hidePoweredBy({ setTo: "PHP 7.4.3" })

contentSecurityPolicy (permitiendo self + ws/wss)

XSS Protection: X-XSS-Protection: 1; mode=block.

Anti-cache global: evita almacenamiento en cliente (Cache-Control, Pragma, Expires).

CORS abierto para permitir validación de freeCodeCamp.

ETag y Last-Modified deshabilitados.

📂 Estructura del proyecto
├── server.js        # Servidor Express + Socket.io + seguridad
├── package.json     # Dependencias y scripts
└── public/          # Cliente web del juego
    ├── index.html
    └── client.js

✅ Estado

✔️ Todos los tests de freeCodeCamp superados (1–19).
Certificado Information Security completado. 🎓

👨‍💻 Autor
© 2025 Emanuel — Licencia MIT

🌐 LinkedIn
https://www.linkedin.com/in/emanuel-gonzalez-michea/

