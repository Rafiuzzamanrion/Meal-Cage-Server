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
        const { email, search, status } = req.query;
        const filter = {};
        
        if (email) filter.email = email;
        if (status) filter.status = status;
        if (search) {
            filter.$or = [
                { transactionId: { $regex: search, $options: 'i' } },
                { foodNames: { $regex: search, $options: 'i' } }
            ];
        }

        const payments = await Payment.find(filter).sort({ createdAt: -1 });
        res.json(payments);
    } catch (err) {
        next(err);
    }
};

// GET /admin-states — admin dashboard stats
const getAdminStats = async (req, res, next) => {
    try {
        const Reservation = require('../../models/Reservation');
        const Review = require('../../models/Review');
        const Cart = require('../../models/Cart');
        const LoyaltyPoints = require('../../models/LoyaltyPoints');

        const [usersCount, menuCount, ordersCount, payments, reservationsAll, reviewsData, cartCount, allLoyalty] = await Promise.all([
            require('../../models/User').countDocuments(),
            Menu.countDocuments(),
            Payment.countDocuments(),
            Payment.find({}, 'price createdAt email foodId foodNames'),
            Reservation.find({}, 'status createdAt'),
            Review.find({}, 'rating'),
            Cart.countDocuments(),
            LoyaltyPoints.find({}, 'tier points'),
        ]);

        const revenue = payments.reduce((sum, p) => sum + (p.price || 0), 0);
        const avgOrderValue = ordersCount > 0 ? revenue / ordersCount : 0;
        const avgRating = reviewsData.length > 0
            ? reviewsData.reduce((sum, r) => sum + (r.rating || 0), 0) / reviewsData.length
            : 0;

        // Reservation breakdown
        const reservationsCount = reservationsAll.length;
        const pendingReservations = reservationsAll.filter(r => r.status === 'pending').length;
        const confirmedReservations = reservationsAll.filter(r => r.status === 'confirmed').length;
        const reservationConfirmRate = reservationsCount > 0
            ? parseFloat(((confirmedReservations / reservationsCount) * 100).toFixed(1))
            : 0;
            
        const resStatusCount = {};
        reservationsAll.forEach(r => {
            const rawStatus = r.status || 'unknown';
            const statusKey = rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1);
            resStatusCount[statusKey] = (resStatusCount[statusKey] || 0) + 1;
        });
        const reservationStatusData = Object.entries(resStatusCount).map(([name, value]) => ({ name, value }));

        // Repeat customers (users with >1 payment)
        const emailOrderCount = {};
        payments.forEach(p => { emailOrderCount[p.email] = (emailOrderCount[p.email] || 0) + 1; });
        const repeatCustomers = Object.values(emailOrderCount).filter(c => c > 1).length;

        // Most popular dish and Top 5 dishes
        const dishCount = {};
        payments.forEach(p => (p.foodNames || []).forEach(name => {
            dishCount[name] = (dishCount[name] || 0) + 1;
        }));
        const sortedDishes = Object.entries(dishCount).sort((a, b) => b[1] - a[1]);
        const topDish = sortedDishes[0];
        const mostPopularDish = topDish ? { name: topDish[0], orders: topDish[1] } : null;
        const topDishes = sortedDishes.slice(0, 5).map(d => ({ name: d[0], orders: d[1] }));

        // Loyalty tier distribution
        const tierCount = { Bronze: 0, Silver: 0, Gold: 0, Platinum: 0 };
        allLoyalty.forEach(l => { if (tierCount[l.tier] !== undefined) tierCount[l.tier]++; });
        const loyaltyTierDistribution = Object.entries(tierCount).map(([tier, count]) => ({ tier, count }));

        // Time of Day and Day of Week distributions
        const timeOfDayCount = { Morning: 0, Lunch: 0, Afternoon: 0, Dinner: 0, Night: 0 };
        const dayOfWeekCount = { Sun: 0, Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0 };
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

        payments.forEach(p => {
            const date = new Date(p.createdAt);
            const hour = date.getHours();
            if (hour >= 6 && hour < 11) timeOfDayCount.Morning++;
            else if (hour >= 11 && hour < 14) timeOfDayCount.Lunch++;
            else if (hour >= 14 && hour < 17) timeOfDayCount.Afternoon++;
            else if (hour >= 17 && hour < 22) timeOfDayCount.Dinner++;
            else timeOfDayCount.Night++;
            
            const dayIdx = date.getDay();
            if (dayIdx >= 0 && dayIdx <= 6) dayOfWeekCount[days[dayIdx]]++;
        });
        const salesByTimeOfDay = Object.entries(timeOfDayCount).map(([time, count]) => ({ time, count }));
        const salesByDayOfWeek = Object.entries(dayOfWeekCount).map(([day, count]) => ({ day, count }));

        // Monthly revenue for last 6 months
        const now = new Date();
        const monthlyRevenue = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const start = new Date(d.getFullYear(), d.getMonth(), 1);
            const end = new Date(d.getFullYear(), d.getMonth() + 1, 1);
            const monthPayments = payments.filter(p => {
                const pd = new Date(p.createdAt);
                return pd >= start && pd < end;
            });
            const monthTotal = monthPayments.reduce((sum, p) => sum + (p.price || 0), 0);
            monthlyRevenue.push({
                month: start.toLocaleString('default', { month: 'short' }),
                revenue: parseFloat(monthTotal.toFixed(2)),
                orders: monthPayments.length,
            });
        }

        // Recent 7 Days Sales History
        const recentSalesHistory = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
            const start = new Date(d.getFullYear(), d.getMonth(), d.getDate());
            const end = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
            
            const dayPayments = payments.filter(p => {
                const pd = new Date(p.createdAt);
                return pd >= start && pd < end;
            });
            const dayTotal = dayPayments.reduce((sum, p) => sum + (p.price || 0), 0);
            recentSalesHistory.push({
                date: start.toLocaleDateString('default', { month: 'short', day: 'numeric' }),
                revenue: parseFloat(dayTotal.toFixed(2)),
                orders: dayPayments.length
            });
        }

        res.json({
            users: usersCount,
            menuItems: menuCount,
            orders: ordersCount,
            revenue: parseFloat(revenue.toFixed(2)),
            reservations: reservationsCount,
            pendingReservations,
            confirmedReservations,
            reservationConfirmRate,
            avgOrderValue: parseFloat(avgOrderValue.toFixed(2)),
            reviews: reviewsData.length,
            avgRating: parseFloat(avgRating.toFixed(1)),
            cartItems: cartCount,
            repeatCustomers,
            mostPopularDish,
            topDishes,
            loyaltyTierDistribution,
            salesByTimeOfDay,
            salesByDayOfWeek,
            monthlyRevenue,
            recentSalesHistory,
            reservationStatusData,
        });
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
