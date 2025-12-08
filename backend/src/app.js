// app.js
const express = require('express');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const csurf = require('csurf');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const morgan = require('morgan');

// Routes
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const sliderRoutes = require('./routes/slider');
const contactRoutes = require('./routes/contact');
const adminProducts = require('./routes/admin/products');
const adminLogs = require('./routes/admin/logs');
const adminCategories = require('./routes/admin/categories');
const adminUpload = require('./routes/admin/upload');
const adminProductImages = require('./routes/admin/productImages');
const adminSlider = require('./routes/admin/slider');
const adminContactMessages = require('./routes/admin/contactMessages');

// Middleware
const errorHandler = require('./middleware/errorHandler');
const requireAdmin = require('./middleware/requireAdmin');

// Models
const Product = require('./models/Product');

const app = express();

/* ------------------------------------------------------
   GLOBAL MIDDLEWARE
------------------------------------------------------- */

// Security headers
app.use(helmet());

// Compression for faster responses
app.use(compression());

// Request body limits
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// Cookies
app.use(cookieParser());

// Structured request logs (only in dev)
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// CORS for Angular frontend
app.use(
  cors({
    origin: 'http://localhost:4200',
    credentials: true,
  })
);

/* ------------------------------------------------------
   SECURITY: CSRF + RATE LIMITING
------------------------------------------------------- */

const csrfProtection = csurf({
  cookie: {
    httpOnly: false, // preserving your logic
    sameSite: 'lax',
  },
});

const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 12,
  message: { error: 'Too many attempts, try later.' },
});

/* ------------------------------------------------------
   HEALTH CHECK
------------------------------------------------------- */

app.get('/health', (req, res) => {
  res.json({ ok: true });
});

/* ------------------------------------------------------
   CSRF TOKEN ENDPOINT
------------------------------------------------------- */

app.get('/auth/csrf-token', csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

/* ------------------------------------------------------
   PUBLIC ROUTES
------------------------------------------------------- */

app.use('/auth', rateLimiter, authRoutes(csrfProtection));
app.use('/products', productRoutes);
app.use('/sliders', sliderRoutes);
app.use('/contact', contactRoutes);

/* ------------------------------------------------------
   ADMIN ROUTES (Protected)
------------------------------------------------------- */

app.use('/admin/products', adminProducts);
app.use('/admin/logs', adminLogs);
app.use('/admin/categories', adminCategories);
app.use('/admin/upload', adminUpload);
app.use('/admin/products/upload', adminProductImages);
app.use('/admin/slider', requireAdmin(['admin']), adminSlider);
app.use('/admin/contact-messages', adminContactMessages);

/* ------------------------------------------------------
   TEST ENDPOINTS (Preserved)
------------------------------------------------------- */

// Root welcome route
app.get('/', (req, res) => {
  res.json({
    status: 'Backend running',
    message: 'Welcome to Ecom API',
  });
});

// Debug product insertion
app.post('/test-insert-product', async (req, res) => {
  try {
    const product = await Product.create({
      title: 'Test Product',
      description: 'Inserted for testing',
      price: 123,
    });

    res.json({
      message: 'Product inserted successfully',
      product,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin protected test
app.get('/admin/test', requireAdmin(), (req, res) => {
  res.json({
    message: 'Admin access verified',
    admin: req.admin,
  });
});

/* ------------------------------------------------------
   GLOBAL ERROR HANDLER
------------------------------------------------------- */

app.use(errorHandler);

module.exports = app;
