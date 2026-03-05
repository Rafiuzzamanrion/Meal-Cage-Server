const mongoose = require('mongoose');

const TIER_THRESHOLDS = { Bronze: 0, Silver: 500, Gold: 1000, Platinum: 1500 };

const historyEntrySchema = new mongoose.Schema(
    {
        action: { type: String, required: true },
        points: { type: Number, required: true },
        type: { type: String, enum: ['earn', 'redeem'], required: true },
        date: { type: Date, default: Date.now },
    },
    { _id: false }
);

const loyaltyPointsSchema = new mongoose.Schema(
    {
        userEmail: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        points: { type: Number, default: 0, min: 0 },
        tier: {
            type: String,
            enum: ['Bronze', 'Silver', 'Gold', 'Platinum'],
            default: 'Bronze',
        },
        history: [historyEntrySchema],
    },
    { timestamps: true }
);

// Auto-calculate tier based on total points
loyaltyPointsSchema.methods.recalculateTier = function () {
    const p = this.points;
    if (p >= TIER_THRESHOLDS.Platinum) this.tier = 'Platinum';
    else if (p >= TIER_THRESHOLDS.Gold) this.tier = 'Gold';
    else if (p >= TIER_THRESHOLDS.Silver) this.tier = 'Silver';
    else this.tier = 'Bronze';
};

loyaltyPointsSchema.statics.TIER_THRESHOLDS = TIER_THRESHOLDS;

module.exports = mongoose.model('LoyaltyPoints', loyaltyPointsSchema, 'loyaltyPoints');
