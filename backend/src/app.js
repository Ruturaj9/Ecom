const express = require('express');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const csurf = require('csurf');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const allowedOrigin = process.env.CORS_ORIGIN || 'http://localhost:4200';
app.use(cors({
  origin: allowedOrigin,
  credentials: true,
}));

const csrfProtection = csurf({
  cookie: {
    httpOnly: false,
    sameSite: 'lax'
  }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 12,
  message: { error: 'Too many requests from this IP, please try again later.' }
});

app.get('/health', (req, res) => res.json({ ok: true }));

app.get('/auth/csrf-token', csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

app.use('/auth', authLimiter, authRoutes(csrfProtection));
app.use('/products', productRoutes);

app.use(errorHandler);

module.exports = app;
