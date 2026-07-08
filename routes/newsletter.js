const express = require('express');
const { db } = require('../db/database');
const router = express.Router();
router.post('/subscribe', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required.' });
  const existing = await db.newsletter.findOne({ email });
  if (existing) {
    if (existing.active) return res.status(409).json({ error: 'You are already subscribed!' });
    await db.newsletter.update({ email }, { $set: { active: true } });
    return res.json({ success: true, message: 'Welcome back to the AURA circle!' });
  }
  await db.newsletter.insert({ email, active: true, createdAt: new Date() });
  res.json({ success: true, message: `✓ Thank you! ${email} has been added to the AURA circle.` });
});
router.post('/unsubscribe', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required.' });
  await db.newsletter.update({ email }, { $set: { active: false } });
  res.json({ success: true, message: 'You have been unsubscribed.' });
});
module.exports = router;
