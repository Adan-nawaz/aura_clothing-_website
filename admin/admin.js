const API = '';
let currentUser = null;
let allOrders = [];

// ===== UTILS =====
function toast(msg, type = 'success') {
  const t = document.getElementById('adminToast');
  t.textContent = msg;
  t.style.borderLeftColor = type === 'error' ? '#c0504a' : '#b89a6e';
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

async function api(url, opts = {}) {
  const res = await fetch(API + url, { credentials: 'include', headers: { 'Content-Type': 'application/json' }, ...opts });
  return res.json();
}

function fmt(n) { return 'PKR ' + Number(n).toLocaleString(); }
function fmtDate(d) { return new Date(d).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' }); }

function statusBadge(s) {
  const map = { pending: 'status-pending', confirmed: 'status-confirmed', processing: 'status-processing', shipped: 'status-shipped', delivered: 'status-delivered', cancelled: 'status-cancelled' };
  return `<span class="status-badge ${map[s] || ''}">${s}</span>`;
}

// ===== AUTH =====
async function checkAuth() {
  const data = await api('/api/auth/me');
  if (!data.user || data.user.role !== 'admin') {
    document.getElementById('loginOverlay').classList.remove('hidden');
  } else {
    currentUser = data.user;
    document.getElementById('loginOverlay').classList.add('hidden');
    document.getElementById('adminUser').textContent = data.user.name;
    loadPage('dashboard');
  }
}

document.getElementById('adminLoginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const res = await api('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: document.getElementById('adminEmail').value, password: document.getElementById('adminPassword').value })
  });
  if (res.error) { document.getElementById('loginError').textContent = res.error; return; }
  if (res.user.role !== 'admin') { document.getElementById('loginError').textContent = 'Access denied. Admin only.'; return; }
  currentUser = res.user;
  document.getElementById('loginOverlay').classList.add('hidden');
  document.getElementById('adminUser').textContent = res.user.name;
  loadPage('dashboard');
});

document.getElementById('logoutBtn').addEventListener('click', async () => {
  await api('/api/auth/logout', { method: 'POST' });
  document.getElementById('loginOverlay').classList.remove('hidden');
});

// ===== NAVIGATION =====
function loadPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.sidebar__link').forEach(l => l.classList.remove('active'));
  document.getElementById(`page-${name}`).classList.add('active');
  document.getElementById(`nav-${name}`)?.classList.add('active');
  document.getElementById('pageTitle').textContent = name.charAt(0).toUpperCase() + name.slice(1);

  const loaders = { dashboard: loadDashboard, products: loadProducts, orders: loadOrders, users: loadUsers, messages: loadMessages, newsletter: loadNewsletter };
  loaders[name]?.();
}

document.querySelectorAll('.sidebar__link[data-page]').forEach(link => {
  link.addEventListener('click', (e) => { e.preventDefault(); loadPage(link.dataset.page); });
});

document.getElementById('sidebarToggle').addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('open');
});

// ===== DASHBOARD =====
async function loadDashboard() {
  const data = await api('/api/admin/stats');
  const grid = document.getElementById('statsGrid');
  grid.innerHTML = `
    <div class="stat-card gold"><div class="stat-card__label">Total Revenue</div><div class="stat-card__value">${fmt(data.totalRevenue)}</div><div class="stat-card__sub">All time</div></div>
    <div class="stat-card"><div class="stat-card__label">Total Orders</div><div class="stat-card__value">${data.totalOrders}</div><div class="stat-card__sub">${data.pendingOrders} pending</div></div>
    <div class="stat-card"><div class="stat-card__label">Customers</div><div class="stat-card__value">${data.totalUsers}</div><div class="stat-card__sub">Registered</div></div>
    <div class="stat-card"><div class="stat-card__label">Products</div><div class="stat-card__value">${data.totalProducts}</div><div class="stat-card__sub">Active</div></div>
    <div class="stat-card"><div class="stat-card__label">Pending</div><div class="stat-card__value">${data.pendingOrders}</div><div class="stat-card__sub">Needs action</div></div>
  `;
  const recentHtml = data.recentOrders.map(o => `
    <tr>
      <td>#${o.id}</td><td>${o.customer}</td><td>${fmt(o.total)}</td>
      <td>${statusBadge(o.status)}</td><td>${fmtDate(o.created_at)}</td>
    </tr>`).join('');
  document.getElementById('recentOrders').innerHTML = `
    <table class="data-table"><thead><tr><th>ID</th><th>Customer</th><th>Total</th><th>Status</th><th>Date</th></tr></thead>
    <tbody>${recentHtml}</tbody></table>`;
}

