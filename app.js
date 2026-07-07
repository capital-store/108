/* ============================================================
   Capital Store MSK — фронтенд-логика
   Данные, каталог, корзина, страница товара, калькулятор.
   Без фреймворков. Вызывается после загрузки partials.js.
   ============================================================ */

/* ---------- утилиты ---------- */
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const money = n => new Intl.NumberFormat('ru-RU').format(Math.round(n)) + ' ₽';
const esc = s => String(s).replace(/[&<>"']/g, c =>
  ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
const qs = k => new URLSearchParams(location.search).get(k);

/* ---------- SVG-иконки (без эмодзи) ---------- */
const ICON = {
  cart:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M6 6h15l-1.5 9h-12z"/><circle cx="9" cy="20" r="1.4"/><circle cx="18" cy="20" r="1.4"/><path d="M6 6L5 3H2"/></svg>',
  bag:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 8h12l1 12H5z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>',
  heart:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 20s-7-4.6-9.3-9C1 7.5 3 4.5 6.2 4.5c2 0 3.3 1.3 3.8 2.3.5-1 1.8-2.3 3.8-2.3 3.2 0 5.2 3 3.5 6.5C19 15.4 12 20 12 20z"/></svg>',
  arrow:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  plus:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M12 5v14M5 12h14"/></svg>',
  minus:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M5 12h14"/></svg>',
  close:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  star:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.9 6.3 6.9.7-5.1 4.6 1.4 6.8L12 17.8 5.9 20.4l1.4-6.8L2.2 9l6.9-.7z"/></svg>',
  check:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M20 6L9 17l-5-5"/></svg>',
  shield:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z"/><path d="M9 12l2 2 4-4"/></svg>',
  truck:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 6h11v9H3z"/><path d="M14 9h4l3 3v3h-7z"/><circle cx="7" cy="18" r="1.6"/><circle cx="17" cy="18" r="1.6"/></svg>',
  globe:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.5 2.5 15 0 18M12 3c-2.5 2.5-2.5 15 0 18"/></svg>',
  tag:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 4h7l9 9-7 7-9-9z"/><circle cx="8.5" cy="8.5" r="1.4"/></svg>',
  clock:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  chat:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 5h16v11H9l-5 4z"/></svg>',
  ruler:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 8l5-5 13 13-5 5z"/><path d="M8 8l1.5 1.5M11 5l1.5 1.5M14 8l1.5 1.5"/></svg>',
  box:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><path d="M4 7.5l8 4.5 8-4.5M12 12v9"/></svg>',
  tg:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M21.9 4.3l-3.3 15.6c-.2 1.1-.9 1.4-1.9.9l-5-3.7-2.4 2.3c-.3.3-.5.5-1 .5l.3-5 9.1-8.2c.4-.4-.1-.6-.6-.2L6.1 13.3l-4.8-1.5c-1-.3-1-1 .2-1.5L20.6 3c.9-.3 1.6.2 1.3 1.3z"/></svg>',
  wa:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.5 15.2L2 22l4.9-1.5A10 10 0 1 0 12 2zm0 18a8 8 0 0 1-4.1-1.1l-.3-.2-2.9.9.9-2.8-.2-.3A8 8 0 1 1 12 20zm4.4-5.9c-.2-.1-1.4-.7-1.6-.8s-.4-.1-.5.1-.6.8-.8 1-.3.2-.5.1a6.5 6.5 0 0 1-3.2-2.8c-.2-.4.2-.4.6-1.2.1-.2 0-.3 0-.5s-.5-1.3-.7-1.7-.4-.4-.5-.4h-.5a1 1 0 0 0-.7.3c-.3.3-.9.9-.9 2.1s.9 2.5 1.1 2.6a9.4 9.4 0 0 0 3.6 3.2c1.3.5 1.8.6 2.4.5.4 0 1.4-.5 1.6-1.1s.2-1 .1-1.1z"/></svg>',
  mail:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 6h18v12H3z"/><path d="M3 7l9 6 9-6"/></svg>',
  pin:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 21s7-5.6 7-11a7 7 0 0 0-14 0c0 5.4 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>',
  phone:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6.5 3.5c.6 0 1 .4 1.2 1l.9 3c.2.6 0 1.2-.5 1.6l-1.3 1a12 12 0 0 0 5.6 5.6l1-1.3c.4-.5 1-.7 1.6-.5l3 .9c.6.2 1 .6 1 1.2v3c0 .8-.7 1.5-1.5 1.4A16.5 16.5 0 0 1 5.1 5C5 4.2 5.7 3.5 6.5 3.5z"/></svg>',
  ig:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>',
  vk:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12.9 16.6c-5.4 0-8.8-3.8-8.9-10h2.8c.1 4.6 2.2 6.5 3.7 6.9V6.6h2.6v3.9c1.5-.2 3.1-1.8 3.7-3.9h2.5c-.5 2.6-2.1 4.2-3.3 4.9 1.2.5 3 2 3.8 5h-2.8c-.5-1.9-2-3.4-3.9-3.6v3.6h-.9z"/></svg>',
};

/* ============================================================
   ДЕМО-КАТАЛОГ (fallback, если backend недоступен)
   ============================================================ */
const IMG = (seed, w = 700, h = 875) => `https://images.unsplash.com/${seed}?auto=format&fit=crop&w=${w}&h=${h}&q=80`;

const FALLBACK_PRODUCTS = [
  { id:'p1', name:'Пуховик с капюшоном', brand:'Moncler', price:189000, old:219000, cat:'outer', tag:'Хит',
    img:IMG('photo-1544923246-77307dd654cb'), images:[IMG('photo-1544923246-77307dd654cb'),IMG('photo-1591047139829-d91aecb6caea'),IMG('photo-1520975916090-3105956dac38')],
    desc:'Тёплый пуховик из водоотталкивающего нейлона с натуральным пуховым наполнителем. Оригинал с проверкой подлинности.', sizes:['S','M','L','XL'] },
  { id:'p2', name:'Кожаная куртка-бомбер', brand:'Saint Laurent', price:265000, old:0, cat:'outer', tag:'Новинка',
    img:IMG('photo-1551028719-00167b16eac5'), images:[IMG('photo-1551028719-00167b16eac5'),IMG('photo-1520975916090-3105956dac38')],
    desc:'Бомбер из натуральной кожи ягнёнка, зауженный силуэт, фурнитура под серебро.', sizes:['S','M','L'] },
  { id:'p3', name:'Худи с логотипом', brand:'Balenciaga', price:78000, old:92000, cat:'hoodie', tag:'Sale',
    img:IMG('photo-1556821840-3a63f95609a7'), images:[IMG('photo-1556821840-3a63f95609a7'),IMG('photo-1620799140408-edc6dcb6d633')],
    desc:'Oversize-худи из плотного футера с вышитым логотипом. Унисекс.', sizes:['XS','S','M','L','XL'] },
  { id:'p4', name:'Классические кроссовки', brand:'Common Projects', price:63000, old:0, cat:'shoes', tag:'',
    img:IMG('photo-1595950653106-6c9ebd614d3a'), images:[IMG('photo-1595950653106-6c9ebd614d3a'),IMG('photo-1600185365483-26d7a4cc7519')],
    desc:'Минималистичные кожаные кроссовки ручной работы, Италия. Золотое тиснение размера.', sizes:['40','41','42','43','44'] },
  { id:'p5', name:'Сумка-тоут', brand:'Bottega Veneta', price:245000, old:0, cat:'bags', tag:'Новинка',
    img:IMG('photo-1584917865442-de89df76afd3'), images:[IMG('photo-1584917865442-de89df76afd3'),IMG('photo-1594223274512-ad4803739b7c')],
    desc:'Кожаная сумка с фирменным плетением intrecciato. Съёмный ремень.', sizes:['One size'] },
  { id:'p6', name:'Футболка из хлопка пима', brand:'Brunello Cucinelli', price:34000, old:0, cat:'tshirt', tag:'',
    img:IMG('photo-1521572163474-6864f9cf17ab'), images:[IMG('photo-1521572163474-6864f9cf17ab')],
    desc:'Базовая футболка из мягкого хлопка пима премиального качества.', sizes:['S','M','L','XL'] },
  { id:'p7', name:'Кашемировый свитшот', brand:'Loro Piana', price:118000, old:0, cat:'hoodie', tag:'Хит',
    img:IMG('photo-1620799140408-edc6dcb6d633'), images:[IMG('photo-1620799140408-edc6dcb6d633'),IMG('photo-1556821840-3a63f95609a7')],
    desc:'Свитшот из чистого кашемира, лаконичный крой. Ощущение как вторая кожа.', sizes:['S','M','L'] },
  { id:'p8', name:'Брюки-карго', brand:'Stone Island', price:56000, old:69000, cat:'pants', tag:'Sale',
    img:IMG('photo-1624378439575-d8705ad7ae80'), images:[IMG('photo-1624378439575-d8705ad7ae80')],
    desc:'Технологичные брюки-карго с фирменной нашивкой. Прочная ткань.', sizes:['46','48','50','52'] },
  { id:'p9', name:'Солнцезащитные очки', brand:'Gucci', price:42000, old:0, cat:'acc', tag:'',
    img:IMG('photo-1511499767150-a48a237f0083'), images:[IMG('photo-1511499767150-a48a237f0083')],
    desc:'Очки в ацетатной оправе с фирменной фурнитурой. Футляр в комплекте.', sizes:['One size'] },
  { id:'p10', name:'Шерстяное пальто', brand:'Max Mara', price:156000, old:0, cat:'outer', tag:'Новинка',
    img:IMG('photo-1539533018447-63fcce2678e3'), images:[IMG('photo-1539533018447-63fcce2678e3')],
    desc:'Классическое пальто из верблюжьей шерсти, силуэт oversize.', sizes:['XS','S','M','L'] },
  { id:'p11', name:'Кожаный ремень', brand:'Hermès', price:64000, old:0, cat:'acc', tag:'',
    img:IMG('photo-1553062407-98eeb64c6a62'), images:[IMG('photo-1553062407-98eeb64c6a62')],
    desc:'Двусторонний ремень из телячьей кожи с фирменной пряжкой.', sizes:['85','90','95','100'] },
  { id:'p12', name:'Джинсы прямого кроя', brand:'Amiri', price:87000, old:0, cat:'pants', tag:'Хит',
    img:IMG('photo-1542272604-787c3835535d'), images:[IMG('photo-1542272604-787c3835535d')],
    desc:'Премиальный японский деним, ручная обработка. Прямой силуэт.', sizes:['30','32','34','36'] },
];

const CATEGORIES = {
  all:'Все', outer:'Верхняя одежда', pants:'Брюки и шорты', hoodie:'Худи и свитшоты',
  tshirt:'Футболки', bags:'Рюкзаки и сумки', shoes:'Обувь', acc:'Аксессуары'
};

/* ---------- загрузка товаров ---------- */
let PRODUCTS = [];
async function loadProducts() {
  if (PRODUCTS.length) return PRODUCTS;
  // 1) живой бэкенд (VK через сервер)
  try {
    const r = await fetch('/api/products');
    if (r.ok) {
      const data = await r.json();
      if (Array.isArray(data) && data.length) { PRODUCTS = data; return PRODUCTS; }
    }
  } catch (_) { /* backend недоступен */ }
  // 2) снапшот реального каталога VK (для статик-хостинга/превью)
  try {
    const r = await fetch('products.json');
    if (r.ok) {
      const data = await r.json();
      if (Array.isArray(data) && data.length) { PRODUCTS = data; return PRODUCTS; }
    }
  } catch (_) { /* нет снапшота */ }
  // 3) демо-каталог
  PRODUCTS = FALLBACK_PRODUCTS;
  return PRODUCTS;
}
const findProduct = id => PRODUCTS.find(p => String(p.id) === String(id));

/* ============================================================
   КОРЗИНА (localStorage, ключ capital_cart)
   Разные размеры одного товара — отдельные строки (id::size)
   ============================================================ */
const Cart = {
  key:'capital_cart',
  items:{},
  load(){ try{ this.items = JSON.parse(localStorage.getItem(this.key)) || {}; }catch(_){ this.items={}; } },
  save(){ localStorage.setItem(this.key, JSON.stringify(this.items)); this.sync(); },
  add(product, size='One size', qty=1){
    const k = `${product.id}::${size}`;
    if (this.items[k]) this.items[k].qty += qty;
    else this.items[k] = { id:product.id, name:product.name, brand:product.brand,
      price:product.price, img:product.img, size, qty };
    this.save(); openCart();
  },
  setQty(k, q){ if(!this.items[k]) return; this.items[k].qty = q; if(q<=0) delete this.items[k]; this.save(); renderCart(); },
  remove(k){ delete this.items[k]; this.save(); renderCart(); },
  clear(){ this.items={}; this.save(); renderCart(); },
  count(){ return Object.values(this.items).reduce((s,i)=>s+i.qty,0); },
  total(){ return Object.values(this.items).reduce((s,i)=>s+i.price*i.qty,0); },
  sync(){
    const c = this.count();
    $$('.cart-count').forEach(el=>{ el.textContent=c; el.classList.toggle('show', c>0); });
  }
};

/* ============================================================
   ИЗБРАННОЕ (localStorage, ключ capital_favs) — множество id
   ============================================================ */
const Favs = {
  key:'capital_favs',
  ids:new Set(),
  load(){ try{ this.ids = new Set(JSON.parse(localStorage.getItem(this.key)) || []); }catch(_){ this.ids=new Set(); } },
  save(){ localStorage.setItem(this.key, JSON.stringify([...this.ids])); this.sync(); },
  has(id){ return this.ids.has(String(id)); },
  toggle(id){ id=String(id); this.ids.has(id) ? this.ids.delete(id) : this.ids.add(id); this.save(); },
  count(){ return this.ids.size; },
  sync(){
    const c = this.count();
    $$('.fav-count').forEach(el=>{ el.textContent=c; el.classList.toggle('show', c>0); });
    $$('[data-fav]').forEach(b=>b.classList.toggle('active', this.has(b.dataset.fav)));
  }
};

/* ============================================================
   РЕНДЕР: карточка товара
   ============================================================ */
function cardHTML(p){
  const tagCls = /sale|скид/i.test(p.tag) ? 'card-tag sale' : 'card-tag';
  const oldHTML = p.old ? `<span class="price-old">${money(p.old)}</span>` : '';
  return `<article class="card">
    <div class="card-media">
      ${p.tag ? `<span class="${tagCls}">${esc(p.tag)}</span>` : ''}
      <button class="card-fav ${Favs.has(p.id)?'active':''}" data-fav="${esc(p.id)}" aria-label="В избранное">${ICON.heart}</button>
      <a href="product.html?id=${encodeURIComponent(p.id)}"><img src="${p.img}" alt="${esc(p.name)}" loading="lazy"></a>
      <div class="card-quick">
        <button class="btn btn-dark btn-block" data-add="${esc(p.id)}">${ICON.bag}<span>В корзину</span></button>
      </div>
    </div>
    <div class="card-body">
      <span class="card-brand">${esc(p.brand||'Capital')}</span>
      <h3 class="card-name"><a href="product.html?id=${encodeURIComponent(p.id)}">${esc(p.name)}</a></h3>
      <div class="card-foot"><span class="price">${money(p.price)}</span>${oldHTML}</div>
    </div>
  </article>`;
}

function bindAddButtons(root=document){
  $$('[data-add]', root).forEach(btn=>{
    if (btn._bound) return; btn._bound = true;
    btn.addEventListener('click', ()=>{
      const p = findProduct(btn.dataset.add);
      if (p) Cart.add(p, (p.sizes && p.sizes[0]) || 'One size');
    });
  });
  $$('[data-fav]', root).forEach(btn=>{
    if (btn._boundFav) return; btn._boundFav = true;
    btn.addEventListener('click', e=>{
      e.preventDefault();
      Favs.toggle(btn.dataset.fav);
      btn.classList.toggle('active', Favs.has(btn.dataset.fav));
    });
  });
}

/* ============================================================
   КАТАЛОG (catalog.html)
   ============================================================ */
async function renderCatalog(gridSel, chipsSel){
  const grid = $(gridSel); if(!grid) return;
  grid.innerHTML = '<p style="color:var(--muted)">Загружаем каталог…</p>';
  await loadProducts();

  let filter   = qs('cat') || 'all';
  let search   = qs('q') || '';
  let brand    = qs('brand') || 'all';
  let size     = qs('size') || 'all';
  let sort     = qs('sort') || 'default';
  const onlyNew = qs('new');   // «Поступления» — свежие позиции
  const onlyFav = qs('fav');   // «Избранное»

  // источник: избранное / поступления / весь каталог
  const base = () => {
    if(onlyFav) return PRODUCTS.filter(p=>Favs.has(p.id));
    if(onlyNew) return PRODUCTS.slice(0, 40);
    return PRODUCTS;
  };

  // заголовок страницы под режим
  const h = $('.page-hero h1'), sub = $('.page-hero p');
  if(onlyFav){
    if(h) h.textContent = 'Избранное';
    if(sub) sub.textContent = 'Отложенные вами товары. Хранятся в этом браузере.';
    document.title = 'Избранное — Capital Store MSK';
  } else if(onlyNew){
    if(h) h.textContent = 'Поступления';
    if(sub) sub.textContent = 'Свежие новинки — то, что приехало недавно.';
    document.title = 'Поступления — Capital Store MSK';
    $$('.site-header a, #mobileMenu a').forEach(a=>{
      a.classList.toggle('active', (a.getAttribute('href')||'').includes('new=1'));
    });
  }

  // заполняем список брендов из каталога
  const brandSel = $('#brand-filter');
  if(brandSel && brandSel.options.length<=1){
    const brands = [...new Set(PRODUCTS.map(p=>p.brand).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'ru'));
    brands.forEach(b=>{ const o=document.createElement('option'); o.value=b; o.textContent=b; brandSel.appendChild(o); });
  }

  // фильтр размеров — только когда выбрана категория; размеры берём из этой категории
  const sizeSel = $('#size-filter');
  const refreshSizeFilter = () => {
    if(!sizeSel) return;
    const cats = filter==='all' ? [] :
      sortSizes([...new Set(base().filter(p=>p.cat===filter).flatMap(p=>p.sizes||[]))]);
    if(cats.length){
      sizeSel.innerHTML = '<option value="all">Все размеры</option>' +
        cats.map(s=>`<option value="${esc(s)}">${esc(s)}</option>`).join('');
      if(!cats.includes(size)) size='all';
      sizeSel.value = size;
      sizeSel.hidden = false;
    } else {
      size='all'; sizeSel.hidden = true;
    }
  };

  const applySort = list => {
    const l = list.slice();
    if(sort==='price-asc')  l.sort((a,b)=>a.price-b.price);
    if(sort==='price-desc') l.sort((a,b)=>b.price-a.price);
    return l; // 'default' — как пришло из VK (от новых к старым)
  };

  const draw = () => {
    let list = base();
    if(filter!=='all') list = list.filter(p=>p.cat===filter);
    if(brand!=='all')  list = list.filter(p=>p.brand===brand);
    if(size!=='all')   list = list.filter(p=>(p.sizes||[]).includes(size));
    if(search){
      const q = search.toLowerCase();
      list = list.filter(p=>(p.name+' '+(p.brand||'')).toLowerCase().includes(q));
    }
    list = applySort(list);

    const cnt = $('#result-count');
    if(cnt) cnt.textContent = list.length ? `${list.length} ${plural(list.length,'товар','товара','товаров')}` : '';

    grid.innerHTML = list.length
      ? list.map(cardHTML).join('')
      : `<p style="color:var(--muted);grid-column:1/-1">${onlyFav?'В избранном пока пусто. Нажимайте на сердечко у товаров.':'Ничего не найдено. Измените фильтры или запрос.'}</p>`;
    bindAddButtons(grid);
    revealScan(grid);
  };

  // синхронизируем адресную строку
  const syncURL = () => {
    const q = new URLSearchParams();
    if(filter!=='all') q.set('cat', filter);
    if(brand!=='all')  q.set('brand', brand);
    if(size!=='all')   q.set('size', size);
    if(search)         q.set('q', search);
    if(sort!=='default') q.set('sort', sort);
    if(onlyNew) q.set('new','1');
    if(onlyFav) q.set('fav','1');
    history.replaceState(null,'', 'catalog.html'+(q.toString()?`?${q}`:''));
  };

  // чипсы категорий
  const chips = $(chipsSel);
  if (chips){
    $$('.chip', chips).forEach(ch=>{
      ch.classList.toggle('active', ch.dataset.filter===filter);
      ch.addEventListener('click', ()=>{
        filter = ch.dataset.filter;
        size = 'all';                       // сброс размера при смене категории
        $$('.chip', chips).forEach(c=>c.classList.remove('active'));
        ch.classList.add('active');
        refreshSizeFilter();
        syncURL(); draw();
      });
    });
  }

  // поиск
  const searchInput = $('#search');
  if(searchInput){
    searchInput.value = search;
    let t; searchInput.addEventListener('input', ()=>{
      clearTimeout(t);
      t = setTimeout(()=>{ search = searchInput.value.trim(); syncURL(); draw(); }, 200);
    });
  }
  // бренд
  if(brandSel){
    brandSel.value = brand;
    brandSel.addEventListener('change', ()=>{ brand = brandSel.value; syncURL(); draw(); });
  }
  // сортировка
  const sortSel = $('#sort');
  if(sortSel){
    sortSel.value = sort;
    sortSel.addEventListener('change', ()=>{ sort = sortSel.value; syncURL(); draw(); });
  }
  // размер
  if(sizeSel){
    sizeSel.addEventListener('change', ()=>{ size = sizeSel.value; syncURL(); draw(); });
  }

  refreshSizeFilter();   // если зашли сразу в категорию — показать размеры
  draw();
}

// склонение числительных: 1 товар, 2 товара, 5 товаров
function plural(n, one, few, many){
  const m10=n%10, m100=n%100;
  if(m10===1 && m100!==11) return one;
  if(m10>=2 && m10<=4 && (m100<10||m100>=20)) return few;
  return many;
}

// сортировка размеров: буквы по шкале, потом числа по возрастанию
const SIZE_RANK = {XS:0,S:1,M:2,L:3,XL:4,XXL:5,XXXL:6,OS:7};
function sortSizes(arr){
  return arr.slice().sort((a,b)=>{
    const ra = a in SIZE_RANK ? [0,SIZE_RANK[a]] : [1,parseFloat(a)||99];
    const rb = b in SIZE_RANK ? [0,SIZE_RANK[b]] : [1,parseFloat(b)||99];
    return ra[0]-rb[0] || ra[1]-rb[1];
  });
}

/* ============================================================
   ХИТЫ на главной
   ============================================================ */
async function renderHits(sel, limit=8){
  const grid = $(sel); if(!grid) return;
  await loadProducts();
  const hits = PRODUCTS.filter(p=>/хит|new|нов/i.test(p.tag)).concat(PRODUCTS);
  grid.innerHTML = hits.slice(0,limit).map(cardHTML).join('');
  bindAddButtons(grid);
  revealScan(grid);
}

/* ============================================================
   СТРАНИЦА ТОВАРА (product.html)
   ============================================================ */
async function renderProduct(sel){
  const root = $(sel); if(!root) return;
  await loadProducts();
  const p = findProduct(qs('id')) || PRODUCTS[0];
  if(!p){ root.innerHTML='<p>Товар не найден.</p>'; return; }

  const imgs = (p.images && p.images.length ? p.images : [p.img]);
  let size = (p.sizes && p.sizes[0]) || 'One size';

  root.innerHTML = `
    <nav class="breadcrumb">
      <a href="index.html">Главная</a><span>/</span>
      <a href="catalog.html?cat=${p.cat}">${esc(CATEGORIES[p.cat]||'Каталог')}</a><span>/</span>
      <a href="catalog.html">${esc(p.name)}</a>
    </nav>
    <div class="product">
      <div class="gallery">
        <div class="gallery-main"><img id="pmain" src="${imgs[0]}" alt="${esc(p.name)}"></div>
        ${imgs.length>1 ? `<div class="gallery-thumbs">${imgs.map((im,i)=>
          `<button class="${i===0?'active':''}" data-img="${im}"><img src="${im}" alt=""></button>`).join('')}</div>` : ''}
      </div>
      <div class="product-info">
        <span class="card-brand">${esc(p.brand||'Capital')}</span>
        <h1>${esc(p.name)}</h1>
        <div class="product-price">
          <span class="price">${money(p.price)}</span>
          ${p.old?`<span class="price-old">${money(p.old)}</span>`:''}
        </div>
        ${p.old?`<span class="product-badge">Выгода ${money(p.old-p.price)}</span>`:''}
        <p class="product-desc">${esc(p.desc||'Оригинал с проверкой подлинности. В наличии в Москве — отправим сразу.')}</p>
        <div class="size-head"><b>Размер</b><button type="button" id="sizeChartBtn">Таблица размеров</button></div>
        <div class="sizes" id="sizes">
          ${(p.sizes||['One size']).map((s,i)=>`<button class="size ${i===0?'active':''}" data-size="${esc(s)}">${esc(s)}</button>`).join('')}
        </div>
        <div class="product-actions">
          <button class="btn btn-dark btn-lg" id="addBtn">${ICON.bag}<span>Добавить в корзину</span></button>
          <button class="btn btn-outline btn-lg" id="orderBtn">Оставить заявку</button>
          <button class="btn btn-light btn-lg icon-only ${Favs.has(p.id)?'active':''}" id="favBtn" aria-label="В избранное">${ICON.heart}</button>
        </div>
        <ul class="product-meta">
          <li>${ICON.shield}<span>100% оригинал — проверка подлинности перед отправкой</span></li>
          <li>${ICON.box}<span>В наличии в Москве — отправка в день заказа</span></li>
          <li>${ICON.truck}<span>Доставка по Москве и всей России</span></li>
        </ul>
      </div>
    </div>`;

  // галерея
  $$('.gallery-thumbs button', root).forEach(b=>b.addEventListener('click',()=>{
    $('#pmain').src = b.dataset.img;
    $$('.gallery-thumbs button', root).forEach(x=>x.classList.remove('active'));
    b.classList.add('active');
  }));
  // размеры
  $$('#sizes .size', root).forEach(b=>b.addEventListener('click',()=>{
    size = b.dataset.size;
    $$('#sizes .size', root).forEach(x=>x.classList.remove('active'));
    b.classList.add('active');
  }));
  // действия
  $('#addBtn').addEventListener('click', ()=>Cart.add(p, size));
  $('#orderBtn').addEventListener('click', ()=>openOrder({ item:`${p.brand} — ${p.name} (${size})`, single:true }));
  const favBtn = $('#favBtn');
  favBtn.addEventListener('click', ()=>{ Favs.toggle(p.id); favBtn.classList.toggle('active', Favs.has(p.id)); });
  $('#sizeChartBtn').addEventListener('click', ()=>openSizeChart(p.cat));

  document.title = `${p.name} — Capital Store MSK`;
}

/* ============================================================
   РАЗМЕРНАЯ СЕТКА (модалка на странице товара)
   ============================================================ */
const SIZE_CHARTS = {
  clothing:{ title:'Одежда', head:['RU','INT','Обхват груди, см'], rows:[
    ['44','XS','86–89'],['46','S','90–93'],['48','M','94–98'],['50','L','99–103'],
    ['52','XL','104–108'],['54','XXL','109–114'],['56','XXXL','115–120'] ]},
  shoes:{ title:'Обувь', head:['EU','US','RU','Длина стопы, см'], rows:[
    ['40','7','39','25.0'],['41','8','40','25.5'],['42','8.5','41','26.5'],['43','9.5','42','27.5'],
    ['44','10','43','28.0'],['45','11','44','29.0'],['46','12','45','29.5'] ]},
  pants:{ title:'Брюки (талия)', head:['RU','INT','Обхват талии, см'], rows:[
    ['44','W29','73–75'],['46','W30','76–79'],['48','W32','80–84'],['50','W33','85–89'],
    ['52','W34','90–94'],['54','W36','95–100'] ]},
};
function chartsFor(cat){
  if(cat==='shoes')  return ['shoes'];
  if(cat==='pants')  return ['pants','clothing'];
  if(['outer','hoodie','tshirt'].includes(cat)) return ['clothing'];
  return [];  // сумки/аксессуары — сетка не нужна
}
function openSizeChart(cat){
  let m = $('#sizeModal');
  if(!m){
    m = document.createElement('div');
    m.className = 'modal'; m.id = 'sizeModal';
    document.body.appendChild(m);
  }
  const keys = chartsFor(cat);
  const tables = keys.length ? keys.map(k=>{
    const c = SIZE_CHARTS[k];
    return `<h4 class="chart-title">${c.title}</h4>
      <div class="chart-wrap"><table class="size-chart">
        <thead><tr>${c.head.map(h=>`<th>${h}</th>`).join('')}</tr></thead>
        <tbody>${c.rows.map(r=>`<tr>${r.map(x=>`<td>${x}</td>`).join('')}</tr>`).join('')}</tbody>
      </table></div>`;
  }).join('') : '<p style="color:var(--muted)">Для этой категории размер универсальный. Уточните детали у менеджера — поможем подобрать.</p>';

  m.innerHTML = `<div class="modal-box">
    <div class="modal-head">
      <h3>Таблица размеров</h3>
      <button class="icon-btn" id="sizeClose" aria-label="Закрыть">${ICON.close}</button>
    </div>
    <p class="modal-sub">Ориентир для подбора. Замеры могут отличаться на 1–2 см в зависимости от бренда — при сомнениях напишите нам.</p>
    ${tables}
    <a href="support.html" class="btn btn-outline btn-block" style="margin-top:22px">Помочь с размером</a>
  </div>`;

  const close = ()=>{ m.classList.remove('show'); document.body.classList.remove('no-scroll'); };
  $('#sizeClose', m).addEventListener('click', close);
  m.addEventListener('click', e=>{ if(e.target===m) close(); });
  document.addEventListener('keydown', e=>{ if(e.key==='Escape') close(); }, { once:true });
  requestAnimationFrame(()=>{ m.classList.add('show'); document.body.classList.add('no-scroll'); });
}

/* ============================================================
   КАЛЬКУЛЯТОР ДОСТАВКИ (logistics.html)
   Оценка ориентировочная — формулы держим тут же.
   ============================================================ */
const SHIP_RATES = {
  eu:{ label:'Европа', base:2500, perKg:900 },
  asia:{ label:'Азия', base:1900, perKg:750 },
  usa:{ label:'США', base:3200, perKg:1100 },
};
// курсы валют к рублю (ориентировочные, легко поправить)
const FX = { RUB:1, USD:90, EUR:100, CNY:13 };
function renderCalc(){
  const form = $('#calc'); if(!form) return;
  const out = {
    goods: $('#r-goods'), ship: $('#r-ship'), fee: $('#r-fee'), total: $('#r-total')
  };
  const recalc = () => {
    const raw = Math.max(0, +$('#c-price').value || 0);
    const cur = ($('#c-currency') && $('#c-currency').value) || 'RUB';
    const price = Math.round(raw * (FX[cur] || 1));   // цена товара в рублях
    const weight = Math.max(0.3, +$('#c-weight').value || 1);
    const region = $('#c-region').value;
    const r = SHIP_RATES[region] || SHIP_RATES.eu;
    const ship = Math.round(r.base + r.perKg * weight);
    const fee = Math.round(price * 0.1);              // сервисный сбор 10%
    const total = price + ship + fee;
    out.goods.textContent = money(price);
    out.ship.textContent  = money(ship);
    out.fee.textContent   = money(fee);
    out.total.textContent = money(total);
  };
  ['#c-price','#c-currency','#c-weight','#c-region'].forEach(s=>{
    const el=$(s); if(el){ el.addEventListener('input',recalc); el.addEventListener('change',recalc); }
  });
  recalc();
}

/* ============================================================
   REVEAL при скролле
   ============================================================ */
let _io;
function revealScan(root=document){
  if(!_io){
    _io = new IntersectionObserver(es=>es.forEach(e=>{
      if(e.isIntersecting){ e.target.classList.add('in'); _io.unobserve(e.target); }
    }), { threshold:.12 });
  }
  // авто-помечаем карточки/фичи внутри контейнера
  $$('.card, .feature, .review, .post, .tariff', root).forEach((el,i)=>{
    if(!el.hasAttribute('data-reveal')){
      el.setAttribute('data-reveal','');
      el.setAttribute('data-reveal-delay', String(i%4));
    }
  });
  $$('[data-reveal]', root).forEach(el=>{ if(!el.classList.contains('in')) _io.observe(el); });
}

/* ============================================================
   INIT
   ============================================================ */
document.addEventListener('DOMContentLoaded', ()=>{
  Cart.load();
  Cart.sync();
  Favs.load();
  Favs.sync();
  renderCalc();
  revealScan();

  // FAQ-аккордеон
  $$('.faq-item').forEach(item=>{
    const q = $('.faq-q', item), a = $('.faq-a', item);
    if(!q||!a) return;
    q.addEventListener('click', ()=>{
      const open = item.classList.toggle('open');
      a.style.maxHeight = open ? a.scrollHeight+'px' : 0;
      $$('.faq-item').forEach(o=>{ if(o!==item){ o.classList.remove('open'); const oa=$('.faq-a',o); if(oa) oa.style.maxHeight=0; }});
    });
  });

  // подписка / простые формы «спасибо»
  $$('[data-thanks]').forEach(f=>f.addEventListener('submit', e=>{
    e.preventDefault();
    const msg = $('.form-msg', f) || $('.form-msg', f.parentElement);
    if(msg){ msg.className='form-msg ok'; msg.textContent='Готово! Мы на связи — скоро напишем.'; }
    f.reset();
  }));
});
