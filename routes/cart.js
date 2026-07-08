const express = require('express');
const { db } = require('../db/database');
const { requireAuth } = require('../middleware/auth');
const router = express.Router();

router.get('/', requireAuth, async (req, res) => {
  const items = await db.cart.find({ user_id: req.session.userId });
  const enriched = [];
  for (const item of items) {
    const product = await db.products.findOne({ _id: item.product_id });
    if (product) enriched.push({ id: item._id, quantity: item.quantity, size: item.size, product_id: item.product_id, name: product.name, price: product.price, image: product.image, stock: product.stock });
  }
  const total = enriched.reduce((s, i) => s + i.price * i.quantity, 0);
  res.json({ items: enriched, total, count: enriched.reduce((s, i) => s + i.quantity, 0) });
});

router.post('/add', requireAuth, async (req, res) => {
  const { product_id, quantity = 1, size } = req.body;
  if (!product_id) return res.status(400).json({ error: 'Product ID required.' });
  const product = await db.products.findOne({ _id: product_id, active: true });
  if (!product) return res.status(404).json({ error: 'Product not found.' });
  const existing = await db.cart.findOne({ user_id: req.session.userId, product_id });
  if (existing) {
    await db.cart.update({ _id: existing._id }, { $set: { quantity: existing.quantity + quantity } });
  } else {
    await db.cart.insert({ user_id: req.session.userId, product_id, quantity, size: size || null, createdAt: new Date() });
  }
  res.json({ success: true, message: `"${product.name}" added to cart!` });
});

router.put('/update', requireAuth, async (req, res) => {
  const { cart_id, quantity } = req.body;
  if (quantity < 1) return res.status(400).json({ error: 'Quantity must be at least 1.' });
  await db.cart.update({ _id: cart_id, user_id: req.session.userId }, { $set: { quantity } });
  res.json({ success: true });
});

router.delete('/remove/:id', requireAuth, async (req, res) => {
  await db.cart.remove({ _id: req.params.id, user_id: req.session.userId });
  res.json({ success: true });
});

router.delete('/clear', requireAuth, async (req, res) => {
  await db.cart.remove({ user_id: req.session.userId }, { multi: true });
  res.json({ success: true });
});

module.exports = router;
