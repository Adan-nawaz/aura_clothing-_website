const express = require('express');
const { db } = require('../db/database');
const router = express.Router();
router.post('/send', async (req, res) => {
  const { name, email, subject, message } = req.body;
  if (!name || !email || !message) return res.status(400).json({ error: 'Name, email and message are required.' });
  await db.messages.insert({ name, email, subject: subject || 'General Inquiry', message, read: false, createdAt: new Date() });
  res.json({ success: true, message: "Your message has been sent! We'll get back to you within 24 hours." });
});
module.exports = router;
