/* ============================================================
   Capital Store MSK — backend
   Чистый Node.js (http/https/fs), без внешних зависимостей.
   Раздаёт статику + два API-эндпоинта:
     GET  /api/products  → VK Market (кэш 5 мин), либо []
     POST /api/order     → заявка в Telegram
   ============================================================ */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

// --- .env (простой парсер, без dotenv) ---
loadEnv();
const {
  PORT = 3000,
  VK_TOKEN, VK_GROUP_ID, VK_API_VERSION = '5.199',
  TG_BOT_TOKEN, TG_CHAT_ID,
} = process.env;

const ROOT = __dirname;
const MIME = {
  '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8',
  '.js':'text/javascript; charset=utf-8', '.json':'application/json; charset=utf-8',
  '.svg':'image/svg+xml', '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg',
  '.webp':'image/webp', '.ico':'image/x-icon', '.woff2':'font/woff2', '.txt':'text/plain; charset=utf-8',
};

/* ============================================================
   HTTP-сервер
   ============================================================ */
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  try {
    if (url.pathname === '/api/products' && req.method === 'GET') return handleProducts(res);
    if (url.pathname === '/api/order'    && req.method === 'POST') return handleOrder(req, res);
    if (url.pathname.startsWith('/api/')) return json(res, 404, { error:'not found' });
    // страница товара — подставляем Open Graph под конкретный товар (превью в мессенджерах)
    if ((url.pathname === '/product.html' || url.pathname === '/product') && url.searchParams.get('id')) {
      return handleProductPage(url.searchParams.get('id'), res);
    }
    return serveStatic(url.pathname, res);
  } catch (err) {
    console.error('Ошибка запроса:', err);
    json(res, 500, { error:'internal error' });
  }
});

server.listen(PORT, () => {
  console.log(`\n  Capital Store MSK → http://localhost:${PORT}`);
  console.log(`  VK Market:  ${VK_TOKEN && VK_GROUP_ID ? 'подключён' : 'демо-режим (нет токенов)'}`);
  console.log(`  Telegram:   ${TG_BOT_TOKEN && TG_CHAT_ID ? 'подключён' : 'не настроен (заявки не уйдут)'}\n`);
  scheduleNightlyRefresh();
});

/* ============================================================
   /api/products — VK Market
   ============================================================ */
let cache = { at:0, data:null };
const CACHE_MS = 24 * 60 * 60 * 1000; // сутки — обновляем раз в день (ночью)
const REFRESH_HOUR = 4;               // час ночного обновления (локальное время сервера)

// Забираем весь каталог из VK постранично (market.get отдаёт максимум 200 за раз)
async function fetchVkCatalog() {
  const owner = -Math.abs(Number(VK_GROUP_ID)); // группа → отрицательный owner_id
  const items = [];
  for (let offset = 0; offset < 4000; offset += 200) {
    const api = `https://api.vk.com/method/market.get?owner_id=${owner}`
      + `&count=200&offset=${offset}&extended=1`
      + `&access_token=${VK_TOKEN}&v=${VK_API_VERSION}`;
    const raw = await httpsGetJSON(api);
    if (raw.error) throw new Error(raw.error.error_msg || 'VK error');
    const page = (raw.response && raw.response.items) || [];
    items.push(...page);
    const total = (raw.response && raw.response.count) || page.length;
    if (items.length >= total || page.length < 200) break;
  }
  return items
    .filter(it => it.availability === 0 || it.availability == null)
    .map(normalizeVk);
}

// Обновление каталога: тянем из VK, кладём в кэш и переписываем снапшот products.json
async function refreshCatalog() {
  if (!VK_TOKEN || !VK_GROUP_ID) return;
  try {
    const products = await fetchVkCatalog();
    cache = { at: Date.now(), data: products };
    try { fs.writeFileSync(path.join(ROOT, 'products.json'), JSON.stringify(products)); } catch (_) {}
    console.log(`Каталог обновлён из VK: ${products.length} товаров (${new Date().toLocaleString('ru-RU')})`);
  } catch (err) {
    console.error('Обновление каталога из VK:', err.message);
  }
}

// Планировщик: обновление один раз в сутки ночью (в REFRESH_HOUR)
function scheduleNightlyRefresh() {
  if (!VK_TOKEN || !VK_GROUP_ID) return;
  refreshCatalog(); // разовое обновление при старте
  const now = new Date();
  const next = new Date(now);
  next.setHours(REFRESH_HOUR, 0, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1);
  setTimeout(function tick() {
    refreshCatalog();
    setInterval(refreshCatalog, 24 * 60 * 60 * 1000);
  }, next - now);
  console.log(`Ночное обновление каталога: ${next.toLocaleString('ru-RU')}, затем каждые 24 ч`);
}

