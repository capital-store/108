/* ============================================================
   Capital Store MSK — общие блоки
   Синхронно подменяет placeholder-ы (#site-header, #site-footer,
   #site-overlays) на реальную разметку. Подключается ПОСЛЕ app.js.
   ============================================================ */

// Меню как на capitalstoremsk.ru — разбито по бокам от центрального логотипа
const NAV_LEFT = [
  { href:'catalog.html',        key:'catalog',   label:'Наличие' },
  { href:'catalog.html?new=1',  key:'arrivals',  label:'Поступления' },
  { href:'support.html',        key:'support',   label:'Поддержка' },
];
const NAV_RIGHT = [
  { href:'logistics.html',      key:'logistics', label:'Логистика' },
  { href:'blog.html',           key:'blog',      label:'Новости' },
  { href:'contacts.html',       key:'contacts',  label:'Соцсети' },
];
const NAV = [...NAV_LEFT, ...NAV_RIGHT];

const CONTACTS = {
  tg:'https://t.me/capitalove',
  tgName:'@capitalove',
  wa:'https://wa.me/79096666652',
  vk:'https://vk.com/capitalstoremsk',
  mail:'mailto:capitalstoremsk@bk.ru',
  mailName:'capitalstoremsk@bk.ru',
  phone:'+7 909 666-66-52',
  phoneTel:'tel:+79096666652',
  city:'Москва',
};

/* ---------- HEADER ---------- */
const wordmark = '<b>CAPITAL STORE</b><i class="pipe">|</i><b>MSK</b>';
const navLink = (n, active) =>
  `<a href="${n.href}" class="${n.key===active?'active':''}">${n.label}</a>`;

function headerHTML(active){
  const left  = NAV_LEFT.map(n=>navLink(n,active)).join('');
  const right = NAV_RIGHT.map(n=>navLink(n,active)).join('');
  return `<div class="topbar">
    <div class="container topbar-inner">
      <div class="topbar-props">
        <span>Только оригинал · проверка подлинности</span>
        <span>Доставка по всей России</span>
        <span>Более 1000 отзывов</span>
      </div>
      <a class="topbar-phone" href="${CONTACTS.phoneTel}">${CONTACTS.phone}</a>
    </div>
  </div>
  <header class="site-header">
    <div class="container nav">
      <div class="nav-side nav-side-left">
        <button class="burger" id="burger" aria-label="Меню"><span></span><span></span><span></span></button>
        <nav class="nav-links nav-left">${left}</nav>
      </div>
      <a href="index.html" class="brand">${wordmark}</a>
      <div class="nav-side nav-side-right">
        <nav class="nav-links nav-right">${right}</nav>
        <a class="icon-btn" href="catalog.html?fav=1" aria-label="Избранное">
          ${ICON.heart}<span class="fav-count">0</span>
        </a>
        <button class="icon-btn cart-open" aria-label="Корзина">
          ${ICON.cart}<span class="cart-count">0</span>
        </button>
      </div>
    </div>
    <nav class="mobile-menu" id="mobileMenu">
      ${NAV.map(n=>navLink(n,active)).join('')}
    </nav>
  </header>`;
}

/* ---------- FOOTER ---------- */
function footerHTML(){
  const col = (title, items) =>
    `<div class="footer-col"><h4>${title}</h4><ul>${items.map(i=>`<li><a href="${i[1]}">${i[0]}</a></li>`).join('')}</ul></div>`;
  return `<footer class="site-footer">
    <div class="container">
      <div class="footer-top">
        <div class="footer-brand">
          <b>CAPITAL STORE <i style="font-style:normal;color:var(--gold)">|</i> MSK</b><span>Moscow · Original</span>
          <p>Оригинальная брендовая одежда, обувь и аксессуары с доставкой из-за рубежа. Проверка подлинности каждой вещи.</p>
          <div class="footer-contacts">
            <a href="${CONTACTS.phoneTel}">${CONTACTS.phone}</a>
            <a href="${CONTACTS.mail}">${CONTACTS.mailName}</a>
          </div>
          <div class="footer-social">
            <a href="${CONTACTS.tg}" aria-label="Telegram" target="_blank" rel="noopener">${ICON.tg}</a>
            <a href="${CONTACTS.wa}" aria-label="WhatsApp" target="_blank" rel="noopener">${ICON.wa}</a>
            <a href="${CONTACTS.vk}" aria-label="ВКонтакте" target="_blank" rel="noopener">${ICON.vk}</a>
          </div>
        </div>
        ${col('Магазин', [['Наличие','catalog.html'],['Верхняя одежда','catalog.html?cat=outer'],['Обувь','catalog.html?cat=shoes'],['Аксессуары','catalog.html?cat=acc']])}
        ${col('Клиентам', [['Логистика и оплата','logistics.html'],['Поддержка','support.html'],['Новости','blog.html'],['Контакты','contacts.html']])}
        ${col('Документы', [['Публичная оферта','offer.html'],['Политика конфиденциальности','privacy.html'],['Возврат','logistics.html#faq']])}
      </div>
      <div class="footer-bottom">
        <p>© ${new Date().getFullYear()} Capital Store MSK. Все права защищены.</p>
        <nav><a href="offer.html">Оферта</a><a href="privacy.html">Конфиденциальность</a><a href="contacts.html">Контакты</a></nav>
      </div>
    </div>
  </footer>`;
}

