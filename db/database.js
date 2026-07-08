const Datastore = require('nedb-promises');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_DIR = path.join(__dirname, '..', 'data');

const db = {
  users:       Datastore.create({ filename: path.join(DB_DIR, 'users.db'),       autoload: true }),
  products:    Datastore.create({ filename: path.join(DB_DIR, 'products.db'),    autoload: true }),
  cart:        Datastore.create({ filename: path.join(DB_DIR, 'cart.db'),        autoload: true }),
  orders:      Datastore.create({ filename: path.join(DB_DIR, 'orders.db'),      autoload: true }),
  messages:    Datastore.create({ filename: path.join(DB_DIR, 'messages.db'),    autoload: true }),
  newsletter:  Datastore.create({ filename: path.join(DB_DIR, 'newsletter.db'),  autoload: true }),
};

async function initDB() {
  // Ensure data dir exists
  const fs = require('fs');
  if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });

  // Seed admin user
  const admin = await db.users.findOne({ email: 'admin@aura.pk' });
  if (!admin) {
    const hash = bcrypt.hashSync('admin123', 10);
    await db.users.insert({ name: 'Admin', email: 'admin@aura.pk', password_hash: hash, role: 'admin', phone: null, address: null, city: null, createdAt: new Date() });
    console.log('✅ Admin user created: admin@aura.pk / admin123');
  }

  // Seed products
  const count = await db.products.count({});
  if (count === 0) {
    const products = [
      { name: 'Ivory Linen Kurta', category: 'women', price: 4500, old_price: null, badge: 'New', image: '/images/hero_women.png', description: 'Elegant ivory linen kurta, perfect for any occasion.', stock: 50, active: true, createdAt: new Date() },
      { name: 'Floral Embroidered Suit', category: 'women', price: 6800, old_price: null, badge: 'Bestseller', image: '/images/banner_new.png', description: 'Beautiful floral embroidery on premium fabric.', stock: 30, active: true, createdAt: new Date() },
      { name: 'Classic Chiffon Dupatta Set', category: 'women', price: 5200, old_price: 6500, badge: 'Sale', image: '/images/collection_summer.png', description: 'Classic 3-piece chiffon dupatta set.', stock: 20, active: true, createdAt: new Date() },
      { name: 'Sage Lawn Ensemble', category: 'women', price: 3900, old_price: null, badge: 'New', image: '/images/hero_women.png', description: 'Fresh sage green lawn ensemble for summer.', stock: 45, active: true, createdAt: new Date() },
      { name: 'Tailored Khaddar Shalwar', category: 'men', price: 4200, old_price: null, badge: 'New', image: '/images/hero_men.png', description: 'Premium khaddar shalwar kameez for men.', stock: 40, active: true, createdAt: new Date() },
      { name: 'Classic Cambric Kurta', category: 'men', price: 3500, old_price: null, badge: 'Bestseller', image: '/images/hero_men.png', description: 'Timeless cambric kurta in neutral tones.', stock: 60, active: true, createdAt: new Date() },
      { name: 'Premium Waistcoat Set', category: 'men', price: 7800, old_price: 9500, badge: 'Sale', image: '/images/hero_men.png', description: 'Sophisticated waistcoat set for special occasions.', stock: 15, active: true, createdAt: new Date() },
      { name: 'Linen Casual Kurta', category: 'men', price: 2900, old_price: null, badge: null, image: '/images/hero_men.png', description: 'Relaxed linen kurta for everyday wear.', stock: 70, active: true, createdAt: new Date() },
      { name: 'Little Bloom Frock Set', category: 'kids', price: 2100, old_price: null, badge: 'New', image: '/images/hero_kids.png', description: 'Adorable bloom frock set for little girls.', stock: 35, active: true, createdAt: new Date() },
      { name: 'Boys Festive Kurta', category: 'kids', price: 1800, old_price: null, badge: 'Bestseller', image: '/images/hero_kids.png', description: 'Classic festive kurta for boys.', stock: 50, active: true, createdAt: new Date() },
      { name: 'Girls Party Lehenga', category: 'kids', price: 3400, old_price: 4200, badge: 'Sale', image: '/images/hero_kids.png', description: 'Gorgeous party lehenga for special occasions.', stock: 20, active: true, createdAt: new Date() },
      { name: 'Comfy Cotton Pyjama Set', category: 'kids', price: 1500, old_price: null, badge: null, image: '/images/hero_kids.png', description: 'Soft cotton pyjama set for comfortable sleep.', stock: 80, active: true, createdAt: new Date() },
    ];
    await db.products.insert(products);
    console.log('✅ Sample products seeded');
  }

  console.log('✅ Database ready');
}

module.exports = { db, initDB };
