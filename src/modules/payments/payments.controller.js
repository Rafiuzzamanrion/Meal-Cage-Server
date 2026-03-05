const stripe = require('stripe')(process.env.PAYMENT_SECRETE_KEY);
const Payment = require('../../models/Payment');
const Cart = require('../../models/Cart');
const Menu = require('../../models/Menu');

// POST /create-payment-intent
const createPaymentIntent = async (req, res, next) => {
    try {
        const { price } = req.body;
        const amount = Math.ceil(price * 100);
        if (amount < 100) return res.status(400).json({ error: true, message: 'Invalid amount: minimum is $1.00' });
        const paymentIntent = await stripe.paymentIntents.create({
            amount,
            currency: 'usd',
            payment_method_types: ['card'],
        });
        res.json({ clientSecret: paymentIntent.client_secret });
    } catch (err) {
        next(err);
    }
};

// POST /payments — save completed payment and clear cart
const savePayment = async (req, res, next) => {
    try {
        const payment = req.body;
        const insertResult = await Payment.create(payment);
        // Clear cart items paid for
        const deleteResult = await Cart.deleteMany({
            _id: { $in: payment.cartItems.map((id) => id) },
        });
        res.status(201).json({ insertResult, deleteResult });
    } catch (err) {
        next(err);
    }
};

// GET /payments?email= — payment history for a user
const getPaymentHistory = async (req, res, next) => {
    try {
        const { email } = req.query;
        const filter = email ? { email } : {};
        const payments = await Payment.find(filter).sort({ createdAt: -1 });
        res.json(payments);
    } catch (err) {
        next(err);
    }
};

// GET /admin-states — admin dashboard stats
const getAdminStats = async (req, res, next) => {
    try {
        const [usersCount, menuCount, ordersCount, payments] = await Promise.all([
            require('../../models/User').countDocuments(),
            Menu.countDocuments(),
            Payment.countDocuments(),
            Payment.find({}, 'price'),
        ]);
        const revenue = payments.reduce((sum, p) => sum + (p.price || 0), 0);
        res.json({ users: usersCount, menuItems: menuCount, orders: ordersCount, revenue });
    } catch (err) {
        next(err);
    }
};

// GET /chart-data — admin chart: menu items from all payments
const getChartDataAdmin = async (req, res, next) => {
    try {
        const paymentsData = await Payment.find({}, 'foodId');
        const foodIds = paymentsData.flatMap((p) => p.foodId || []);
        const menuItems = await Menu.find({ _id: { $in: foodIds } });
        res.json(menuItems);
    } catch (err) {
        next(err);
    }
};

// GET /chart-data-user?email= — user chart: menu items from user's payments
const getChartDataUser = async (req, res, next) => {
    try {
        const { email } = req.query;
        const paymentsData = await Payment.find({ email }, 'foodId');
        const foodIds = paymentsData.flatMap((p) => p.foodId || []);
        const menuItems = await Menu.find({ _id: { $in: foodIds } });
        res.json(menuItems);
    } catch (err) {
        next(err);
    }
};

// GET /paymentHistory?email= — alias kept for backward compat
const getPaymentHistoryAlias = getPaymentHistory;

module.exports = {
    createPaymentIntent,
    savePayment,
    getPaymentHistory,
    getAdminStats,
    getChartDataAdmin,
    getChartDataUser,
    getPaymentHistoryAlias,
};
