const { validationResult } = require('express-validator');
const ContactMessage = require('../../models/ContactMessage');

// POST /contact — submit a contact form message (public)
const submitContact = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: true, message: errors.array()[0].msg });
        }
        const { name, email, message } = req.body;
        const doc = await ContactMessage.create({ name, email, message });
        res.status(201).json({ success: true, id: doc._id });
    } catch (err) {
        next(err);
    }
};

// GET /contact — all messages, newest first (admin)
const getAllMessages = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 20;
        const skip = (page - 1) * limit;
        const [messages, total] = await Promise.all([
            ContactMessage.find().sort({ submittedAt: -1 }).skip(skip).limit(limit),
            ContactMessage.countDocuments(),
        ]);
        res.json({ messages, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } });
    } catch (err) {
        next(err);
    }
};

// PATCH /contact/:id — mark message as read (admin)
const markRead = async (req, res, next) => {
    try {
        const updated = await ContactMessage.findByIdAndUpdate(
            req.params.id,
            { $set: { isRead: req.body.isRead ?? true } },
            { new: true }
        );
        if (!updated) return res.status(404).json({ error: true, message: 'Message not found' });
        res.json(updated);
    } catch (err) {
        next(err);
    }
};

module.exports = { submitContact, getAllMessages, markRead };
