const params=new URLSearchParams(location.search);
const id=params.get("id");
const box=document.getElementById("productDetail");
const related=document.getElementById("relatedProducts");
const warning=document.getElementById("setupWarning");
let currentProduct=null;
function getSupabaseSettings(){const local=JSON.parse(localStorage.getItem("shazaar_supabase_settings")||"{}");return{url:local.url||window.DEALZONE_CONFIG.supabaseUrl,key:local.key||window.DEALZONE_CONFIG.supabaseAnonKey}}
function getSupabaseClient(){const s=getSupabaseSettings();if(!s.url||!s.key)return null;return window.supabase.createClient(s.url,s.key)}
function escapeHtml(t){return String(t||"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
function cleanPrice(price){const n=String(price||'').replace(/[^0-9.]/g,'');return Number(n)||0}
function paymentLabel(v){return v==='Easypaisa Advance'?'Easypaisa Advance':'Cash on Delivery'}
function productCard(p){const msg=encodeURIComponent(`Hello SHAZAAR, I want to order: ${p.name} - ${p.price}`);return `<article class="product-card"><div class="product-image"><img src="${p.image}" alt="${escapeHtml(p.name)}" loading="lazy"></div><div class="product-info"><span class="product-category">${escapeHtml(p.category)}</span><h4>${escapeHtml(p.name)}</h4><p>${escapeHtml(p.description)}</p><div class="product-meta-box"><div class="meta-item price-meta"><span>Price</span><strong>${escapeHtml(p.price)}</strong></div><div class="meta-item stock-meta"><span>Available Stock</span><strong>${escapeHtml(p.stock||"In Stock")}</strong></div></div><div class="card-actions"><a class="read-more-btn" href="product.html?id=${encodeURIComponent(p.id)}">Read More</a><a class="wa-card" target="_blank" href="https://wa.me/${window.DEALZONE_CONFIG.whatsappNumber}?text=${msg}">WhatsApp</a></div></div></article>`}
function buildOrderMessage(order){return encodeURIComponent(`New Order - SHAZAAR%0APayment: ${order.payment_method||'COD'}%0AProduct: ${order.product_name}%0APrice: ${order.product_price}%0AQuantity: ${order.quantity}%0ATotal: ${order.total_amount}%0AAdvance Paid: ${order.advance_amount||'-'}%0ATransaction ID: ${order.easypaisa_trx_id||'-'}%0AName: ${order.customer_name}%0APhone: ${order.customer_phone}%0ACity: ${order.customer_city}%0AAddress: ${order.customer_address}%0ANote: ${order.customer_note||'-'}`)}
function bindOrderForm(){
  const form=document.getElementById('codOrderForm');
  const qty=document.getElementById('orderQuantity');
  const total=document.getElementById('orderTotal');
  const status=document.getElementById('orderStatus');
  const paymentRadios=[...document.querySelectorAll('input[name="paymentMethod"]')];
  const epBox=document.getElementById('easypaisaBox');
  const trx=document.getElementById('easypaisaTrxId');
  const adv=document.getElementById('advanceAmount');
  if(!form||!currentProduct)return;
  function selectedPayment(){const r=paymentRadios.find(x=>x.checked);return r?r.value:'COD'}
  function updatePaymentUI(){const ep=selectedPayment()==='Easypaisa Advance';if(epBox)epBox.classList.toggle('hidden',!ep);if(trx)trx.required=ep;if(adv)adv.required=ep;}
  function updateTotal(){const q=Math.max(1,Number(qty.value)||1);const amount=cleanPrice(currentProduct.price)*q;total.textContent=amount?`Estimated Total: PKR ${amount.toLocaleString()}`:`Total: ${currentProduct.price} x ${q}`}
  paymentRadios.forEach(r=>r.addEventListener('change',updatePaymentUI));
  qty.addEventListener('input',updateTotal);updatePaymentUI();updateTotal();
  form.addEventListener('submit',async e=>{
    e.preventDefault();
    const c=getSupabaseClient();
    if(!c){status.textContent='Store database is not configured yet. Please order on WhatsApp.';return}
    const q=Math.max(1,Number(qty.value)||1);
    const amount=cleanPrice(currentProduct.price)*q;
    const pay=selectedPayment();
    const order={
      product_id:currentProduct.id,
      product_name:currentProduct.name,
      product_price:currentProduct.price,
      quantity:q,
      total_amount:amount?`PKR ${amount.toLocaleString()}`:`${currentProduct.price} x ${q}`,
      customer_name:document.getElementById('customerName').value.trim(),
      customer_phone:document.getElementById('customerPhone').value.trim(),
      customer_city:document.getElementById('customerCity').value.trim(),
      customer_address:document.getElementById('customerAddress').value.trim(),
      customer_note:document.getElementById('customerNote').value.trim(),
      payment_method:pay,
      advance_amount:pay==='Easypaisa Advance'?(document.getElementById('advanceAmount').value.trim()||''):'',
      easypaisa_trx_id:pay==='Easypaisa Advance'?(document.getElementById('easypaisaTrxId').value.trim()||''):'',
      payment_status:pay==='Easypaisa Advance'?'Payment Verification Pending':'COD Pending',
      status:'Pending'
    };
    if(order.customer_phone.length<10)return alert('Please enter a valid phone number.');
    if(pay==='Easypaisa Advance' && (!order.advance_amount||!order.easypaisa_trx_id))return alert('Please enter Easypaisa amount and Transaction ID.');
    status.textContent='Submitting your order...';
    const{error}=await c.from('orders').insert([order]);
    if(error){status.textContent='Order could not be saved: '+error.message;return}
    form.reset();updatePaymentUI();updateTotal();
    status.innerHTML=pay==='Easypaisa Advance'?'✅ Order placed. Your payment will be verified and our team will contact you.':'✅ COD order placed successfully. Our team will contact you for confirmation.';
    if(window.trackEvent) window.trackEvent('Lead',{content_name:currentProduct.name,value:amount,currency:'PKR'});
    setTimeout(()=>{window.open(`https://wa.me/${window.DEALZONE_CONFIG.whatsappNumber}?text=${buildOrderMessage(order)}`,'_blank')},600);
  });
}
async function loadProduct(){const c=getSupabaseClient();if(!c){warning.classList.remove("hidden");warning.textContent="Store setup is not completed yet.";return}const{data:p,error}=await c.from("products").select("*").eq("id",id).single();if(error||!p){box.innerHTML=`<div class="empty-category"><strong>Product not found</strong><span>This product may have been removed.</span></div>`;return}currentProduct=p;document.title=`${p.name} - SHAZAAR`;if(window.trackEvent) window.trackEvent('ViewContent',{content_name:p.name,content_category:p.category,value:cleanPrice(p.price),currency:'PKR'});const msg=encodeURIComponent(`Hello SHAZAAR, I want to order: ${p.name} - ${p.price}`);box.innerHTML=`<div class="product-detail-image"><img src="${p.image}" alt="${escapeHtml(p.name)}"><div class="trust-mini"><span>🚚 Cash on Delivery</span><span>💳 Easypaisa Advance</span><span>🔁 Easy Return Policy</span><span>💬 WhatsApp Support</span></div></div><div class="product-detail-info"><span class="product-category">${escapeHtml(p.category)}</span><h1>${escapeHtml(p.name)}</h1><div class="detail-meta"><div class="meta-item price-meta"><span>Price</span><strong>${escapeHtml(p.price)}</strong></div><div class="meta-item stock-meta"><span>Available Stock</span><strong>${escapeHtml(p.stock||"In Stock")}</strong></div></div><h3>Product Description</h3><div class="detail-description">${escapeHtml(p.description)}</div><div class="detail-actions"><a class="btn primary" target="_blank" href="https://wa.me/${window.DEALZONE_CONFIG.whatsappNumber}?text=${msg}">Ask on WhatsApp</a><a class="btn soft" href="index.html#categories">Back to Store</a></div><div class="cod-card"><h2>Order Form</h2><p>Choose Cash on Delivery or Easypaisa advance payment. Your order will appear in admin dashboard.</p><form id="codOrderForm"><div class="payment-options"><label class="pay-option"><input type="radio" name="paymentMethod" value="COD" checked><span><b>Cash on Delivery</b><small>Pay cash when parcel arrives.</small></span></label><label class="pay-option"><input type="radio" name="paymentMethod" value="Easypaisa Advance"><span><b>Easypaisa Advance</b><small>Pay first, then submit transaction ID.</small></span></label></div><div id="easypaisaBox" class="easypaisa-box hidden"><h3>Send Easypaisa Payment</h3><p><b>Account Title:</b> ${escapeHtml(window.DEALZONE_CONFIG.easypaisaAccountTitle||'SHAZAAR')}</p><p><b>Easypaisa Number:</b> ${escapeHtml(window.DEALZONE_CONFIG.easypaisaNumber||window.DEALZONE_CONFIG.whatsappNumber)}</p><p>${escapeHtml(window.DEALZONE_CONFIG.easypaisaInstructions||'Send payment and enter Transaction ID below.')}</p><div class="form-grid two"><label>Advance Amount<input id="advanceAmount" type="text" placeholder="PKR 1000"></label><label>Transaction ID<input id="easypaisaTrxId" type="text" placeholder="Easypaisa TRX ID"></label></div></div><div class="form-grid two"><label>Full Name<input id="customerName" type="text" required placeholder="Your name"></label><label>Phone / WhatsApp<input id="customerPhone" type="tel" required placeholder="03XXXXXXXXX"></label><label>City<input id="customerCity" type="text" required placeholder="Rawalpindi"></label><label>Quantity<input id="orderQuantity" type="number" min="1" value="1" required></label></div><label>Complete Address<textarea id="customerAddress" required placeholder="House, street, area, city"></textarea></label><label>Order Note (optional)<textarea id="customerNote" placeholder="Color, size, or any special note"></textarea></label><div id="orderTotal" class="order-total"></div><button class="btn primary full" type="submit">Place Order</button><div id="orderStatus" class="order-status"></div></form></div></div>`;bindOrderForm();const{data:rel}=await c.from("products").select("*").eq("category",p.category).neq("id",p.id).limit(4);related.innerHTML=(rel&&rel.length)?rel.map(productCard).join(""):`<div class="empty-category"><strong>No related products yet</strong></div>`}
loadProduct();
