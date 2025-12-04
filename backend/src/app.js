const express = require('express');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const csurf = require('csurf');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const errorHandler = require('./middleware/errorHandler');
const Product = require("./models/Product");
const requireAdmin = require('./middleware/requireAdmin');

const app = express();

app.use(helmet());

// ⬆ Increase JSON & form size limits (needed for long Cloudinary URLs)
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

app.use(cookieParser());

// ⬆ Fix CORS so cookies work
app.use(
  cors({
    origin: 'http://localhost:4200', // direct allow for Angular
    credentials: true
  })
);

const csrfProtection = csurf({
  cookie: {
    httpOnly: false,
    sameSite: "lax"
  }
});

const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 12,
  message: { error: "Too many attempts, try later." }
});

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

app.get("/auth/csrf-token", csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

app.use("/auth", rateLimiter, authRoutes(csrfProtection));
app.use("/products", productRoutes);

app.get("/", (req, res) => {
  res.json({
    status: "Backend running",
    message: "Welcome to Ecom API"
  });
});

app.post("/test-insert-product", async (req, res) => {
  try {
    const product = await Product.create({
      title: "Test Product",
      description: "Inserted for testing",
      price: 123
    });

    res.json({
      message: "Product inserted successfully",
      product
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/admin/test', requireAdmin(), (req, res) => {
  res.json({
    message: 'Admin access verified',
    admin: req.admin
  });
});

// Admin routes
app.use('/admin/products', require('./routes/admin/products'));
app.use('/admin/logs', require('./routes/admin/logs'));
app.use('/admin/categories', require('./routes/admin/categories'));
app.use('/admin/upload', require('./routes/admin/upload'));
app.use('/admin/products/upload', require('./routes/admin/productImages'));
app.use('/admin/slider', require('./routes/admin/slider'));
app.use('/slider', require('./routes/slider'));

app.use(errorHandler);

module.exports = app;
