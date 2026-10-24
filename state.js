// Armazena o estado da clínica (dados, notas fiscais, histórico) no Netlify Blobs.
// Protegido por senha: defina CLINIC_PASSWORD nas variáveis de ambiente do site.
const { getStore } = require('@netlify/blobs');

const JSON_HEADERS = { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' };
const MAX_BYTES = 6 * 1024 * 1024; // limite de payload das Netlify Functions

exports.handler = async (event) => {
  const expected = process.env.CLINIC_PASSWORD;
  const provided = (event.headers && (event.headers['x-clinic-key'] || event.headers['X-Clinic-Key'])) || '';
  if (!expected || provided !== expected) {
    return { statusCode: 401, headers: JSON_HEADERS, body: JSON.stringify({ error: 'unauthorized' }) };
  }

  const store = getStore('alb-clin');

  if (event.httpMethod === 'GET') {
    const saved = await store.get('state', { type: 'json' });
    return { statusCode: 200, headers: JSON_HEADERS, body: JSON.stringify(saved || { data: null }) };
  }

  if (event.httpMethod === 'PUT') {
    const text = event.isBase64Encoded ? Buffer.from(event.body || '', 'base64').toString('utf8') : (event.body || '');
    if (Buffer.byteLength(text, 'utf8') > MAX_BYTES) {
      return { statusCode: 413, headers: JSON_HEADERS, body: JSON.stringify({ error: 'too_large' }) };
    }
    let parsed;
    try { parsed = JSON.parse(text); } catch (err) {
      return { statusCode: 400, headers: JSON_HEADERS, body: JSON.stringify({ error: 'invalid_json' }) };
    }
    await store.setJSON('state', parsed);
    return { statusCode: 200, headers: JSON_HEADERS, body: JSON.stringify({ ok: true, savedAt: new Date().toISOString() }) };
  }

  return { statusCode: 405, headers: JSON_HEADERS, body: JSON.stringify({ error: 'method_not_allowed' }) };
};
