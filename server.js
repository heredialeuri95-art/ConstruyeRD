/**
 * ConstruyeRD — Servidor Backend
 * Puerto: 3001
 * Ejecutar: node server.js
 */

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3001;

// ── Config ──────────────────────────────────────────────────────────────────
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'construyerd2025';
const SECRET_KEY = process.env.SECRET_KEY || 'crd_secret_key_2025_!';
const DATA_FILE  = path.join(__dirname, 'data', 'registros.json');
const LOG_FILE   = path.join(__dirname, 'data', 'activity.log');

// ── Init data dir ────────────────────────────────────────────────────────────
if (!fs.existsSync(path.join(__dirname, 'data'))) {
  fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true });
}
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2));
}

// ── Middleware ───────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── Helpers ──────────────────────────────────────────────────────────────────
function readData() {
  try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); }
  catch(e) { return []; }
}

function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function log(msg) {
  const entry = `[${new Date().toISOString()}] ${msg}\n`;
  fs.appendFileSync(LOG_FILE, entry);
  console.log(entry.trim());
}

function makeToken(username) {
  const payload = `${username}:${Date.now()}:${SECRET_KEY}`;
  return crypto.createHash('sha256').update(payload).digest('hex');
}

const validTokens = new Set();

function authMiddleware(req, res, next) {
  const auth = req.headers['authorization'] || '';
  const token = auth.replace('Bearer ', '');
  if (!validTokens.has(token)) {
    return res.status(401).json({ error: 'No autorizado' });
  }
  next();
}

// ── Routes ───────────────────────────────────────────────────────────────────

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', version: '1.0.0', time: new Date().toISOString() });
});

// Public: get count only
app.get('/api/count', (req, res) => {
  const data = readData();
  res.json({ count: data.length, cap: 200, remaining: Math.max(0, 200 - data.length) });
});

// Public: register
app.post('/api/register', (req, res) => {
  const { name, phone, country, goal } = req.body;

  if (!name || !phone || !country || !goal) {
    return res.status(400).json({ success: false, message: 'Todos los campos son requeridos' });
  }

  const data = readData();

  // Check cap
  if (data.length >= 200) {
    return res.status(400).json({ success: false, message: 'Los cupos de fundadores están llenos' });
  }

  // Check duplicate phone
  if (data.find(r => r.phone === phone)) {
    return res.status(400).json({ success: false, message: 'Este número ya está registrado' });
  }

  const registro = {
    id: crypto.randomUUID(),
    name: name.trim(),
    phone: phone.trim(),
    country,
    goal,
    timestamp: new Date().toISOString(),
    ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown'
  };

  data.push(registro);
  writeData(data);
  log(`NUEVO REGISTRO: ${registro.name} | ${registro.phone} | ${registro.country} | ${registro.goal}`);

  res.json({
    success: true,
    message: '¡Registrado exitosamente!',
    position: data.length,
    remaining: Math.max(0, 200 - data.length)
  });
});

// Admin: login
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    const token = makeToken(username);
    validTokens.add(token);
    log(`LOGIN: Admin autenticado`);
    res.json({ success: true, token });
  } else {
    log(`LOGIN FALLIDO: usuario=${username}`);
    res.status(401).json({ success: false, message: 'Credenciales incorrectas' });
  }
});

// Admin: get all registros
app.get('/api/registros', authMiddleware, (req, res) => {
  const data = readData();
  res.json(data);
});

// Admin: delete registro
app.delete('/api/registro/:id', authMiddleware, (req, res) => {
  let data = readData();
  const before = data.length;
  data = data.filter(r => r.id !== req.params.id);
  if (data.length === before) {
    return res.status(404).json({ error: 'Registro no encontrado' });
  }
  writeData(data);
  log(`ELIMINADO: registro id=${req.params.id}`);
  res.json({ success: true });
});

// Admin: get stats
app.get('/api/stats', authMiddleware, (req, res) => {
  const data = readData();
  const today = new Date().toDateString();
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

  const byCountry = {};
  const byGoal = {};
  data.forEach(r => {
    byCountry[r.country] = (byCountry[r.country] || 0) + 1;
    byGoal[r.goal] = (byGoal[r.goal] || 0) + 1;
  });

  res.json({
    total: data.length,
    today: data.filter(r => new Date(r.timestamp).toDateString() === today).length,
    week: data.filter(r => new Date(r.timestamp).getTime() > weekAgo).length,
    remaining: Math.max(0, 200 - data.length),
    byCountry,
    byGoal
  });
});

// Admin: export CSV
app.get('/api/export/csv', authMiddleware, (req, res) => {
  const data = readData();
  const headers = ['id', 'nombre', 'whatsapp', 'pais', 'objetivo', 'fecha', 'ip'];
  const rows = data.map(r => [r.id, r.name, r.phone, r.country, r.goal, r.timestamp, r.ip]);
  const csv = [headers, ...rows].map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="construyerd_${new Date().toISOString().split('T')[0]}.csv"`);
  res.send(csv);
  log(`CSV EXPORTADO: ${data.length} registros`);
});

// Catch-all → index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log('');
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║     ConstruyeRD — Servidor iniciado          ║');
  console.log('╠══════════════════════════════════════════════╣');
  console.log(`║  🌐 Página:   http://localhost:${PORT}          ║`);
  console.log(`║  🔧 Admin:    http://localhost:${PORT}/admin.html║`);
  console.log(`║  📡 API:      http://localhost:${PORT}/api       ║`);
  console.log('╠══════════════════════════════════════════════╣');
  console.log(`║  👤 Usuario:  ${ADMIN_USER.padEnd(30)}║`);
  console.log(`║  🔑 Clave:    ${ADMIN_PASS.padEnd(30)}║`);
  console.log('╚══════════════════════════════════════════════╝');
  console.log('');
  log('Servidor iniciado en puerto ' + PORT);
});