// ===== PRODUCTS =====
async function loadProducts() {
  const data = await api('/api/admin/products');
  const tbody = document.getElementById('productsTbody');
  tbody.innerHTML = data.products.map(p => `
    <tr>
      <td><img src="${p.image || ''}" class="product-img-small" alt="${p.name}" onerror="this.style.display='none'"/></td>
      <td>${p.name}</td>
      <td style="text-transform:capitalize">${p.category}</td>
      <td>${fmt(p.price)}${p.old_price ? `<br><small style="text-decoration:line-through;color:var(--muted)">${fmt(p.old_price)}</small>` : ''}</td>
      <td>${p.stock}</td>
      <td><span class="status-badge ${p.active ? 'status-confirmed' : 'status-cancelled'}">${p.active ? 'Active' : 'Hidden'}</span></td>
      <td><div class="btn-actions">
        <button class="btn-icon btn-edit" onclick="editProduct('${p.id}')">✎</button>
        <button class="btn-icon btn-delete" onclick="deleteProduct('${p.id}')">✕</button>
      </div></td>
    </tr>`).join('');
}

document.getElementById('addProductBtn').addEventListener('click', () => {
  document.getElementById('productModalTitle').textContent = 'Add Product';
  document.getElementById('productForm').reset();
  document.getElementById('productId').value = '';
  document.getElementById('productModal').classList.add('open');
});

window.editProduct = async (id) => {
  const data = await api('/api/admin/products');
  const p = data.products.find(x => x.id === id);
  if (!p) return;
  document.getElementById('productModalTitle').textContent = 'Edit Product';
  document.getElementById('productId').value = p.id;
  document.getElementById('pName').value = p.name;
  document.getElementById('pCategory').value = p.category;
  document.getElementById('pDesc').value = p.description || '';
  document.getElementById('pPrice').value = p.price;
  document.getElementById('pOldPrice').value = p.old_price || '';
  document.getElementById('pBadge').value = p.badge || '';
  document.getElementById('pStock').value = p.stock;
  document.getElementById('pImage').value = p.image || '';
  document.getElementById('productModal').classList.add('open');
};

window.deleteProduct = async (id) => {
  if (!confirm('Deactivate this product?')) return;
  const res = await api(`/api/admin/products/${id}`, { method: 'DELETE' });
  if (res.success) { toast('Product deactivated'); loadProducts(); }
};

document.getElementById('productForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('productId').value;
  const body = {
    name: document.getElementById('pName').value,
    category: document.getElementById('pCategory').value,
    description: document.getElementById('pDesc').value,
    price: document.getElementById('pPrice').value,
    old_price: document.getElementById('pOldPrice').value,
    badge: document.getElementById('pBadge').value,
    stock: document.getElementById('pStock').value,
    image: document.getElementById('pImage').value,
    active: 1
  };
  const url = id ? `/api/admin/products/${id}` : '/api/admin/products';
  const method = id ? 'PUT' : 'POST';
  const res = await api(url, { method, body: JSON.stringify(body) });
  if (res.success || res.product_id) { toast(id ? 'Product updated!' : 'Product added!'); document.getElementById('productModal').classList.remove('open'); loadProducts(); }
  else toast(res.error || 'Error', 'error');
});

['productModalClose', 'productModalCancel'].forEach(id => {
  document.getElementById(id).addEventListener('click', () => document.getElementById('productModal').classList.remove('open'));
});

