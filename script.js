// ===== API HELPER =====
async function api(url, opts = {}) {
  const res = await fetch(url, { credentials: 'include', headers: { 'Content-Type': 'application/json' }, ...opts });
  return res.json();
}

// ===== STATE =====
let currentUser = null;
let cartItems = [];

// ===== PRODUCT DATA (fallback) =====
const localProducts = {
  women: [
    { name: "Ivory Linen Kurta", price: "PKR 4,500", badge: "New", img: "/images/hero_women.png" },
    { name: "Floral Embroidered Suit", price: "PKR 6,800", badge: "Bestseller", img: "/images/banner_new.png" },
    { name: "Classic Chiffon Set", price: "PKR 5,200", oldPrice: "PKR 6,500", badge: "Sale", img: "/images/collection_summer.png" },
    { name: "Sage Lawn Ensemble", price: "PKR 3,900", badge: "New", img: "/images/hero_women.png" },
  ],
  men: [
    { name: "Tailored Khaddar Shalwar", price: "PKR 4,200", badge: "New", img: "/images/hero_men.png" },
    { name: "Classic Cambric Kurta", price: "PKR 3,500", badge: "Bestseller", img: "/images/hero_men.png" },
    { name: "Premium Waistcoat Set", price: "PKR 7,800", oldPrice: "PKR 9,500", badge: "Sale", img: "/images/hero_men.png" },
    { name: "Linen Casual Kurta", price: "PKR 2,900", img: "/images/hero_men.png" },
  ],
  kids: [
    { name: "Little Bloom Frock Set", price: "PKR 2,100", badge: "New", img: "/images/hero_kids.png" },
    { name: "Boys Festive Kurta", price: "PKR 1,800", badge: "Bestseller", img: "/images/hero_kids.png" },
    { name: "Girls Party Lehenga", price: "PKR 3,400", oldPrice: "PKR 4,200", badge: "Sale", img: "/images/hero_kids.png" },
    { name: "Comfy Cotton Pyjama Set", price: "PKR 1,500", img: "/images/hero_kids.png" },
  ]
};

// ===== RENDER PRODUCTS FROM API OR FALLBACK =====
async function renderProducts(containerId, category) {
  const grid = document.getElementById(containerId);
  if (!grid) return;

  let products = [];
  try {
    const data = await api(`/api/products?category=${category}`);
    if (data.products && data.products.length) {
      products = data.products.map((p, i) => ({
        id: p._id, name: p.name,
        price: `PKR ${Number(p.price).toLocaleString()}`,
        oldPrice: p.old_price ? `PKR ${Number(p.old_price).toLocaleString()}` : null,
        badge: p.badge, img: p.image,
      }));
    } else throw new Error();
  } catch {
    products = localProducts[category] || [];
  }

  grid.innerHTML = products.map((p, i) => `
    <div class="product-card reveal" style="transition-delay: ${i * 0.08}s">
      <div class="product-card__img">
        ${p.badge ? `<span class="product-card__badge ${p.badge === 'Sale' ? 'sale' : ''}">${p.badge}</span>` : ''}
        <img src="${p.img}" alt="${p.name}" loading="lazy" />
        <div class="product-card__actions">
          <button onclick="handleAddToCart('${p.id || 0}', '${p.name}')">ADD TO CART</button>
        </div>
      </div>
      <div class="product-card__info">
        <h4>${p.name}</h4>
        <p class="product-card__price">
          ${p.oldPrice ? `<span class="old-price">${p.oldPrice}</span>` : ''}
          <span class="${p.oldPrice ? 'new-price' : ''}">${p.price}</span>
        </p>
      </div>
    </div>`).join('');

  observeReveal();
}

renderProducts('womenGrid', 'women');
renderProducts('menGrid', 'men');
renderProducts('kidsGrid', 'kids');

// ===== ADD TO CART =====
window.handleAddToCart = async (productId, name) => {
  if (!currentUser) {
    openModal('loginModal');
    showToast('Please log in to add items to your cart', 'info');
    return;
  }
  if (productId && productId !== '0') {
    const res = await api('/api/cart/add', { method: 'POST', body: JSON.stringify({ product_id: productId, quantity: 1 }) });
    if (res.success) { showToast(res.message); await loadCart(); }
    else showToast(res.error || 'Error adding to cart', 'error');
  } else {
    // Fallback: local cart
    cartCount++;
    updateCartCount();
    showToast(`"${name}" added to cart`);
  }
};

let cartCount = 0;
function updateCartCount() {
  document.querySelector('.cart-count').textContent = cartCount;
}

// ===== LOAD CART =====
async function loadCart() {
  if (!currentUser) return;
  try {
    const data = await api('/api/cart');
    cartCount = data.count || 0;
    cartItems = data.items || [];
    updateCartCount();
    renderCartDrawer(data);
  } catch {}
}