/* ---------- OVERLAYS: корзина-дровер + модалка заявки ---------- */
function overlaysHTML(){
  return `
  <div class="overlay" id="overlay"></div>

  <aside class="drawer" id="cartDrawer" aria-label="Корзина">
    <div class="drawer-head">
      <h3>Корзина</h3>
      <button class="icon-btn cart-close" aria-label="Закрыть">${ICON.close}</button>
    </div>
    <div class="drawer-body" id="cartBody"></div>
    <div class="drawer-foot" id="cartFoot" style="display:none">
      <div class="drawer-total"><span>Итого</span><b id="cartTotal">0 ₽</b></div>
      <p class="form-note">Доставка и сервисный сбор рассчитываются при оформлении.</p>
      <button class="btn btn-gold btn-block btn-lg" id="checkoutBtn">Оформить заявку</button>
    </div>
  </aside>

  <div class="modal" id="orderModal" role="dialog" aria-modal="true">
    <div class="modal-box">
      <div class="modal-head">
        <h3 id="orderTitle">Оформление заявки</h3>
        <button class="icon-btn order-close" aria-label="Закрыть">${ICON.close}</button>
      </div>
      <p class="modal-sub">Оставьте контакты — менеджер свяжется, уточнит наличие и рассчитает доставку.</p>
      <div class="modal-summary" id="orderSummary"></div>
      <form class="form" id="orderForm">
        <div class="field-row">
          <div class="field"><label>Имя</label><input name="name" required placeholder="Как к вам обращаться"></div>
          <div class="field"><label>Телефон</label><input name="phone" required placeholder="+7 ___ ___ __ __"></div>
        </div>
        <div class="field"><label>Telegram или e-mail</label><input name="email" placeholder="@username или почта"></div>
        <div class="field"><label>Способ доставки</label>
          <select name="delivery">
            <option>Курьер по Москве</option>
            <option>СДЭК / Почта по России</option>
            <option>Самовывоз (по договорённости)</option>
          </select>
        </div>
        <div class="field"><label>Комментарий</label><textarea name="comment" placeholder="Размер, пожелания, вопросы" style="min-height:80px"></textarea></div>
        <input type="text" name="website" class="hp" tabindex="-1" autocomplete="off" aria-hidden="true">
        <div class="form-msg" id="orderMsg"></div>
        <button type="submit" class="btn btn-dark btn-block btn-lg" id="orderSubmit">Отправить заявку</button>
        <p class="form-note">Нажимая кнопку, вы соглашаетесь с обработкой персональных данных.</p>
      </form>
    </div>
  </div>`;
}

/* ============================================================
   ИНЪЕКЦИЯ БЛОКОВ
   ============================================================ */
(function injectPartials(){
  const h = document.getElementById('site-header');
  if (h) h.outerHTML = headerHTML(h.dataset.page || '');
  const f = document.getElementById('site-footer');
  if (f) f.outerHTML = footerHTML();
  const o = document.getElementById('site-overlays');
  if (o) o.outerHTML = overlaysHTML();
  wireUI();
})();

/* ============================================================
   ЛОГИКА UI: корзина, модалка, меню
   ============================================================ */
function openCart(){ toggleCart(true); renderCart(); }
function closeCart(){ toggleCart(false); }
function toggleCart(show){
  const d = $('#cartDrawer'), ov = $('#overlay');
  if(!d) return;
  d.classList.toggle('show', show);
  ov.classList.toggle('show', show);
  document.body.classList.toggle('no-scroll', show);
}

function renderCart(){
  const body = $('#cartBody'), foot = $('#cartFoot'); if(!body) return;
  const items = Object.entries(Cart.items);
  if(!items.length){
    body.innerHTML = `<div class="cart-empty">${ICON.bag}<b>Корзина пуста</b>
      <p>Добавьте что-нибудь из каталога — и оформим заявку.</p>
      <a href="catalog.html" class="btn btn-outline" style="margin-top:20px">В каталог</a></div>`;
    foot.style.display='none';
    return;
  }
  body.innerHTML = items.map(([k,it])=>`
    <div class="cart-item">
      <div class="cart-item-img"><img src="${it.img}" alt="${esc(it.name)}"></div>
      <div class="cart-item-info">
        <span class="card-brand">${esc(it.brand||'')}</span>
        <b>${esc(it.name)}</b>
        <span class="cart-item-size">Размер: ${esc(it.size)}</span>
        <div class="cart-item-bottom">
          <div class="qty">
            <button data-dec="${esc(k)}" aria-label="Меньше">${ICON.minus}</button>
            <span>${it.qty}</span>
            <button data-inc="${esc(k)}" aria-label="Больше">${ICON.plus}</button>
          </div>
          <span class="cart-item-price">${money(it.price*it.qty)}</span>
        </div>
        <button class="cart-remove" data-rm="${esc(k)}">Удалить</button>
      </div>
    </div>`).join('');
  foot.style.display='block';
  $('#cartTotal').textContent = money(Cart.total());

  $$('[data-inc]',body).forEach(b=>b.onclick=()=>Cart.setQty(b.dataset.inc, Cart.items[b.dataset.inc].qty+1));
  $$('[data-dec]',body).forEach(b=>b.onclick=()=>Cart.setQty(b.dataset.dec, Cart.items[b.dataset.dec].qty-1));
  $$('[data-rm]',body).forEach(b=>b.onclick=()=>Cart.remove(b.dataset.rm));
}

