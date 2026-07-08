const express = require('express');
const bcrypt = require('bcryptjs');
const { db } = require('../db/database');
const router = express.Router();

router.post('/register', async (req, res) => {
  const { name, email, password, phone } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Name, email and password are required.' });
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  const existing = await db.users.findOne({ email });
  if (existing) return res.status(409).json({ error: 'This email is already registered.' });
  const hash = bcrypt.hashSync(password, 10);
  const user = await db.users.insert({ name, email, password_hash: hash, role: 'customer', phone: phone || null, address: null, city: null, createdAt: new Date() });
  req.session.userId = user._id; req.session.role = 'customer'; req.session.name = name;
  res.json({ success: true, message: 'Account created!', user: { id: user._id, name, email, role: 'customer' } });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required.' });
  const user = await db.users.findOne({ email });
  if (!user || !bcrypt.compareSync(password, user.password_hash)) return res.status(401).json({ error: 'Invalid email or password.' });
  req.session.userId = user._id; req.session.role = user.role; req.session.name = user.name;
  res.json({ success: true, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => res.json({ success: true }));
});

router.get('/me', async (req, res) => {
  if (!req.session.userId) return res.json({ user: null });
  const user = await db.users.findOne({ _id: req.session.userId });
  if (!user) return res.json({ user: null });
  res.json({ user: { id: user._id, name: user.name, email: user.email, role: user.role, phone: user.phone, address: user.address, city: user.city } });
});

router.put('/profile', async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Not logged in.' });
  const { name, phone, address, city } = req.body;
  await db.users.update({ _id: req.session.userId }, { $set: { name, phone, address, city } });
  req.session.name = name;
  res.json({ success: true, message: 'Profile updated!' });
});

module.exports = router;