function renderCartDrawer(data) {
  const body = document.getElementById('cartBody');
  const footer = document.getElementById('cartFooter');
  if (!body) return;
  if (!data.items || data.items.length === 0) {
    body.innerHTML = '<p class="cart-empty">Your cart is empty.</p>';
    footer.innerHTML = '';
    return;
  }
  body.innerHTML = data.items.map(item => `
    <div class="cart-item">
      <img src="${item.image}" alt="${item.name}" class="cart-item__img"/>
      <div class="cart-item__info">
        <p class="cart-item__name">${item.name}</p>
        <p class="cart-item__price">PKR ${Number(item.price).toLocaleString()} × ${item.quantity}</p>
      </div>
      <button class="cart-item__remove" onclick="removeCartItem('${item.id}')">✕</button>
    </div>`).join('');
  footer.innerHTML = `
    <div class="cart-total">Total: <strong>PKR ${Number(data.total).toLocaleString()}</strong></div>
    <button class="btn btn--dark" style="width:100%;margin-top:12px" onclick="openCheckout()">CHECKOUT</button>
    <button class="btn btn--outline" style="width:100%;margin-top:8px" onclick="clearCart()">Clear Cart</button>`;
}

window.removeCartItem = async (id) => {
  await api(`/api/cart/remove/${id}`, { method: 'DELETE' });
  await loadCart();
};

window.clearCart = async () => {
  await api('/api/cart/clear', { method: 'DELETE' });
  await loadCart();
};

// ===== CHECKOUT =====
window.openCheckout = () => {
  closeDrawer();
  openModal('checkoutModal');
  if (currentUser) {
    document.getElementById('coName').value = currentUser.name || '';
    document.getElementById('coPhone').value = currentUser.phone || '';
    document.getElementById('coAddress').value = currentUser.address || '';
    document.getElementById('coCity').value = currentUser.city || '';
  }
};

document.getElementById('checkoutForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const body = {
    customer_name: document.getElementById('coName').value,
    address: document.getElementById('coAddress').value,
    city: document.getElementById('coCity').value,
    phone: document.getElementById('coPhone').value,
    payment_method: document.getElementById('coPayment').value,
    notes: document.getElementById('coNotes').value,
  };
  const res = await api('/api/orders/place', { method: 'POST', body: JSON.stringify(body) });
  if (res.success) {
    showToast(`Order #${res.order_id} placed! Total: PKR ${Number(res.total).toLocaleString()}`);
    closeModal('checkoutModal');
    loadCart();
  } else showToast(res.error || 'Order failed', 'error');
});

// ===== HERO SLIDER =====
let currentSlide = 0;
const slides = document.querySelectorAll('.hero__slide');
const dots = document.querySelectorAll('.hero__dot');
let autoSlide;

function goToSlide(index) {
  slides[currentSlide].classList.remove('active');
  dots[currentSlide].classList.remove('active');
  currentSlide = (index + slides.length) % slides.length;
  slides[currentSlide].classList.add('active');
  dots[currentSlide].classList.add('active');
}
function startAuto() { autoSlide = setInterval(() => goToSlide(currentSlide + 1), 5000); }
document.getElementById('heroNext')?.addEventListener('click', () => { clearInterval(autoSlide); goToSlide(currentSlide + 1); startAuto(); });
document.getElementById('heroPrev')?.addEventListener('click', () => { clearInterval(autoSlide); goToSlide(currentSlide - 1); startAuto(); });
dots.forEach(dot => dot.addEventListener('click', () => { clearInterval(autoSlide); goToSlide(parseInt(dot.dataset.index)); startAuto(); }));
startAuto();

// ===== HEADER SCROLL =====
const header = document.getElementById('header');
window.addEventListener('scroll', () => {
  header.classList.toggle('scrolled', window.scrollY > 60);
  document.getElementById('backToTop').classList.toggle('visible', window.scrollY > 400);
});

// ===== SEARCH =====
document.getElementById('searchBtn')?.addEventListener('click', () => {
  document.getElementById('searchBar').classList.add('open');
  document.getElementById('searchInput').focus();
});
document.getElementById('searchClose')?.addEventListener('click', () => document.getElementById('searchBar').classList.remove('open'));

// ===== MOBILE NAV =====
const overlay = document.getElementById('overlay');
function openNav() { document.getElementById('mobileNav').classList.add('open'); overlay.classList.add('show'); document.body.style.overflow = 'hidden'; }
function closeNav() { document.getElementById('mobileNav').classList.remove('open'); overlay.classList.remove('show'); document.body.style.overflow = ''; }
document.getElementById('menuBtn')?.addEventListener('click', openNav);
document.getElementById('mobileNavClose')?.addEventListener('click', closeNav);
overlay?.addEventListener('click', () => { closeNav(); closeDrawer(); });
document.querySelectorAll('.mobile-nav__links a').forEach(a => a.addEventListener('click', closeNav));

// ===== MODALS =====
function openModal(id) { document.getElementById(id)?.classList.add('open'); document.body.style.overflow = 'hidden'; }
function closeModal(id) { document.getElementById(id)?.classList.remove('open'); document.body.style.overflow = ''; }

