
/**
 * server.js
 * يشغّل سيرفر Express ويعرض IP والـ Remote Port للعميل مع لوج واضح.
 */

const express = require('express');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware: توليد معرف اتصال وتسجيل التفاصيل
app.use((req, res, next) => {
  const connId = crypto.randomUUID();
  req.connId = connId;

  const clientIP = req.socket?.remoteAddress;
  const clientPort = req.socket?.remotePort;
  const serverIP = req.socket?.localAddress;
  const serverPort = req.socket?.localPort;

  // لوج مُفصّل
  console.log(
    `[CONN ${connId}] client=${clientIP}:${clientPort} -> server=${serverIP}:${serverPort} ${req.method} ${req.url}`
  );

  res.locals.conn = { connId, clientIP, clientPort, serverIP, serverPort };
  next();
});

// صفحة رئيسية تعرض المعلومات
app.get('/', (req, res) => {
  const { connId, clientIP, clientPort, serverIP, serverPort } = res.locals.conn;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(`<!doctype html>
<html lang="ar">
<head>
  <meta charset="utf-8" />
  <title>تفاصيل اتصالك</title>
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <style>
    body { font-family: system-ui, Arial; margin: 40px; background:#fafafa; }
    .card { max-width: 720px; margin: auto; padding: 24px; border: 1px solid #ddd; border-radius: 12px; background:#fff; }
    code { background: #f1f1f1; padding: 2px 6px; border-radius: 4px; }
    .muted { color:#666; }
    .row { display:flex; gap:12px; flex-wrap:wrap; }
    .row div { flex:1 1 280px; }
  </style>
</head>
<body>
  <div class="card">
    <h1>تفاصيل اتصالك الحالية</h1>
    <div class="row">
      <div><strong>Connection ID:</strong> <code>${connId}</code></div>
      <div><strong>Client IP:</strong> <code>${clientIP}</code></div>
      <div><strong>Client Port (Remote Port):</strong> <code>${clientPort}</code></div>
      <div><strong>Server IP:</strong> <code>${serverIP}</code></div>
      <div><strong>Server Port (Local Port):</strong> <code>${serverPort}</code></div>
    </div>
    <hr/>
    <p class="muted">اعمل <strong>Refresh</strong> غالبًا هتشوف <code>Client Port</code> اتغيّر؛ ده طبيعي بسبب اختيار منافذ مؤقتة (ephemeral).</p>
  </div>
</body>
</html>`);
});


// ✅ أضف هنا المسار الجديد
app.get('/debug', (req, res) => {
  res.json({
    ip: req.socket.remoteAddress,
    port: req.socket.remotePort
  });
});


// تشغيل السيرفر
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
