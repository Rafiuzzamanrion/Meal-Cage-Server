const express = require('express');
const cors = require('cors');

// ── Route modules ──────────────────────────────────────────────────────────────
const authRoutes = require('./modules/auth/auth.routes');
const menuRoutes = require('./modules/menu/menu.routes');
const reviewsRoutes = require('./modules/reviews/reviews.routes');
const cartsRoutes = require('./modules/carts/carts.routes');
const usersRoutes = require('./modules/users/users.routes');
const paymentsRoutes = require('./modules/payments/payments.routes');
const reservationsRoutes = require('./modules/reservations/reservations.routes');
const newsletterRoutes = require('./modules/newsletter/newsletter.routes');
const giftCardsRoutes = require('./modules/giftCards/giftCards.routes');
const loyaltyRoutes = require('./modules/loyalty/loyalty.routes');
const contactRoutes = require('./modules/contact/contact.routes');

// ── Error handler (must be last) ───────────────────────────────────────────────
const errorHandler = require('./middleware/errorHandler');

const app = express();

// ── Global middleware ──────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── Health check ───────────────────────────────────────────────────────────────
app.get('/', (req, res) => res.json({ status: 'ok', message: '🍽️  MealCage API is running' }));

// ── Routes ─────────────────────────────────────────────────────────────────────

// Auth
app.use('/jwt', authRoutes);

// Core resources
app.use('/menu', menuRoutes);
app.use('/review', reviewsRoutes);
app.use('/carts', cartsRoutes);
app.use('/users', usersRoutes);

// Payments (mounted at root — routes have distinct names like /create-payment-intent)
app.use('/', paymentsRoutes);

// Reservations (mounted at root — uses /reservation and /bookingsHistory)
app.use('/', reservationsRoutes);

// New features
app.use('/newsletter', newsletterRoutes);
app.use('/gift-cards', giftCardsRoutes);
app.use('/loyalty', loyaltyRoutes);
app.use('/contact', contactRoutes);

// ── Global error handler ───────────────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
