/* GET /api/rate — live AUD → PHP mid-market rate.
   Tries Wise first (the same rate as wise.com's currency converter), then
   falls back to the European Central Bank rate via Frankfurter.
   Vercel's edge caches the answer for an hour, so Wise is asked at most
   about once an hour no matter how many staff open the tool.
   No student data passes through here. */
const SOURCES = [
  {
    name: 'Wise',
    url: 'https://wise.com/rates/live?source=AUD&target=PHP',
    pick: d => ({ rate: d.value, time: d.time })
  },
  {
    name: 'European Central Bank',
    url: 'https://api.frankfurter.dev/v1/latest?base=AUD&symbols=PHP',
    pick: d => ({ rate: d.rates && d.rates.PHP, time: Date.parse(d.date + 'T16:00:00Z') })
  }
];

async function getJSON(url) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 5000);
  try {
    const r = await fetch(url, { signal: ctrl.signal, headers: { accept: 'application/json', 'user-agent': 'uandi-quote-builder' } });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return await r.json();
  } finally { clearTimeout(t); }
}

module.exports = async (req, res) => {
  for (const s of SOURCES) {
    try {
      const { rate, time } = s.pick(await getJSON(s.url));
      if (typeof rate === 'number' && rate > 10 && rate < 100) {
        res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
        res.status(200).json({ rate, source: s.name, time: time || Date.now() });
        return;
      }
    } catch (e) { /* try the next source */ }
  }
  res.setHeader('Cache-Control', 'no-store');
  res.status(502).json({ error: 'No rate source answered' });
};