async function handleProducts(res) {
  if (!VK_TOKEN || !VK_GROUP_ID) return json(res, 200, []); // фронт покажет снапшот/демо
  // отдаём кэш; если устарел (сутки) или пуст — обновляем на лету
  if (!cache.data || Date.now() - cache.at >= CACHE_MS) await refreshCatalog();
  json(res, 200, cache.data || []);
}

// Бренды для распознавания (порядок важен: сначала многословные)
const VK_BRANDS = [
  'Maison Mihara Yasuhiro','1017 ALYX','Rick Owens','Stone Island','Raf Simons',
  'Louis Vuitton','Bottega Veneta','Loro Piana','New Balance','Off-White','Off White','Palm Angels',
  'Fear of God','Chrome Hearts','Ralph Lauren','C.P. Company','CP Company','Acne Studios',
  'Represent','Corteiz','Trapstar','Balenciaga','Burberry','Champion','Goyard','Celine',
  'Supreme','Gucci','Prada','Moncler','Amiri','Adidas','Nike','Jordan','Dior','Hermes',
  'Loewe','Lacoste','Carhartt','Arcteryx','Vetements','Essentials','Yeezy','Zegna',
  'Brunello','Diesel','Versace','Fendi','Givenchy','Valentino','Marni','Kenzo','Y-3',
  'Denim Tears','Sp5der','Puma','Asics','Salomon','New Era','Polo','Alyx','Pinko','DJI',
  'Kith','Ami Paris','Ami',
];

// Чистим название: отрезаем «| МОСКВА | 1000+ отзывов» и лишние пробелы
function cleanName(title) {
  return String(title || 'Товар')
    .split('|')[0]
    .replace(/\s+/g, ' ')
    .replace(/^[\s\-–|]+|[\s\-–|]+$/g, '')
    .trim() || 'Товар';
}

function findBrand(title) {
  const low = String(title || '').toLowerCase();
  for (const b of VK_BRANDS) if (low.includes(b.toLowerCase())) return b;
  return '';
}

// Разбор размера из описания VK («Размер: XXL», «Размер - 43», «W32, W33»)
const CYR_MAP = { 'М':'M','м':'M','Х':'X','х':'X','Л':'L','л':'L','С':'S','с':'S' };
const SIZE_LET = ['XXXL','XXL','XL','XS','S','M','L','OS'];
const SIZE_ORDER = { XS:0,S:1,M:2,L:3,XL:4,XXL:5,XXXL:6,OS:7 };
function parseSizeRaw(desc) {
  const m = /Размер[ы]?\s*[:\-]?\s*([^•]+)/i.exec(desc || '');
  if (!m) return '';
  let raw = m[1].trim().replace(/^•|•$/g, '').trim().replace(/~~.*?~~/g, '');
  return raw.replace(/\s+/g, ' ').replace(/^[\s,]+|[\s,]+$/g, '');
}
function normalizeSizes(raw) {
  if (!raw) return [];
  const s = raw.split('').map(ch => CYR_MAP[ch] || ch).join('');
  const toks = [];
  for (const L of SIZE_LET) if (new RegExp('(?<![A-Za-z])' + L + '(?![A-Za-z])').test(s)) toks.push(L);
  const nums = s.replace(/,/g, '.').match(/(?<!\d)\d{2}(?:\.5)?(?!\d)/g) || [];
  for (const n of nums) { const v = parseFloat(n); if (v >= 28 && v <= 52) toks.push(n); }
  return [...new Set(toks)].sort((a, b) => {
    const oa = a in SIZE_ORDER ? [0, SIZE_ORDER[a]] : [1, parseFloat(a)];
    const ob = b in SIZE_ORDER ? [0, SIZE_ORDER[b]] : [1, parseFloat(b)];
    return oa[0] - ob[0] || oa[1] - ob[1];
  });
}

