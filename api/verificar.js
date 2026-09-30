// Confere se o CPF está na lista. A lista nunca vai para o navegador.
const { CPFS, FORM_URL } = require("./_dados");

const lista = new Set(CPFS.map((c) => String(c).replace(/\D/g, "")).filter(Boolean));

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ ok: false });

  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch (e) { body = {}; }
  }
  const cpf = String((body && body.cpf) || "").replace(/\D/g, "");

  // pequena espera para dificultar tentativas em sequência
  await new Promise((r) => setTimeout(r, 400));

  if (cpf.length === 11 && lista.has(cpf)) {
    return res.status(200).json({ ok: true, link: FORM_URL });
  }
  return res.status(401).json({ ok: false });
};