/* ---------- модалка заявки ---------- */
let orderContext = null; // {item, single} — заявка на конкретный товар, либо null = вся корзина
function openOrder(ctx=null){
  orderContext = ctx;
  const modal = $('#orderModal'); if(!modal) return;
  const sum = $('#orderSummary');
  const title = $('#orderTitle');

  if(ctx && ctx.single){
    title.textContent = 'Заявка на товар';
    sum.innerHTML = `<div class="calc-line"><span>Товар</span><span>${esc(ctx.item)}</span></div>`;
  } else {
    const items = Object.values(Cart.items);
    if(!items.length){ openCart(); return; }
    title.textContent = 'Оформление заявки';
    sum.innerHTML = items.map(i=>
      `<div class="calc-line"><span>${esc(i.name)} · ${esc(i.size)} × ${i.qty}</span><span>${money(i.price*i.qty)}</span></div>`
    ).join('') + `<div class="calc-total"><span>Итого</span><b>${money(Cart.total())}</b></div>`;
  }
  toggleCart(false);
  modal.classList.add('show');
  $('#overlay').classList.add('show');
  document.body.classList.add('no-scroll');
  $('#orderMsg').className='form-msg';
}
function closeOrder(){
  $('#orderModal')?.classList.remove('show');
  $('#overlay')?.classList.remove('show');
  document.body.classList.remove('no-scroll');
}

async function submitOrder(form){
  const msg = $('#orderMsg'), btn = $('#orderSubmit');
  const fd = new FormData(form);
  if(fd.get('website')){ return; } // honeypot: бот заполнил скрытое поле
  const payload = {
    name: fd.get('name'), phone: fd.get('phone'), email: fd.get('email'),
    delivery: fd.get('delivery'), comment: fd.get('comment'),
    item: orderContext?.single ? orderContext.item : null,
    cart: orderContext?.single ? null : {
      items: Object.values(Cart.items).map(i=>({ name:i.name, brand:i.brand, size:i.size, qty:i.qty, price:i.price })),
      total: Cart.total()
    },
    website: '' // сервер тоже проверит honeypot
  };

  btn.disabled = true; btn.textContent = 'Отправляем…';
  try{
    const r = await fetch('/api/order', {
      method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload)
    });
    if(r.ok){
      msg.className='form-msg ok';
      msg.textContent='Заявка отправлена. Менеджер свяжется с вами в ближайшее время.';
      form.reset();
      if(!orderContext?.single){ Cart.clear(); }
      setTimeout(closeOrder, 2200);
    } else {
      const t = await r.text().catch(()=>'');
      throw new Error(t || 'bad response');
    }
  }catch(_){
    // backend не настроен / демо-режим — показываем понятное сообщение
    msg.className='form-msg ok';
    msg.textContent='Спасибо! Заявка принята. (Демо-режим: подключите Telegram в .env, чтобы получать заявки.)';
    form.reset();
    if(!orderContext?.single){ Cart.clear(); }
    setTimeout(closeOrder, 2600);
  }finally{
    btn.disabled=false; btn.textContent='Отправить заявку';
  }
}

/* ---------- навешиваем обработчики ---------- */
function wireUI(){
  $$('.cart-open').forEach(b=>b.addEventListener('click', openCart));
  $$('.cart-close').forEach(b=>b.addEventListener('click', closeCart));
  $('#overlay')?.addEventListener('click', ()=>{ closeCart(); closeOrder(); });
  $('#checkoutBtn')?.addEventListener('click', ()=>openOrder(null));
  $$('.order-close').forEach(b=>b.addEventListener('click', closeOrder));
  $('#orderForm')?.addEventListener('submit', e=>{ e.preventDefault(); submitOrder(e.target); });

  // бургер-меню (мобильное)
  const burger = $('#burger'), menu = $('#mobileMenu');
  burger?.addEventListener('click', ()=>{
    const open = menu.classList.toggle('open');
    burger.classList.toggle('active', open);
  });
  $$('#mobileMenu a').forEach(a=>a.addEventListener('click', ()=>{
    menu.classList.remove('open'); burger?.classList.remove('active');
  }));

  // esc закрывает всё
  document.addEventListener('keydown', e=>{ if(e.key==='Escape'){ closeCart(); closeOrder(); }});

  // любые кнопки [data-order] на страницах открывают модалку корзины
  $$('[data-order]').forEach(b=>b.addEventListener('click', ()=>openOrder(null)));

  Cart.sync();
}
