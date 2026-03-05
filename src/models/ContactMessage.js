const mongoose = require('mongoose');

const contactMessageSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
            match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
        },
        message: { type: String, required: true, trim: true },
        submittedAt: { type: Date, default: Date.now },
        isRead: { type: Boolean, default: false },
    },
    { timestamps: false }
);

contactMessageSchema.index({ submittedAt: -1 });
contactMessageSchema.index({ isRead: 1 });

module.exports = mongoose.model('ContactMessage', contactMessageSchema, 'contactMessages');
