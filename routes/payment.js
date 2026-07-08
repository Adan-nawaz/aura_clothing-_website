const express = require('express');
const crypto = require('crypto');
const { getDB } = require('../db/database');
const { requireAuth } = require('../middleware/auth');
const router = express.Router();

// ====================================================
// JAZZCASH CONFIGURATION
// Replace these with your actual JazzCash merchant credentials
// Sign up at: https://sandbox.jazzcash.com.pk/
// ====================================================
const JAZZCASH_CONFIG = {
  merchantId: process.env.JAZZCASH_MERCHANT_ID || 'YOUR_MERCHANT_ID',
  password: process.env.JAZZCASH_PASSWORD || 'YOUR_PASSWORD',
  integritySalt: process.env.JAZZCASH_INTEGRITY_SALT || 'YOUR_INTEGRITY_SALT',
  // Use sandbox for testing, live for production
  postUrl: process.env.JAZZCASH_SANDBOX === 'true'
    ? 'https://sandbox.jazzcash.com.pk/ApplicationAPI/API/2.0/Purchase/DoMWalletTransaction'
    : 'https://payments.jazzcash.com.pk/ApplicationAPI/API/2.0/Purchase/DoMWalletTransaction',
  returnUrl: process.env.APP_URL ? `${process.env.APP_URL}/api/payment/jazzcash/callback` : 'http://localhost:3000/api/payment/jazzcash/callback',
};

// Generate SHA256 HMAC hash for JazzCash
function generateHash(params, salt) {
  const sorted = Object.keys(params).sort().map(k => params[k]).join('&');
  const str = `${salt}&${sorted}`;
  return crypto.createHmac('sha256', salt).update(str).digest('hex');
}

// Initiate JazzCash Mobile Wallet Payment
router.post('/jazzcash/initiate', requireAuth, (req, res) => {
  const { order_id, amount, phone_number } = req.body;
  if (!order_id || !amount || !phone_number) {
    return res.status(400).json({ error: 'order_id, amount, and phone_number required.' });
  }

  const db = getDB();
  const order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(order_id, req.session.userId);
  if (!order) return res.status(404).json({ error: 'Order not found.' });

  const now = new Date();
  const txnDateTime = now.toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
  const expDateTime = new Date(now.getTime() + 3600000).toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
  const txnRefNo = `T${txnDateTime}${Math.floor(Math.random() * 9999)}`;

  const params = {
    pp_Version: '1.1',
    pp_TxnType: 'MWALLET',
    pp_Language: 'EN',
    pp_MerchantID: JAZZCASH_CONFIG.merchantId,
    pp_Password: JAZZCASH_CONFIG.password,
    pp_TxnRefNo: txnRefNo,
    pp_Amount: Math.round(amount * 100).toString(), // In paisas
    pp_TxnCurrency: 'PKR',
    pp_TxnDateTime: txnDateTime,
    pp_BillReference: `ORDER-${order_id}`,
    pp_Description: `AURA Order #${order_id}`,
    pp_TxnExpiryDateTime: expDateTime,
    pp_ReturnURL: JAZZCASH_CONFIG.returnUrl,
    pp_MobileNumber: phone_number,
    ppmpf_1: req.session.userId.toString(),
  };

  params.pp_SecureHash = generateHash(params, JAZZCASH_CONFIG.integritySalt);

  // Save txn ref to order
  db.prepare('UPDATE orders SET jazzcash_ref = ? WHERE id = ?').run(txnRefNo, order_id);

  // In production, post to JazzCash API
  // For now, return the params (frontend handles redirect)
  res.json({
    success: true,
    postUrl: JAZZCASH_CONFIG.postUrl,
    params,
    note: 'POST these params to JazzCash postUrl from your frontend form.'
  });
});

// JazzCash Callback
router.post('/jazzcash/callback', (req, res) => {
  const data = req.body;
  const db = getDB();

  if (data.pp_ResponseCode === '000') {
    // Payment successful
    const order = db.prepare('SELECT * FROM orders WHERE jazzcash_ref = ?').get(data.pp_TxnRefNo);
    if (order) {
      db.prepare("UPDATE orders SET payment_status = 'paid', status = 'confirmed' WHERE id = ?").run(order.id);
    }
    res.redirect('/?payment=success');
  } else {
    res.redirect('/?payment=failed');
  }
});

// COD (Cash on Delivery) — confirm order
router.post('/cod/confirm', requireAuth, (req, res) => {
  const { order_id } = req.body;
  const db = getDB();
  const order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(order_id, req.session.userId);
  if (!order) return res.status(404).json({ error: 'Order not found.' });
  db.prepare("UPDATE orders SET payment_method = 'cod', status = 'confirmed' WHERE id = ?").run(order_id);
  res.json({ success: true, message: 'Order confirmed! Payment on delivery.' });
});

module.exports = router;
