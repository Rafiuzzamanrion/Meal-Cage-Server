const LoyaltyPoints = require('../../models/LoyaltyPoints');

// GET /loyalty/my-points — authenticated user's points, tier, history
const getMyPoints = async (req, res, next) => {
    try {
        const userEmail = req.decoded.email;
        let record = await LoyaltyPoints.findOne({ userEmail });
        if (!record) {
            // Auto-create a record if the user hasn't earned any points yet
            record = await LoyaltyPoints.create({ userEmail });
        }
        res.json(record);
    } catch (err) {
        next(err);
    }
};

// POST /loyalty/earn — add points after a successful order
// Body: { userEmail, orderId, amount }
const earnPoints = async (req, res, next) => {
    try {
        const { userEmail, orderId, amount } = req.body;
        if (!userEmail || !amount) {
            return res.status(400).json({ error: true, message: 'userEmail and amount are required' });
        }
        const pointsToAdd = Math.floor(amount); // 1 point per $1 spent
        let record = await LoyaltyPoints.findOne({ userEmail });
        if (!record) record = new LoyaltyPoints({ userEmail });

        record.points += pointsToAdd;
        record.history.push({
            action: `Order #${orderId || 'N/A'}`,
            points: pointsToAdd,
            type: 'earn',
            date: new Date(),
        });
        record.recalculateTier();
        await record.save();

        res.json({ success: true, newBalance: record.points, tier: record.tier });
    } catch (err) {
        next(err);
    }
};

// POST /loyalty/redeem — deduct points for a reward/discount
// Body: { userEmail, points }
const redeemPoints = async (req, res, next) => {
    try {
        const { userEmail, points } = req.body;
        if (!userEmail || !points) {
            return res.status(400).json({ error: true, message: 'userEmail and points are required' });
        }
        const record = await LoyaltyPoints.findOne({ userEmail });
        if (!record || record.points < points) {
            return res.status(400).json({ error: true, message: 'Insufficient loyalty points' });
        }
        record.points -= points;
        record.history.push({
            action: 'Redeemed for Discount',
            points: -points,
            type: 'redeem',
            date: new Date(),
        });
        record.recalculateTier();
        await record.save();

        res.json({ success: true, newBalance: record.points, tier: record.tier });
    } catch (err) {
        next(err);
    }
};

// PATCH /loyalty/recalculate-tier — recalculate tier for a user
// Body: { userEmail }
const recalculateTier = async (req, res, next) => {
    try {
        const { userEmail } = req.body;
        if (!userEmail) {
            return res.status(400).json({ error: true, message: 'userEmail is required' });
        }
        const record = await LoyaltyPoints.findOne({ userEmail });
        if (!record) return res.status(404).json({ error: true, message: 'Loyalty record not found' });
        record.recalculateTier();
        await record.save();
        res.json({ success: true, tier: record.tier, points: record.points });
    } catch (err) {
        next(err);
    }
};

module.exports = { getMyPoints, earnPoints, redeemPoints, recalculateTier };
