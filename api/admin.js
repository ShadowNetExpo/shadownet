const GATE = 'SN-Gate-7742';
const COOKIE = '_sna';
const RAW = 'https://raw.githubusercontent.com/ShadowNetExpo/shadownet/main/panel-xc9k2.html';

const GATE_HTML = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Acceso restringido</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#01020c;color:#e8f4ff;font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh}
.box{background:#050d1a;border:1px solid #0d2744;border-radius:12px;padding:40px;width:100%;max-width:360px}
h2{color:#ff2255;font-size:20px;margin-bottom:6px;letter-spacing:.1em}
p{color:#3a6080;font-size:13px;margin-bottom:24px}
input{width:100%;background:#0a1828;border:1px solid #0d2744;border-radius:8px;padding:12px;color:#e8f4ff;font-size:15px;outline:none;margin-bottom:12px}
input:focus{border-color:#ff2255}
button{width:100%;background:linear-gradient(135deg,#ff2255,#cc0030);color:#fff;border:none;border-radius:8px;padding:13px;font-size:15px;font-weight:700;cursor:pointer}
.err{color:#ff2255;font-size:13px;margin-top:8px;text-align:center;min-height:18px}
</style>
</head>
<body>
<div class="box">
<h2>SHADOWNET</h2>
<p>Acceso restringido. Introduce la clave de acceso.</p>
<form method="POST">
<input type="password" name="p" placeholder="Clave de acceso" autofocus>
<button type="submit">ENTRAR</button>
</form>
<div class="err">ERROR_MSG</div>
</div>
</body>
</html>`;

module.exports = async function handler(req, res) {
  const cookies = Object.fromEntries(
    (req.headers.cookie || '').split(';').map(c => c.trim().split('=')).filter(a => a.length === 2)
  );

  if (req.method === 'POST') {
    let body = '';
    await new Promise(resolve => { req.on('data', c => body += c); req.on('end', resolve); });
    const params = new URLSearchParams(body);
    if (params.get('p') === GATE) {
      res.setHeader('Set-Cookie', `${COOKIE}=${GATE}; Path=/; HttpOnly; SameSite=Strict; Max-Age=86400`);
      res.setHeader('Location', '/panel-xc9k2.html');
      res.status(302).end();
      return;
    }
    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(GATE_HTML.replace('ERROR_MSG', 'Clave incorrecta'));
    return;
  }

  if (cookies[COOKIE] === GATE) {
    const r = await fetch(RAW);
    const html = await r.text();
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    res.status(200).send(html);
    return;
  }

  res.setHeader('Content-Type', 'text/html');
  res.status(200).send(GATE_HTML.replace('ERROR_MSG', ''));
};
