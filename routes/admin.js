const express = require('express');
const { db } = require('../db/database');
const { requireAdmin } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '..', 'images')),
  filename: (req, file, cb) => cb(null, `product_${Date.now()}${path.extname(file.originalname)}`)
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// Stats
router.get('/stats', requireAdmin, async (req, res) => {
  const allOrders = await db.orders.find({});
  const totalRevenue = allOrders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + o.total, 0);
  const totalUsers = await db.users.count({ role: 'customer' });
  const totalProducts = await db.products.count({ active: true });
  const pendingOrders = allOrders.filter(o => o.status === 'pending').length;
  const recentOrders = allOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);
  const recentWithUser = [];
  for (const o of recentOrders) {
    const user = await db.users.findOne({ _id: o.user_id });
    recentWithUser.push({
      ...o,
      id: o._id,
      created_at: o.createdAt,
      customer: o.customer_name || (user ? user.name : 'Unknown')
    });
  }
  res.json({ totalOrders: allOrders.length, totalRevenue, totalUsers, totalProducts, pendingOrders, recentOrders: recentWithUser });
});

// Products CRUD
router.get('/products', requireAdmin, async (req, res) => {
  const products = await db.products.find({}).sort({ createdAt: -1 });
  const result = products.map(p => ({
    ...p,
    id: p._id,
    created_at: p.createdAt
  }));
  res.json({ products: result });
});
router.post('/products', requireAdmin, upload.single('image'), async (req, res) => {
  const { name, category, price, old_price, badge, description, stock } = req.body;
  if (!name || !category || !price) return res.status(400).json({ error: 'Name, category, price required.' });
  const image = req.file ? `/images/${req.file.filename}` : (req.body.image || null);
  const product = await db.products.insert({ name, category, price: parseFloat(price), old_price: old_price ? parseFloat(old_price) : null, badge: badge || null, image, description: description || null, stock: parseInt(stock) || 100, active: true, createdAt: new Date() });
  res.json({ success: true, product_id: product._id });
});
router.put('/products/:id', requireAdmin, upload.single('image'), async (req, res) => {
  const { name, category, price, old_price, badge, description, stock, active, image: imgBody } = req.body;
  const existing = await db.products.findOne({ _id: req.params.id });
  if (!existing) return res.status(404).json({ error: 'Product not found.' });
  const image = req.file ? `/images/${req.file.filename}` : (imgBody || existing.image);
  await db.products.update({ _id: req.params.id }, { $set: { name: name || existing.name, category: category || existing.category, price: parseFloat(price) || existing.price, old_price: old_price ? parseFloat(old_price) : null, badge: badge || null, image, description: description || existing.description, stock: parseInt(stock) || existing.stock, active: active !== undefined ? (active === 'true' || active === true || active === 1) : existing.active } });
  res.json({ success: true });
});
router.delete('/products/:id', requireAdmin, async (req, res) => {
  await db.products.update({ _id: req.params.id }, { $set: { active: false } });
  res.json({ success: true });
});

// Orders
router.get('/orders', requireAdmin, async (req, res) => {
  const orders = await db.orders.find({}).sort({ createdAt: -1 });
  const result = [];
  for (const o of orders) {
    const user = await db.users.findOne({ _id: o.user_id });
    result.push({
      ...o,
      id: o._id,
      created_at: o.createdAt,
      customer_name: o.customer_name || (user ? user.name : 'Unknown'),
      customer_email: user ? user.email : ''
    });
  }
  res.json({ orders: result });
});
router.put('/orders/:id/status', requireAdmin, async (req, res) => {
  const { status } = req.body;
  const allowed = ['pending','confirmed','processing','shipped','delivered','cancelled'];
  if (!allowed.includes(status)) return res.status(400).json({ error: 'Invalid status.' });
  await db.orders.update({ _id: req.params.id }, { $set: { status } });
  res.json({ success: true });
});

// Users
router.get('/users', requireAdmin, async (req, res) => {
  const users = await db.users.find({}).sort({ createdAt: -1 });
  const result = users.map(u => ({
    ...u,
    id: u._id,
    created_at: u.createdAt
  }));
  res.json({ users: result });
});

// Messages
router.get('/messages', requireAdmin, async (req, res) => {
  const messages = await db.messages.find({}).sort({ createdAt: -1 });
  const result = messages.map(m => ({
    ...m,
    id: m._id,
    created_at: m.createdAt
  }));
  res.json({ messages: result });
});
router.put('/messages/:id/read', requireAdmin, async (req, res) => {
  await db.messages.update({ _id: req.params.id }, { $set: { read: true } });
  res.json({ success: true });
});
router.delete('/messages/:id', requireAdmin, async (req, res) => {
  await db.messages.remove({ _id: req.params.id });
  res.json({ success: true });
});

// Newsletter
router.get('/subscribers', requireAdmin, async (req, res) => {
  const subscribers = await db.newsletter.find({}).sort({ createdAt: -1 });
  const result = subscribers.map(s => ({
    ...s,
    id: s._id,
    created_at: s.createdAt
  }));
  res.json({ subscribers: result, count: subscribers.length });
});

module.exports = router;
