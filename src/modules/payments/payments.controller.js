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
        const User = require('../../models/User');
        const Reservation = require('../../models/Reservation');
        const Review = require('../../models/Review');
        const Cart = require('../../models/Cart');
        const LoyaltyPoints = require('../../models/LoyaltyPoints');

        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        // Fetch everything optimally in parallel
        const [
            usersCount,
            menuCount,
            cartCount,
            ordersCount,
            paymentStatsAgg,
            reviewStatsAgg,
            repeatCustAgg,
            topDishesAgg,
            reservationStatusAgg,
            loyaltyDistributionAgg,
            recentPayData
        ] = await Promise.all([
            User.countDocuments(),
            Menu.countDocuments(),
            Cart.countDocuments(),
            Payment.countDocuments(),
            // 1. Core Revenue Aggregation
            Payment.aggregate([
                {$group: {_id: null, revenue: {$sum: '$price'}, avgOrderValue: {$avg: '$price'}}}
            ]),
            // 2. Reviews Aggregation
            Review.aggregate([
                {$group: {_id: null, avgRating: {$avg: '$rating'}, totalReviews: {$sum: 1}}}
            ]),
            // 3. Repeat Customers
            Payment.aggregate([
                {$group: {_id: '$email', count: {$sum: 1}}},
                {$match: {count: {$gt: 1}}},
                {$count: 'repeatCustomers'}
            ]),
            // 4. Most Popular Dishes
            Payment.aggregate([
                {$unwind: '$foodNames'},
                {$group: {_id: '$foodNames', orders: {$sum: 1}}},
                {$sort: {orders: -1}},
                {$limit: 5}
            ]),
            // 5. General Status Metrics
            Reservation.aggregate([{$group: {_id: '$status', count: {$sum: 1}}}]),
            LoyaltyPoints.aggregate([{$group: {_id: '$tier', count: {$sum: 1}}}]),

            // 6. Time Series Data (Limit to recent 6 months to prevent Out Of Memory on massive dataset)
            Payment.find({createdAt: {$gte: sixMonthsAgo}}, 'price createdAt email').lean()
        ]);

        // Process Database Aggregation Results
        const revenue = paymentStatsAgg.length > 0 ? paymentStatsAgg[0].revenue : 0;
        const avgOrderValue = paymentStatsAgg.length > 0 ? paymentStatsAgg[0].avgOrderValue : 0;

        const reviews = reviewStatsAgg.length > 0 ? reviewStatsAgg[0].totalReviews : 0;
        const avgRating = reviewStatsAgg.length > 0 ? reviewStatsAgg[0].avgRating : 0;

        const repeatCustomers = repeatCustAgg.length > 0 ? repeatCustAgg[0].repeatCustomers : 0;

        const topDishes = topDishesAgg.map(d => ({name: d._id, orders: d.orders}));
        const mostPopularDish = topDishes.length > 0 ? topDishes[0] : null;

        // Process Reservations
        let reservationsCount = 0;
        let pendingReservations = 0;
        let confirmedReservations = 0;
        const resStatusCount = {};

        reservationStatusAgg.forEach(r => {
            const count = r.count;
            reservationsCount += count;
            const statusStr = (r._id || 'unknown').toLowerCase();

            if (statusStr === 'pending') pendingReservations += count;
            if (['confirmed', 'delivered'].includes(statusStr)) confirmedReservations += count;

            const statusKey = statusStr.charAt(0).toUpperCase() + statusStr.slice(1);
            resStatusCount[statusKey] = (resStatusCount[statusKey] || 0) + count;
        });

        const reservationStatusData = Object.entries(resStatusCount).map(([name, value]) => ({name, value}));
        const reservationConfirmRate = reservationsCount > 0
          ? parseFloat(((confirmedReservations / reservationsCount) * 100).toFixed(1))
          : 0;

        // Process Loyalty Distribution
        const tierCountMap = {Bronze: 0, Silver: 0, Gold: 0, Platinum: 0};
        loyaltyDistributionAgg.forEach(l => {
            if (l._id && tierCountMap[l._id] !== undefined) tierCountMap[l._id] = l.count;
        });
        const loyaltyTierDistribution = Object.entries(tierCountMap).map(([tier, count]) => ({tier, count}));

        // Process Detailed Time Metrics efficiently using JS dates logic
        const timeOfDayCount = {Morning: 0, Lunch: 0, Afternoon: 0, Dinner: 0, Night: 0};
        const dayOfWeekCount = {Sun: 0, Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0};
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

        recentPayData.forEach(p => {
            const hour = p.createdAt.getHours();
            if (hour >= 6 && hour < 11) timeOfDayCount.Morning++;
            else if (hour >= 11 && hour < 14) timeOfDayCount.Lunch++;
            else if (hour >= 14 && hour < 17) timeOfDayCount.Afternoon++;
            else if (hour >= 17 && hour < 22) timeOfDayCount.Dinner++;
            else timeOfDayCount.Night++;

            const dayIdx = p.createdAt.getDay();
            if (dayIdx >= 0 && dayIdx <= 6) dayOfWeekCount[days[dayIdx]]++;
        });

        const salesByTimeOfDay = Object.entries(timeOfDayCount).map(([time, count]) => ({time, count}));
        const salesByDayOfWeek = Object.entries(dayOfWeekCount).map(([day, count]) => ({day, count}));

        // Monthly revenue for last 6 months (safely creating gaps for empty months in JS)
        const now = new Date();
        const monthlyRevenue = [];
        for (let i = 5; i >= 0; i--) {
            const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

            const monthPayments = recentPayData.filter(p => p.createdAt >= start && p.createdAt < end);
            const monthTotal = monthPayments.reduce((sum, p) => sum + (p.price || 0), 0);

            monthlyRevenue.push({
                month: start.toLocaleString('default', {month: 'short'}),
                revenue: parseFloat(monthTotal.toFixed(2)),
                orders: monthPayments.length,
            });
        }

        // Recent 7 Days Sales History (safely creating gaps for empty days in JS)
        const recentSalesHistory = [];
        for (let i = 6; i >= 0; i--) {
            const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
            const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i + 1);

            const dayPayments = recentPayData.filter(p => p.createdAt >= start && p.createdAt < end);
            const dayTotal = dayPayments.reduce((sum, p) => sum + (p.price || 0), 0);

            recentSalesHistory.push({
                date: start.toLocaleDateString('default', {month: 'short', day: 'numeric'}),
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
            reviews,
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
        const {email} = req.query;
        const menuItems = await Payment.aggregate([
            {
                $match: {email}
            },
            {
                $sort: {createdAt: -1}
            },
            {
                $lookup: {
                    from: 'menus',
                    localField: 'foodId',
                    foreignField: '_id',
                    as: 'menuItems'
                }
            },
            {
                $unwind: {
                    path: '$menuItems',
                    preserveNullAndEmptyArrays: true
                }
            },
        ]);
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