function normalizeVk(it) {
  const price = it.price ? Math.round(Number(it.price.amount) / 100) : 0;
  const old = it.price && it.price.old_amount ? Math.round(Number(it.price.old_amount) / 100) : 0;
  // выбираем самое крупное фото у каждой картинки
  const images = (it.photos || []).map(p => {
    const sizes = (p.sizes || []).slice().sort((a, b) => (a.width || 0) - (b.width || 0));
    const best = sizes[sizes.length - 1];
    return best ? best.url : '';
  }).filter(Boolean);
  const img = images[0] || it.thumb_photo || '';
  const title = it.title || '';
  const rawSize = parseSizeRaw(it.description || '');
  return {
    id: String(it.id),
    name: cleanName(title),
    brand: findBrand(title),
    price, old,
    cat: guessCat(title),
    img,
    images: images.length ? images : [img].filter(Boolean),
    desc: (it.description || '').replace(/\s+/g, ' ').trim().slice(0, 600),
    size: rawSize,
    sizes: normalizeSizes(rawSize),
    tag: old ? 'Sale' : '',
  };
}

// Категория по типу вещи в названии (VK-категория у товаров не заполнена)
function guessCat(title) {
  const t = String(title || '').toLowerCase();
  if (/кроссов|кед|ботин|туфл|сапог|лофер|слайд|мюл|обувь|sneaker|shoe|boot/.test(t)) return 'shoes';
  if (/штаны|шорты|джинс|брюки|легинс|карго/.test(t)) return 'pants';
  if (/худи|свитшот|свитер|зип|кофт|толстовк|джемпер|кардиг|hoodie|zip/.test(t)) return 'hoodie';
  if (/футбол|лонгслив|поло|майк|tee|t-shirt/.test(t)) return 'tshirt';
  if (/куртк|пуховик|овершот|жилет|плащ|парк|ветровк|бомбер|пиджак|дублён|шуб|пальт|анорак/.test(t)) return 'outer';
  if (/рюкзак|сумк|шоппер|тоут|клатч|барсет|goyard|кошел|мессендж|bag|картхолдер/.test(t)) return 'bags';
  return 'acc';
}

/* ============================================================
   /api/order — заявка в Telegram
   ============================================================ */
function handleOrder(req, res) {
  readBody(req, 25_000).then(async body => {
    let data;
    try { data = JSON.parse(body || '{}'); }
    catch { return json(res, 400, { error:'bad json' }); }

    // антиспам: honeypot-поле должно быть пустым
    if (data.website) return json(res, 200, { ok:true }); // тихо игнорируем бота

    if (!data.name || !data.phone) return json(res, 400, { error:'name и phone обязательны' });

    if (!TG_BOT_TOKEN || !TG_CHAT_ID) {
      console.log('Заявка (Telegram не настроен):', data.name, data.phone);
      return json(res, 503, { error:'Telegram не настроен на сервере' });
    }

    try {
      await sendTelegram(formatOrder(data));
      json(res, 200, { ok:true });
    } catch (err) {
      console.error('Telegram sendMessage:', err.message);
      json(res, 502, { error:'не удалось отправить в Telegram' });
    }
  }).catch(() => json(res, 400, { error:'bad request' }));
}

