(function(){
  const CART_KEY='shazaar_cart_items';
  function moneyNumber(v){return Number(String(v||'').replace(/[^0-9.]/g,''))||0}
  function readCart(){try{return JSON.parse(localStorage.getItem(CART_KEY)||'[]')}catch(e){return []}}
  function saveCart(items){localStorage.setItem(CART_KEY,JSON.stringify(items));updateCartBadges();}
  function normalizeProduct(p,qty){return {id:String(p.id||''),name:String(p.name||'Product'),price:String(p.price||'0'),image:String(p.image||''),category:String(p.category||''),qty:Math.max(1,Number(qty)||1)}}
  window.getShazaarCart=readCart;
  window.clearShazaarCart=function(){saveCart([])};
  window.addToShazaarCart=function(product,qty){const item=normalizeProduct(product,qty);const cart=readCart();const found=cart.find(x=>x.id===item.id);if(found){found.qty+=item.qty}else{cart.push(item)}saveCart(cart);if(window.trackEvent) window.trackEvent('AddToCart',{content_name:item.name,value:moneyNumber(item.price)*item.qty,currency:'PKR'});showCartToast(item.name);};
  window.removeFromShazaarCart=function(id){saveCart(readCart().filter(x=>x.id!==String(id))); if(window.renderCartPage) window.renderCartPage();};
  window.updateShazaarCartQty=function(id,qty){const cart=readCart();const item=cart.find(x=>x.id===String(id));if(item){item.qty=Math.max(1,Number(qty)||1);saveCart(cart)} if(window.renderCartPage) window.renderCartPage();};
  function count(){return readCart().reduce((s,x)=>s+(Number(x.qty)||0),0)}
  function updateCartBadges(){document.querySelectorAll('[data-cart-count]').forEach(el=>el.textContent=count())}
  function showCartToast(name){let t=document.getElementById('cartToast');if(!t){t=document.createElement('div');t.id='cartToast';t.className='cart-toast';document.body.appendChild(t)}t.innerHTML=`✅ <b>${escapeHtml(name)}</b> added to cart <a href="cart.html">View Cart</a>`;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2600)}
  function escapeHtml(t){return String(t||'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}
  function injectCartLink(){document.querySelectorAll('.nav-wrap').forEach(nav=>{if(nav.querySelector('.cart-link'))return;const a=document.createElement('a');a.className='cart-link';a.href='cart.html';a.innerHTML='🛒 Cart <span data-cart-count>0</span>';const orderBtn=nav.querySelector('.order-btn');if(orderBtn)nav.insertBefore(a,orderBtn);else nav.appendChild(a);});updateCartBadges()}
  document.addEventListener('DOMContentLoaded',injectCartLink);
  if(document.readyState!=='loading')injectCartLink();
})();
