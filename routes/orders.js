const express = require('express');
const { db } = require('../db/database');
const { requireAuth } = require('../middleware/auth');
const router = express.Router();

router.post('/place', requireAuth, async (req, res) => {
  const { customer_name, address, city, phone, payment_method = 'cod', notes } = req.body;
  if (!address || !city || !phone) return res.status(400).json({ error: 'Address, city and phone are required.' });
  const cartItems = await db.cart.find({ user_id: req.session.userId });
  if (!cartItems.length) return res.status(400).json({ error: 'Your cart is empty.' });
  const enriched = [];
  for (const item of cartItems) {
    const product = await db.products.findOne({ _id: item.product_id });
    if (product) enriched.push({ ...item, product });
  }
  const total = enriched.reduce((s, i) => s + i.product.price * i.quantity, 0);
  const order = await db.orders.insert({
    user_id: req.session.userId,
    customer_name: customer_name || req.session.name || 'Unknown',
    total,
    status: 'pending',
    payment_method,
    payment_status: 'unpaid',
    jazzcash_ref: null,
    address,
    city,
    phone,
    notes: notes || null,
    items: enriched.map(i => ({ product_id: i.product_id, name: i.product.name, quantity: i.quantity, price: i.product.price, size: i.size || null })),
    createdAt: new Date()
  });
  for (const i of enriched) await db.products.update({ _id: i.product_id }, { $inc: { stock: -i.quantity } });
  await db.cart.remove({ user_id: req.session.userId }, { multi: true });
  res.json({ success: true, message: 'Order placed successfully!', order_id: order._id, total });
});

router.get('/my-orders', requireAuth, async (req, res) => {
  const orders = await db.orders.find({ user_id: req.session.userId }).sort({ createdAt: -1 });
  res.json({ orders });
});

router.get('/:id', requireAuth, async (req, res) => {
  const order = await db.orders.findOne({ _id: req.params.id, user_id: req.session.userId });
  if (!order) return res.status(404).json({ error: 'Order not found.' });
  res.json({ order });
});

module.exports = router;
