
const express = require('express');
const crypto = require('crypto');
const app = express();
const port = 3000;

app.get('/', (req, res) => {
  // IP الحقيقي (مع دعم X-Forwarded-For لو فيه Proxy)
  const clientIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

  // المنفذ
  const clientPort = req.socket.remotePort;

  // الوقت الحالي بدقة عالية
  const now = new Date();
  const hrTime = process.hrtime.bigint(); // نانو ثانية
  const femto = hrTime.toString(); // نعرضه كرقم كبير

  // بيانات Fingerprint
  const userAgent = req.headers['user-agent'] || 'Unknown';
  const acceptLang = req.headers['accept-language'] || 'Unknown';
  const fingerprintSource = `${clientIP}|${userAgent}|${acceptLang}`;
  const fingerprintHash = crypto.createHash('sha256').update(fingerprintSource).digest('hex');

  res.send(`
    <!doctype html>
    <html lang="ar">
    <head>
      <meta charset="utf-8" />
      <title>تفاصيل اتصالك</title>
      <style>
        body { font-family: Arial, sans-serif; background:#f9f9f9; margin:40px; }
        .card { max-width:700px; margin:auto; background:#fff; padding:20px; border-radius:10px; box-shadow:0 0 10px rgba(0,0,0,0.1); }
        h1 { color:#333; }
        p { font-size:16px; }
        code { background:#eee; padding:4px 8px; border-radius:4px; }
      </style>
    </head>
    <body>
      <div class="card">
        <h1>تفاصيل اتصالك</h1>
        <p><strong>IP:</strong> <code>${clientIP}</code></p>
        <p><strong>Port:</strong> <code>${clientPort}</code></p>
        <p><strong>الوقت الحالي:</strong> <code>${now.toISOString()}</code></p>
        <p><strong>دقة عالية (نانو/فيمتو):</strong> <code>${femto} ns</code></p>
        <p><strong>User-Agent:</strong> <code>${userAgent}</code></p>
        <p><strong>Accept-Language:</strong> <code>${acceptLang}</code></p>
        <p><strong>Fingerprint (SHA256):</strong> <code>${fingerprintHash}</code></p>
        <hr/>
        <p>اعمل Refresh وهتشوف البورت والوقت والبصمة تتغير.</p>
      </div>
    </body>
    </html>
  `);
});

app.listen(port, () => {
  console.log(`✅ Server running at http://localhost:${port}`);
});
