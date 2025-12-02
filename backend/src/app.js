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
app.use(cookieParser());

app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true
}));

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

app.use(errorHandler);

module.exports = app;