document.querySelectorAll('[data-modal-close]').forEach(btn => {
  btn.addEventListener('click', () => closeModal(btn.dataset.modalClose));
});
document.querySelectorAll('.modal-backdrop').forEach(b => b.addEventListener('click', function () {
  this.closest('.site-modal')?.classList.remove('open');
  document.body.style.overflow = '';
}));

// ===== CART DRAWER =====
function openDrawer() {
  document.getElementById('cartDrawer')?.classList.add('open');
  document.getElementById('overlay').classList.add('show');
  document.body.style.overflow = 'hidden';
  if (currentUser) loadCart();
}
function closeDrawer() {
  document.getElementById('cartDrawer')?.classList.remove('open');
  document.getElementById('overlay').classList.remove('show');
  document.body.style.overflow = '';
}
document.querySelector('.cart-btn')?.addEventListener('click', openDrawer);
document.getElementById('cartDrawerClose')?.addEventListener('click', closeDrawer);

// ===== AUTH TABS =====
document.querySelectorAll('.auth-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.auth-panel').forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(tab.dataset.tab)?.classList.add('active');
  });
});

// ===== REGISTER =====
document.getElementById('registerForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const body = { name: document.getElementById('regName').value, email: document.getElementById('regEmail').value, password: document.getElementById('regPassword').value };
  const res = await api('/api/auth/register', { method: 'POST', body: JSON.stringify(body) });
  document.getElementById('regError').textContent = res.error || '';
  if (res.success) { currentUser = res.user; updateUserUI(); closeModal('loginModal'); showToast('Welcome to AURA, ' + res.user.name + '!'); }
});

// ===== LOGIN =====
document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const body = { email: document.getElementById('loginEmail').value, password: document.getElementById('loginPassword').value };
  const res = await api('/api/auth/login', { method: 'POST', body: JSON.stringify(body) });
  document.getElementById('loginError').textContent = res.error || '';
  if (res.success) { currentUser = res.user; updateUserUI(); closeModal('loginModal'); showToast('Welcome back, ' + res.user.name + '!'); loadCart(); }
});

// ===== LOGOUT =====
document.getElementById('logoutLink')?.addEventListener('click', async (e) => {
  e.preventDefault();
  await api('/api/auth/logout', { method: 'POST' });
  currentUser = null; cartItems = []; cartCount = 0;
  updateUserUI(); updateCartCount(); showToast('Logged out successfully.');
});

function updateUserUI() {
  const loggedIn = !!currentUser;
  document.getElementById('userMenu')?.classList.toggle('logged-in', loggedIn);
  const nameEl = document.getElementById('userDisplayName');
  if (nameEl) nameEl.textContent = currentUser?.name || '';
}

// ===== NEWSLETTER =====
document.getElementById('newsletterForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('emailInput').value;
  const res = await api('/api/newsletter/subscribe', { method: 'POST', body: JSON.stringify({ email }) });
  document.getElementById('newsletterMsg').textContent = res.message || res.error || '';
  if (res.success) document.getElementById('emailInput').value = '';
});

// ===== CONTACT FORM =====
document.getElementById('contactForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const body = {
    name: document.getElementById('contactName').value,
    email: document.getElementById('contactEmail').value,
    subject: document.getElementById('contactSubject').value,
    message: document.getElementById('contactMessage').value,
  };
  const res = await api('/api/contact/send', { method: 'POST', body: JSON.stringify(body) });
  document.getElementById('contactMsg').textContent = res.message || res.error || '';
  if (res.success) { e.target.reset(); showToast(res.message); }
});

// ===== SCROLL REVEAL =====
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.1 });

function observeReveal() {
  document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
}
observeReveal();
document.querySelectorAll('.section-header, .cat-card, .feature-item, .brand-story__img, .brand-story__text, .full-banner__content').forEach(el => {
  el.classList.add('reveal'); revealObserver.observe(el);
});

// ===== BACK TO TOP =====
document.getElementById('backToTop')?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

// ===== TOAST =====
function showToast(msg, type = 'success') {
  let toast = document.getElementById('siteToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'siteToast';
    toast.style.cssText = `position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:#1a1a18;color:#fff;padding:12px 24px;font-family:'Jost',sans-serif;font-size:0.82rem;letter-spacing:0.08em;z-index:9999;opacity:0;transition:opacity 0.35s ease;border-left:3px solid #b89a6e;min-width:260px;text-align:center;pointer-events:none;`;
    document.body.appendChild(toast);
  }
  toast.style.borderLeftColor = type === 'error' ? '#c0504a' : type === 'info' ? '#5b9bd5' : '#b89a6e';
  toast.textContent = msg;
  toast.style.opacity = '1';
  setTimeout(() => { toast.style.opacity = '0'; }, 3000);
}

// ===== INIT =====
async function init() {
  const data = await api('/api/auth/me');
  if (data.user) { currentUser = data.user; updateUserUI(); loadCart(); }
  // Check payment status in URL
  const params = new URLSearchParams(window.location.search);
  if (params.get('payment') === 'success') showToast('Payment successful! Your order is confirmed.');
  if (params.get('payment') === 'failed') showToast('Payment failed. Please try again.', 'error');
}

init();
