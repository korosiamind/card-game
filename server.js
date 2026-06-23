const http = require('http');
const fs   = require('fs');
const path = require('path');
const WebSocket = require('ws');
const os = require('os');

const root = __dirname;
const mime = { html:'text/html', css:'text/css', js:'application/javascript', png:'image/png' };

const server = http.createServer((req, res) => {
  const reqPath = req.url.split('?')[0];
  const file = path.join(root, decodeURIComponent(reqPath === '/' ? 'index.html' : reqPath));
  const ext  = path.extname(file).slice(1);
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    res.writeHead(200, { 'Content-Type': mime[ext] || 'text/plain', 'Cache-Control': 'no-store' });
    res.end(data);
  });
});

const wss = new WebSocket.Server({ server });

// rooms: code -> { host: ws, guest: ws | null }
const rooms = new Map();

function generateCode() {
  let code;
  do { code = Math.floor(1000 + Math.random() * 9000).toString(); }
  while (rooms.has(code));
  return code;
}

function send(ws, data) {
  if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(data));
}

wss.on('connection', ws => {
  ws.roomCode = null;
  ws.role = null;

  ws.on('message', raw => {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }

    if (msg.type === 'host') {
      const code = generateCode();
      rooms.set(code, { host: ws, guest: null });
      ws.roomCode = code;
      ws.role = 'host';
      send(ws, { type: 'room_created', code });
    }

    else if (msg.type === 'join') {
      const room = rooms.get(msg.code);
      if (!room)       { send(ws, { type: 'error', text: 'Комната не найдена' }); return; }
      if (room.guest)  { send(ws, { type: 'error', text: 'Комната уже занята' }); return; }
      room.guest = ws;
      ws.roomCode = msg.code;
      ws.role = 'guest';
      send(ws,       { type: 'joined', code: msg.code });
      send(room.host, { type: 'opponent_ready' });
    }

    else if (msg.type === 'relay') {
      const room = rooms.get(ws.roomCode);
      if (!room) return;
      const target = ws.role === 'host' ? room.guest : room.host;
      send(target, msg.payload);
    }
  });

  ws.on('close', () => {
    const room = rooms.get(ws.roomCode);
    if (!room) return;
    const other = ws.role === 'host' ? room.guest : room.host;
    send(other, { type: 'opponent_disconnected' });
    rooms.delete(ws.roomCode);
  });
});

server.on('error', e => {
  if (e.code === 'EADDRINUSE')
    console.error('Порт 7823 уже занят. Закройте предыдущий сервер и запустите снова.');
  else
    console.error(e);
  process.exit(1);
});

const PORT = process.env.PORT || 7823;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Сервер запущен: http://localhost:${PORT}/`);
  for (const ifaces of Object.values(os.networkInterfaces())) {
    for (const iface of ifaces) {
      if (iface.family === 'IPv4' && !iface.internal)
        console.log(`Сеть:           http://${iface.address}:${PORT}/`);
    }
  }
});
