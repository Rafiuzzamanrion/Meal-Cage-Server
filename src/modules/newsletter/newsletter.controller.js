const { validationResult } = require('express-validator');
const Newsletter = require('../../models/Newsletter');

// POST /newsletter/subscribe
const subscribe = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: true, message: errors.array()[0].msg });
        }
        const { email } = req.body;
        const subscriber = await Newsletter.create({ email });
        res.status(201).json({ success: true, subscriber });
    } catch (err) {
        // Duplicate key error — email already subscribed
        if (err.code === 11000) {
            return res.status(409).json({ error: true, message: 'This email is already subscribed' });
        }
        next(err);
    }
};

// GET /newsletter/subscribers — admin, with pagination
const getSubscribers = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 20;
        const skip = (page - 1) * limit;

        const [subscribers, total] = await Promise.all([
            Newsletter.find().sort({ subscribedAt: -1 }).skip(skip).limit(limit),
            Newsletter.countDocuments(),
        ]);

        res.json({
            subscribers,
            pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
        });
    } catch (err) {
        next(err);
    }
};

module.exports = { subscribe, getSubscribers };