function formatOrder(d) {
  const esc = s => String(s == null ? '' : s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const L = [];
  L.push('<b>Новая заявка — Capital Store MSK</b>');
  L.push('');
  L.push(`<b>Имя:</b> ${esc(d.name)}`);
  L.push(`<b>Телефон:</b> ${esc(d.phone)}`);
  if (d.email)    L.push(`<b>Контакт:</b> ${esc(d.email)}`);
  if (d.delivery) L.push(`<b>Доставка:</b> ${esc(d.delivery)}`);
  if (d.item)     L.push(`<b>Товар:</b> ${esc(d.item)}`);
  if (d.comment)  L.push(`<b>Комментарий:</b> ${esc(d.comment)}`);

  if (d.cart && Array.isArray(d.cart.items) && d.cart.items.length) {
    L.push('');
    L.push('<b>Корзина:</b>');
    d.cart.items.forEach(i => {
      const line = [i.brand, i.name].filter(Boolean).join(' ');
      L.push(`• ${esc(line)} — ${esc(i.size)} × ${i.qty} = ${fmt(i.price * i.qty)} ₽`);
    });
    L.push(`<b>Итого:</b> ${fmt(d.cart.total)} ₽`);
  }
  return L.join('\n');
}
const fmt = n => new Intl.NumberFormat('ru-RU').format(Math.round(Number(n) || 0));

function sendTelegram(text) {
  const payload = JSON.stringify({ chat_id: TG_CHAT_ID, text, parse_mode:'HTML', disable_web_page_preview:true });
  return httpsRequest({
    method:'POST',
    hostname:'api.telegram.org',
    path:`/bot${TG_BOT_TOKEN}/sendMessage`,
    headers:{ 'Content-Type':'application/json', 'Content-Length':Buffer.byteLength(payload) },
  }, payload).then(r => {
    const res = JSON.parse(r || '{}');
    if (!res.ok) throw new Error(res.description || 'telegram error');
    return res;
  });
}

/* ============================================================
   Страница товара с Open Graph (превью в Telegram/VK/соцсетях)
   ============================================================ */
function getCatalog() {
  if (cache.data && cache.data.length) return cache.data;
  try { return JSON.parse(fs.readFileSync(path.join(ROOT, 'products.json'), 'utf8')); }
  catch (_) { return []; }
}

function handleProductPage(id, res) {
  fs.readFile(path.join(ROOT, 'product.html'), 'utf8', (err, html) => {
    if (err) return serveStatic('/product.html', res);
    const p = getCatalog().find(x => String(x.id) === String(id));
    if (p) {
      const e = s => String(s == null ? '' : s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
      const title = `${p.brand ? e(p.brand) + ' — ' : ''}${e(p.name)} — Capital Store MSK`;
      const desc = `${e(p.name)} — ${fmt(p.price)} ₽. Оригинал в наличии, проверка подлинности, доставка по России.`;
      const img = e(p.img || '');
      const og = `
    <meta property="og:type" content="product">
    <meta property="og:site_name" content="Capital Store MSK">
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${desc}">
    <meta property="og:image" content="${img}">
    <meta property="product:price:amount" content="${p.price}">
    <meta property="product:price:currency" content="RUB">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${title}">
    <meta name="twitter:description" content="${desc}">
    <meta name="twitter:image" content="${img}">
`;
      html = html.replace('</head>', og + '</head>')
                 .replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`)
                 .replace(/(<meta name="description" content=")[^"]*(">)/, `$1${desc}$2`);
    }
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' });
    res.end(html);
  });
}

/* ============================================================
   Статика
   ============================================================ */
function serveStatic(pathname, res) {
  let rel = decodeURIComponent(pathname);
  if (rel === '/' || rel === '') rel = '/index.html';

  // защита от выхода за корень
  const filePath = path.normalize(path.join(ROOT, rel));
  if (!filePath.startsWith(ROOT)) return json(res, 403, { error:'forbidden' });

  fs.readFile(filePath, (err, buf) => {
    if (err) {
      // нет расширения → пробуем .html; иначе 404
      if (!path.extname(filePath)) return serveStatic(pathname + '.html', res);
      res.writeHead(404, { 'Content-Type':'text/html; charset=utf-8' });
      return res.end('<h1>404</h1><p>Страница не найдена. <a href="/">На главную</a></p>');
    }
    const ext = path.extname(filePath).toLowerCase();
    // html/js/css/json — всегда ревалидировать (свежий код у посетителей);
    // картинки/шрифты — кэшировать надолго
    const longCache = ['.png','.jpg','.jpeg','.webp','.svg','.ico','.woff2'].includes(ext);
    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Cache-Control': longCache ? 'public, max-age=604800' : 'no-cache',
    });
    res.end(buf);
  });
}

/* ============================================================
   Вспомогательные функции
   ============================================================ */
function json(res, code, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(code, { 'Content-Type':'application/json; charset=utf-8' });
  res.end(body);
}

function readBody(req, limit = 1e6) {
  return new Promise((resolve, reject) => {
    let data = '', size = 0;
    req.on('data', c => { size += c.length; if (size > limit) { reject(new Error('too large')); req.destroy(); } else data += c; });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

function httpsGetJSON(url) {
  return httpsRequest(url).then(r => JSON.parse(r));
}

function httpsRequest(options, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, resp => {
      let data = '';
      resp.on('data', c => data += c);
      resp.on('end', () => resolve(data));
    });
    req.on('error', reject);
    req.setTimeout(15000, () => { req.destroy(new Error('timeout')); });
    if (body) req.write(body);
    req.end();
  });
}

// Минимальный парсер .env — без зависимостей.
function loadEnv() {
  try {
    const file = path.join(__dirname, '.env');
    if (!fs.existsSync(file)) return;
    fs.readFileSync(file, 'utf8').split('\n').forEach(line => {
      const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (!m) return;
      let [, k, v = ''] = m;
      v = v.trim().replace(/^['"]|['"]$/g, '');
      if (!(k in process.env)) process.env[k] = v;
    });
  } catch (e) { /* нет .env — не критично */ }
}
