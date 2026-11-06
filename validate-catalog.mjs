import { normalizeFinderUrl } from './finder-config.mjs';

const isDate = s => typeof s === 'string' && Number.isFinite(Date.parse(s));
function isHttps(s) {
  try { const u = new URL(s); return u.protocol === 'https:' && !u.username && !u.password; }
  catch { return false; }
}

export function validateCatalog(catalog) {
  normalizeFinderUrl(catalog.sourceUrl);
  if (!isDate(catalog.checkedAt) || !Number.isInteger(catalog.reportedCount) ||
      !Array.isArray(catalog.models) || !Array.isArray(catalog.offers) ||
      catalog.reportedCount < catalog.models.length) throw new Error('Invalid finder snapshot.');
  const models = new Set();
  for (const m of catalog.models) {
    const u = new URL(m.url);
    if (!/^\d+$/.test(m.id) || !m.name || models.has(m.id) ||
        u.origin !== 'https://www.gsmarena.com' || !u.pathname.endsWith('-'+m.id+'.php') ||
        !m.specs || typeof m.specs !== 'object' || Array.isArray(m.specs)) {
      throw new Error('Invalid or duplicate catalog phone: '+m.id);
    }
    models.add(m.id);
  }
  const offers = new Set();
  for (const o of catalog.offers) {
    if (!o.id || offers.has(o.id) || !models.has(o.modelId) || !o.seller || !o.location ||
        !o.variant || !o.condition || !isHttps(o.url) || !Number.isFinite(o.priceLkr) || o.priceLkr <= 0 ||
        !['in_stock','low_stock'].includes(o.stock?.status) || !isDate(o.stock?.checkedAt) ||
        !o.stock?.evidence || !o.priceEvidence) throw new Error('Catalog offers need exact variant, local price and positive stock evidence: '+o.id);
    offers.add(o.id);
  }
}
