const express = require('express');
const cors = require('cors');

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

const errorHandler = require('./middleware/errorHandler');

const app = express();

const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://meal-cage-client.vercel.app',
    ...(process.env.CLIENT_URL ? [process.env.CLIENT_URL] : []),
];

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl, Postman)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
}));
app.use(express.json());

app.get('/', (req, res) => res.json({ status: 'ok', message: '🍽️  MealCage API is running' }));


app.use('/jwt', authRoutes);

app.use('/menu', menuRoutes);
app.use('/review', reviewsRoutes);
app.use('/carts', cartsRoutes);
app.use('/users', usersRoutes);

app.use('/', paymentsRoutes);

app.use('/', reservationsRoutes);

app.use('/newsletter', newsletterRoutes);
app.use('/gift-cards', giftCardsRoutes);
app.use('/loyalty', loyaltyRoutes);
app.use('/contact', contactRoutes);

app.use(errorHandler);

module.exports = app;
