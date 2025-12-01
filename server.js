
const express = require('express');
const crypto = require('crypto');
const app = express();
const PORT = process.env.PORT || 3000;

function normalizeIP(ip) {
  if (!ip) return '';
  ip = ip.replace('::ffff:', '').trim();
  if (ip.includes(',')) ip = ip.split(',')[0].trim();
  return ip;
}

function escapeHTML(str) {
  if (!str) return '';
  return str.replace(/[&<>"']/g, (m) => ({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
  }[m]));
}

app.get('/', async (req, res) => {
  const rawIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const clientIP = normalizeIP(rawIP);
  const clientPort = req.socket.remotePort;

  const now = new Date();
  const hr = process.hrtime.bigint();
  const nanos = hr.toString();

  const userAgent = req.headers['user-agent'] || 'Unknown';
  const acceptLang = req.headers['accept-language'] || 'Unknown';
  const fingerprintSource = `${clientIP}|${userAgent}|${acceptLang}`;
  const fingerprintHash = crypto.createHash('sha256').update(fingerprintSource).digest('hex');

  let ipGeo = { city:null, region:null, country_name:null, latitude:null, longitude:null, org:null, message:null };
  const isLocal = clientIP.startsWith('127.') || clientIP.startsWith('192.168.') || clientIP.startsWith('10.') || clientIP === '::1';

  if (!isLocal && clientIP) {
    try {
      = await fetch(`https://ipapi.co/${clientIP}/json/`);
      if (response.ok) {
        const data = await response.json();
        ipGeo.city = data.city || null;
        ipGeo.region = data.region || null;
        ipGeo.country_name = data.country_name || data.country || null;
        ipGeo.latitude = data.latitude || null;
        ipGeo.longitude = data.longitude || null;
        ipGeo.org = data.org || data.asn || null;
      } else {
        ipGeo.message = `IP API response: ${response.status}`;
      }
    } catch (e) {
      ipGeo.message = 'IP API fetch failed';
    }
  } else {
    ipGeo.message = 'Local/private IP detected; use browser Geolocation for coordinates.';
  }

  res.send(`<!doctype html>
<html lang="ar">
<head>
<meta charset="utf-8" />
<title>تفاصيل اتصالك</title>
<meta name="viewport" content="width=device-width,initial-scale=1" />
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
:root { --bg:#0f172a; --card:#111827; --text:#e5e7eb; --muted:#9ca3af; --accent:#22d3ee; }
body { margin:0; font-family: system-ui, Arial; background: var(--bg); color: var(--text); }
.wrap { max-width: 960px; margin: 40px auto; padding: 0 16px; }
.card { background: var(--card); border-radius: 16px; padding: 24px; box-shadow: 0 8px 24px rgba(0,0,0,.35); }
h1 { margin-top:0; font-size: 24px; }
.grid { display:grid; grid-template-columns: repeat(auto-fit,minmax(240px,1fr)); gap: 12px; }
.item { background: rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.08); border-radius: 12px; padding: 14px; }
.label { color: var(--muted); font-size: 12px; text-transform: uppercase; letter-spacing: .08em; }
.val { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace; font-size:14px; word-break: break-all; }
.hr { border:0; border-top:1px solid rgba(255,255,255,.08); margin: 16px 0; }
.hint { color: var(--muted); font-size: 13px; }
.badge { display:inline-block; padding:2px 8px; border-radius:999px; background: rgba(34,211,238,.15); color: var(--accent); font-size:12px; }
.map { height: 320px; border-radius: 12px; overflow: hidden; border:1px solid rgba(255,255,255,.12); }
.btn { background: var(--accent); color:#0b1020; border:0; padding:10px 14px; border-radius:10px; font-weight:600; cursor:pointer; }
.btn:disabled { opacity:.6; cursor:not-allowed; }
a { color: var(--accent); text-decoration:none; }
</style>
</head>
<body>
<div class="wrap">
<div class="card">
<h1>تفاصيل اتصالك <span class="badge">Live</span></h1>
<div class="grid">
<div class="item"><div class="label">Client IP</div><div class="val">${clientIP || 'غير متاح'}</div></div>
<div class="item"><div class="label">Client Port</div><div class="val">${clientPort}</div></div>
<div class="item"><div class="label">Server Time (ISO)</div><div class="val">${now.toISOString()}</div></div>
<div class="item"><div class="label">High-Res (nanos)</div><div class="val">${nanos} ns</div></div>
<div class="item"><div class="label">User-Agent</div><div class="val">${escapeHTML(userAgent)}</div></div>
<div class="item"><div class="label">Accept-Language</div><div class="val">${escapeHTML(acceptLang)}</div></div>
<div class="item"><div class="label">Fingerprint (SHA-256)</div><div class="val">${fingerprintHash}</div></div>
</div>
<hr class="hr"/>
<h2>الموقع والإحداثيات</h2>
<p class="hint">* لو الـ IP محلي، استخدم زر "الحصول على إحداثياتي" للحصول على إحداثيات دقيقة من المتصفح.</p>
<div class="grid">
<div class="item"><div class="label">City</div><div class="val">${ipGeo.city || '-'}</div></div>
<div class="item"><div class="label">Region</div><div class="val">${ipGeo.region || '-'}</div></div>
<div class="item"><div class="label">Country</div><div class="val">${ipGeo.country_name || '-'}</div></div>
<div class="item"><div class="label">ISP/Org</div><div class="val">${ipGeo.org || '-'}</div></div>
<div class="item"><div class="label">Latitude</div><div class="val" id="lat">${ipGeo.latitude || '-'}</div></div>
<div class="item"><div class="label">Longitude</div><div class="val" id="lon">${ipGeo.longitude || '-'}</div></div>
</div>
<p class="hint">${ipGeo.message ? escapeHTML(ipGeo.message) : ''}</p>
<div style="margin:14px 0;">
<button class="btn" id="geoBtn">الحصول على إحداثياتي (المتصفح)</button>
</div>
<div id="map" class="map"></div>
</div>
</div>
<script>
function setText(id,val){const el=document.getElementById(id);if(el)el.textContent=val;}
let map;
function initMap(lat,lon){if(!map){map=L.map('map').setView([lat,lon],13);L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'&copy; OpenStreetMap contributors'}).addTo(map);L.marker([lat,lon]).addTo(map);}else{map.setView([lat,lon],13);L.marker([lat,lon]).addTo(map);}}
const btn=document.getElementById('geoBtn');
btn?.addEventListener('click',()=>{btn.disabled=true;btn.textContent='جاري الحصول على الإحداثيات...';if(!navigator.geolocation){alert('المتصفح لا يدعم Geolocation');btn.disabled=false;btn.textContent='الحصول على إحداثياتي (المتصفح)';return;}navigator.geolocation.getCurrentPosition((pos)=>{const{latitude,longitude}=pos.coords;setText('lat',latitude.toFixed(6));setText('lon',longitude.toFixed(6));initMap(latitude,longitude);btn.textContent='تم الحصول على الإحداثيات ✔';},(err)=>{alert('تعذر الحصول على الإحداثيات: '+err.message);btn.disabled=false;btn.textContent='الحصول على إحداثياتي (المتصفح)';},{enableHighAccuracy:true,timeout:10000,maximumAge:0});});
</script>
</body>
</html>`);
});

app.listen(PORT,()=>{console.log(`✅ Server running at http://localhost:${PORT}`);});
