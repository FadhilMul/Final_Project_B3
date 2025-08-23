const formatIDR = (num) => {
  try{
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
  }catch(e){
    return 'Rp' + (num||0).toLocaleString('id-ID');
  }
};

const $ = (sel, root=document) => root.querySelector(sel);
const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

const CART_KEY = 'mulmart_cart';
const loadCart = () => JSON.parse(localStorage.getItem(CART_KEY) || '[]');
const saveCart = (items) => localStorage.setItem(CART_KEY, JSON.stringify(items));

function addToCart(item, qty=1){
  const cart = loadCart();
  const found = cart.find(x=>x.id===item.id);
  if(found){ found.qty += qty; } else { cart.push({...item, qty}); }
  saveCart(cart); renderCart(); 
}

function changeQty(id, delta){
  const cart = loadCart();
  const found = cart.find(x=>x.id===id);
  if(!found) return;
  found.qty += delta;
  if(found.qty<=0){ cart.splice(cart.indexOf(found),1); }
  saveCart(cart); renderCart();
}

function removeItem(id){
  const cart = loadCart().filter(x=>x.id!==id);
  saveCart(cart); renderCart();
}

function calcSubtotal(){
  return loadCart().reduce((sum, it)=> sum + (it.price * it.qty), 0);
}

function renderCart(){
  const items = loadCart();
  const wrap = $('#cart-items');
  const count = items.reduce((n,i)=>n+i.qty,0);
  const countEl = $('#cart-count');
  if(countEl) countEl.textContent = count;
  if(!wrap) return;
  wrap.innerHTML = items.map(it=>`
    <div class="cart-item">
      <img src="${it.img}" alt="${it.name}">
      <div>
        <div style="font-size:14px">${it.name}</div>
        <div style="font-size:13px;color:#666">${formatIDR(it.price)}</div>
      </div>
      <div class="cart-qty">
        <button data-act="minus" data-id="${it.id}">-</button>
        <span>${it.qty}</span>
        <button data-act="plus" data-id="${it.id}">+</button>
      </div>
      <button class="cart-remove" title="Remove" data-act="remove" data-id="${it.id}">✕</button>
    </div>
  `).join('');
  $('#cart-subtotal') && ($('#cart-subtotal').textContent = formatIDR(calcSubtotal()));
}

function bindDrawer(){
  const drawer = $('#cart-drawer'); if(!drawer) return;
  const backdrop = $('#cart-backdrop');
  const openers = $$('.cart-toggle');
  openers.forEach(el=>el.addEventListener('click', e=>{ e.preventDefault(); drawer.classList.add('open'); backdrop.classList.add('show'); }));
  $('#cart-close')?.addEventListener('click', ()=>{ drawer.classList.remove('open'); backdrop.classList.remove('show'); });
  backdrop?.addEventListener('click', ()=>{ drawer.classList.remove('open'); backdrop.classList.remove('show'); });
  // qty handlers in drawer
  $('#cart-items')?.addEventListener('click', (e)=>{
    const btn = e.target.closest('button');
    if(!btn) return;
    const id = btn.getAttribute('data-id');
    const act = btn.getAttribute('data-act');
    if(act==='minus') changeQty(id,-1);
    if(act==='plus') changeQty(id,1);
    if(act==='remove') removeItem(id);
  });
}

function bindSearch(){
  const input = $('#search-input'); if(!input) return;
  const clear = $('#clear-search');
  const list = $$('#product-list .product-card');
  const filter = () => {
    const q = input.value.trim().toLowerCase();
    list.forEach(card => {
      const name = card.querySelector('h3').textContent.toLowerCase();
      card.style.display = name.includes(q) ? '' : 'none';
    });
  };
  input.addEventListener('input', filter);
  clear?.addEventListener('click', ()=>{ input.value=''; filter(); input.focus(); });
}

function bindCategoryFilter(){
  const container = $('#category-list'); if(!container) return;
  container.addEventListener('click', (e)=>{
    const btn = e.target.closest('.category-item'); if(!btn) return;
    $$('.category-item', container).forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    const cat = btn.dataset.category;
    const cards = $$('#product-list .product-card');
    cards.forEach(c=>{
      const show = cat==='all' || c.dataset.category===cat;
      c.style.display = show ? '' : 'none';
    });
  });
}

function bindCardAddButtons(){
  $$('#product-list .btn-cart-mini').forEach(btn => {
    btn.addEventListener('click', (e)=>{
      const card = e.target.closest('.product-card');
      const item = {
        id: card.dataset.id, name: card.dataset.name,
        price: Number(card.dataset.price), img: card.dataset.img
      };
      addToCart(item, 1);
      e.stopPropagation();
    });
  });
}

function bindDetailPage(){
  const info = $('.product-info'); if(!info) return;
  const qtyEl = $('#qty');
  const minus = $('.qty-minus');
  const plus = $('.qty-plus');
  let qty = 1;
  const sync = ()=> qtyEl.textContent = qty;
  minus.addEventListener('click', ()=>{ qty = Math.max(1, qty-1); sync(); });
  plus.addEventListener('click', ()=>{ qty = qty+1; sync(); });
  $('#btn-add-detail')?.addEventListener('click', ()=>{
    addToCart({
      id: info.dataset.id,
      name: info.dataset.name,
      price: Number(info.dataset.price),
      img: info.dataset.img
    }, qty);
  });
}

document.addEventListener('DOMContentLoaded', ()=>{
  renderCart();
  bindDrawer();
  bindSearch();
  bindCategoryFilter();
  bindCardAddButtons();
  bindDetailPage();
});
