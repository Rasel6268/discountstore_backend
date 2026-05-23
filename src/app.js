const express = require('express');
const cors = require('cors');
const connectDb = require('./config/db');
const cookieParser = require('cookie-parser');
const colorRoutes = require('./routers/color.route');

const app = express();

// =======================
// DATABASE CONNECTION
// =======================
connectDb();

// =======================
// MIDDLEWARE
// =======================
app.use(express.json());
app.use(cookieParser());

// =======================
// CORS CONFIG (PRODUCTION SAFE)
// =======================
const allowedOrigins = [
  'http://localhost:3000',
  'https://discount-mart-system-frontend.vercel.app',
  'https://discountstorebd.com',
  'https://www.discountstorebd.com',
];

app.use(
  cors({
    origin: function (origin, callback) {
      // allow Postman / server-to-server requests
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        return callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);

// =======================
// TEST ROUTE
// =======================
app.get('/', (req, res) => {
  res.send('🚀 Your server is cooking');
});

// =======================
// ROUTES
// =======================
app.use('/auth', require('./routers/auth.route'));
app.use('/categories', require('./routers/category.route'));
app.use('/brands', require('./routers/brand.route'));
app.use('/products', require('./routers/product.route'));
app.use('/coupons', require('./routers/coupon.routes'));
app.use('/orders', require('./routers/order.route'));
app.use('/colors', colorRoutes);

// =======================
// ERROR HANDLING
// =======================
app.use((err, req, res, next) => {
  console.error('Server Error:', err.message);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

module.exports = app;