// ===== ORDERS =====
async function loadOrders() {
  const data = await api('/api/admin/orders');
  allOrders = data.orders;
  renderOrders(allOrders);
}

function renderOrders(orders) {
  document.getElementById('ordersTbody').innerHTML = orders.map(o => `
    <tr>
      <td>#${o.id}</td>
      <td>${o.customer_name}<br><small style="color:var(--muted)">${o.customer_email}</small></td>
      <td>${fmt(o.total)}</td>
      <td style="text-transform:uppercase;font-size:0.75rem">${o.payment_method} <span style="color:var(--muted)">(${o.payment_status})</span></td>
      <td>${statusBadge(o.status)}</td>
      <td>${fmtDate(o.created_at)}</td>
      <td>
        <select onchange="updateOrderStatus('${o.id}', this.value)" class="filter-select" style="font-size:0.72rem;padding:4px 8px">
          ${['pending','confirmed','processing','shipped','delivered','cancelled'].map(s => `<option value="${s}" ${s === o.status ? 'selected' : ''}>${s}</option>`).join('')}
        </select>
      </td>
    </tr>`).join('');
}

window.updateOrderStatus = async (id, status) => {
  const res = await api(`/api/admin/orders/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) });
  if (res.success) toast(`Order #${id} → ${status}`);
};

document.getElementById('orderFilter').addEventListener('change', (e) => {
  const val = e.target.value;
  renderOrders(val ? allOrders.filter(o => o.status === val) : allOrders);
});

// ===== USERS =====
async function loadUsers() {
  const data = await api('/api/admin/users');
  document.getElementById('usersTbody').innerHTML = data.users.filter(u => u.role === 'customer').map(u => `
    <tr>
      <td>${u.name}</td><td>${u.email}</td>
      <td>${u.phone || '—'}</td><td>${u.city || '—'}</td>
      <td>${fmtDate(u.created_at)}</td>
    </tr>`).join('');
}

// ===== MESSAGES =====
async function loadMessages() {
  const data = await api('/api/admin/messages');
  const unread = data.messages.filter(m => !m.read).length;
  document.getElementById('msgBadge').textContent = unread || '';
  document.getElementById('messagesList').innerHTML = data.messages.map(m => `
    <div class="message-card ${m.read ? '' : 'unread'}" id="msg-${m.id}">
      <div class="message-card__header">
        <div>
          <div class="message-card__name">${m.name}</div>
          <div class="message-card__email">${m.email}</div>
          <div class="message-card__subject">${m.subject}</div>
        </div>
        <div style="display:flex;gap:8px;align-items:flex-start">
          <span class="message-card__date">${fmtDate(m.created_at)}</span>
          ${!m.read ? `<button class="btn-icon btn-edit" onclick="markRead('${m.id}')" title="Mark read">✓</button>` : ''}
          <button class="btn-icon btn-delete" onclick="deleteMsg('${m.id}')" title="Delete">✕</button>
        </div>
      </div>
      <div class="message-card__text">${m.message}</div>
    </div>`).join('') || '<p style="color:var(--muted);padding:20px">No messages yet.</p>';
}

window.markRead = async (id) => {
  await api(`/api/admin/messages/${id}/read`, { method: 'PUT' });
  loadMessages();
};
window.deleteMsg = async (id) => {
  if (!confirm('Delete this message?')) return;
  await api(`/api/admin/messages/${id}`, { method: 'DELETE' });
  loadMessages();
};

// ===== NEWSLETTER =====
async function loadNewsletter() {
  const data = await api('/api/admin/subscribers');
  document.getElementById('subCount').textContent = `${data.count} subscribers`;
  document.getElementById('subscribersTbody').innerHTML = data.subscribers.map(s => `
    <tr>
      <td>${s.email}</td>
      <td><span class="status-badge ${s.active ? 'status-confirmed' : 'status-cancelled'}">${s.active ? 'Active' : 'Unsubscribed'}</span></td>
      <td>${fmtDate(s.created_at)}</td>
    </tr>`).join('');
}

// ===== INIT =====
checkAuth();
