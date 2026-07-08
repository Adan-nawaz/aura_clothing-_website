# AURA — Premium Clothing Brand Website

AURA is a premium, full-stack e-commerce clothing brand website. It features a modern, clean, and responsive user interface for customers to browse, add items to their cart, register, and place orders. It also features a robust, secure admin dashboard to manage inventory, track orders, read contact messages, and manage newsletter subscribers.

---

## 🔗 Live Demo
Explore the live website online: **[AURA Clothing Store (Live)](https://aura-clothing-website.onrender.com)**  

---

## 🌟 Key Features

### 🛍️ Storefront (Frontend)
- **Elegant & Responsive Design**: Crafted with custom vanilla CSS, optimized for mobile, tablet, and desktop screens.
- **Hero Slider & Collections**: Interactive banner sliders showcasing seasonal collections.
- **Dynamic Shop Sections**: Separate categories for Women, Men, and Kids.
- **Shopping Cart**: Real-time cart calculations and updates.
- **User Authentication**: Secure user registration, login, profile updates, and logout.
- **Checkout Flow**: Complete shipping form supporting Cash on Delivery (COD), JazzCash, and EasyPaisa.
- **Contact Form**: Interactive customer contact portal.
- **Newsletter Subscription**: Direct subscription to stay updated on new drops.

### 🔧 Admin Dashboard (Backend-controlled)
- **Real-time Stats Overview**: Track total revenue, orders count, registered customers, active products, and pending action items.
- **Products Management (CRUD)**: Create, edit, list, and deactivate/activate products. Includes image uploads.
- **Orders Management**: View details of customer orders and update shipping statuses (Pending, Confirmed, Shipped, Delivered, etc.).
- **Messages Center**: Read and delete contact queries sent by customers.
- **Newsletter List**: Manage and export active newsletter subscribers.

---

## 🛠️ Tech Stack
- **Frontend**: HTML5, Vanilla CSS3 (Jost & Cormorant Garamond Typography), JavaScript (ES6+).
- **Backend**: Node.js, Express.js.
- **Database**: NeDB-promises (Serverless, file-based database).
- **Authentication**: Express Session, BCryptJS password hashing.
- **File Uploads**: Multer.

---

## 🚀 Getting Started

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed on your computer.

### Installation & Run

1. Clone or download the repository to your local machine.
2. In your terminal, navigate to the project directory:
   ```bash
   cd website
   ```
3. Install the dependencies:
   ```bash
   npm install
   ```
4. Run the website server:
   ```bash
   node server.js
   ```
5. Alternatively, on Windows, double-click the `START AURA WEBSITE.bat` file in the project folder to check dependencies and run the server automatically.

The server will start running on:
- **Shopfront**: [http://localhost:3000](http://localhost:3000)
- **Admin Panel**: [http://localhost:3000/admin-panel](http://localhost:3000/admin-panel)

---

## 🔑 Admin Credentials
To access the Admin Panel, navigate to `/admin-panel` and use the following seeded developer credentials:
- **Email**: `admin@aura.pk`
- **Password**: `admin123`
