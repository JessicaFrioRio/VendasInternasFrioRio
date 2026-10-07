// Confere se o CPF está na lista. A lista nunca vai para o navegador.
const security = require('../lib/security');


module.exports = async (req, res) => {
  security.headers(res);
  if (req.method !== "POST") return res.status(405).json({ ok: false });
  if (!security.sameOrigin(req)) return res.status(403).json({ok:false});
  if (!(req.headers['content-type'] || '').startsWith('application/json')) return res.status(415).json({ok:false});
  try {
  if (!security.configured()) return res.status(503).json({ok:false});
  if (!await security.limit(req)) {res.setHeader('Retry-After','900');return res.status(429).json({ok:false});}

  let body = req.body;
  if (typeof body === "string") {
    if (Buffer.byteLength(body)>1024) return res.status(413).json({ok:false});
    try { body = JSON.parse(body); } catch (e) { return res.status(400).json({ok:false}); }
  }
  if (!body || Array.isArray(body) || typeof body.cpf !== 'string' || !/^(?:\d{11}|\d{3}\.\d{3}\.\d{3}-\d{2})$/.test(body.cpf)) return res.status(400).json({ok:false});
  const cpf = body.cpf.replace(/\D/g, '');

  // pequena espera para dificultar tentativas em sequência

  if (security.validCpf(cpf) && security.allowed(cpf)) {
    const session=await security.createSession();
    res.setHeader('Set-Cookie',security.cookie(session.token,security.TTL));
    return res.status(200).json({ ok: true, expiresAt: session.expiresAt });
  }
  return res.status(401).json({ ok: false });
  } catch { return res.status(503).json({ok:false}); }
};
