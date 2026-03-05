const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

// Helper to generate unique gift card codes like MEALCAGE-XXXX-YYYY
const generateCode = () => {
    const seg = () => uuidv4().replace(/-/g, '').toUpperCase().substring(0, 4);
    return `MEALCAGE-${seg()}-${seg()}`;
};

const giftCardSchema = new mongoose.Schema(
    {
        code: {
            type: String,
            unique: true,
            default: generateCode,
        },
        amount: { type: Number, required: true, min: 1 },
        tier: {
            type: String,
            required: true,
            enum: ['Bronze', 'Silver', 'Gold', 'Platinum'],
        },
        purchasedBy: { type: String, required: true, lowercase: true, trim: true },
        purchasedAt: { type: Date, default: Date.now },
        paymentIntentId: { type: String }, // Stripe payment intent ID
        isRedeemed: { type: Boolean, default: false },
        redeemedBy: { type: String, default: null, lowercase: true, trim: true },
        redeemedAt: { type: Date, default: null },
    },
    { timestamps: true }
);

giftCardSchema.index({ purchasedBy: 1 });

module.exports = mongoose.model('GiftCard', giftCardSchema, 'giftCards');
