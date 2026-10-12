// Riceve il modulo contatti del sito e invia una email a Elena tramite Resend.
// Variabili d'ambiente su Vercel: RESEND_API_KEY (obbligatoria), CONTACT_TO, CONTACT_FROM (facoltative).

const TO = process.env.CONTACT_TO || 'efainarea@gmail.com';
const FROM = process.env.CONTACT_FROM || 'Sito Elena <sito@solocontatti.com>';

const esc = (v = '') => String(v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clean = (v, max = 200) => String(v ?? '').trim().slice(0, max);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Metodo non consentito' });

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const nome = clean(body.nome, 120);
  const email = clean(body.email, 160);
  const azienda = clean(body.azienda, 160);
  const telefono = clean(body.telefono, 40);
  const messaggio = clean(body.messaggio, 5000);

  // campo trappola per i bot: se è compilato, fingiamo che sia andato tutto bene
  if (clean(body.sito)) return res.status(200).json({ ok: true });

  if (!nome || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Nome ed email valida sono obbligatori' });
  }

  const riga = (label, value) =>
    `<tr><td style="padding:10px 0;border-bottom:1px solid #eee;color:#666;width:150px">${label}</td><td style="padding:10px 0;border-bottom:1px solid #eee;font-weight:600">${value}</td></tr>`;

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#F4F2F4;border-radius:16px;color:#1D211F">
      <h2 style="margin:0 0 20px">Nuova richiesta dal sito ✺</h2>
      <table style="width:100%;border-collapse:collapse">
        ${riga('Nome', esc(nome))}
        ${riga('Email', `<a href="mailto:${esc(email)}" style="color:#CB5521">${esc(email)}</a>`)}
        ${riga('Nome azienda', esc(azienda) || '<span style="color:#999">Non indicato</span>')}
        ${riga('Telefono', telefono ? `<a href="tel:${esc(telefono)}" style="color:#CB5521">${esc(telefono)}</a>` : '<span style="color:#999">Non indicato</span>')}
      </table>
      <p style="margin:24px 0 8px;color:#666">Messaggio</p>
      <div style="white-space:pre-wrap;line-height:1.5">${esc(messaggio) || '<span style="color:#999">Nessun messaggio</span>'}</div>
      <p style="margin:24px 0 0;font-size:13px;color:#666">Rispondi direttamente a questa email per scrivere a ${esc(nome)}.</p>
    </div>`;

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: FROM,
        to: [TO],
        reply_to: email,
        subject: `Nuova richiesta dal sito · ${nome}${azienda ? ' · ' + azienda : ''}`,
        html
      })
    });
    if (!r.ok) {
      console.error('Resend error:', await r.text());
      return res.status(502).json({ error: 'Invio non riuscito' });
    }
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Handler error:', err);
    return res.status(500).json({ error: 'Errore del server' });
  }
}
