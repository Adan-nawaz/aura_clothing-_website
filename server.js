const express = require('express');
const session = require('express-session');
const path = require('path');
const { initDB } = require('./db/database');

const authRoutes = require('./routes/auth');
const cartRoutes = require('./routes/cart');
const orderRoutes = require('./routes/orders');
const adminRoutes = require('./routes/admin');
const contactRoutes = require('./routes/contact');
const newsletterRoutes = require('./routes/newsletter');
const paymentRoutes = require('./routes/payment');
const { db } = require('./db/database');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: 'aura-secret-2025-secure',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 7 * 24 * 60 * 60 * 1000, httpOnly: true }
}));

app.use(express.static(path.join(__dirname)));
app.use('/admin-panel', express.static(path.join(__dirname, 'admin')));
app.use('/admin', express.static(path.join(__dirname, 'admin')));

app.use('/api/auth', authRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/payment', paymentRoutes);

// Public products
app.get('/api/products', async (req, res) => {
  const query = { active: true };
  if (req.query.category) query.category = req.query.category;
  const products = await db.products.find(query).sort({ createdAt: -1 });
  res.json({ products });
});

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/admin-panel', (req, res) => res.sendFile(path.join(__dirname, 'admin', 'index.html')));

initDB().then(() => {
  const server = app.listen(PORT, () => {
    console.log(`\n✨ AURA Server running at http://localhost:${PORT}`);
    console.log(`🛍️  Shop:  http://localhost:${PORT}`);
    console.log(`🔧 Admin: http://localhost:${PORT}/admin-panel`);
    console.log(`   Admin Login: admin@aura.pk / admin123\n`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`\n❌ [ERROR] Port ${PORT} is already in use by another application!`);
      console.error(`👉 Close the application using port ${PORT} or change the port in server.js (line 16) to something else (like 3001).\n`);
    } else {
      console.error('\n❌ [ERROR] Server failed to start:', err.message);
    }
  });
});
