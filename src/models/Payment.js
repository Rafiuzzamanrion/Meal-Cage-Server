const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
    {
        email: { type: String, required: true, lowercase: true, trim: true },
        price: { type: Number, required: true, min: 0 },
        transactionId: { type: String },
        cartItems: [{ type: String }],
        foodId: [{ type: String }],
        foodNames: [{ type: String }],
        status: { type: String, enum: ['pending', 'paid', 'failed'], default: 'paid' },
    },
    { timestamps: true }
);

paymentSchema.index({ email: 1 });

module.exports = mongoose.model('Payment', paymentSchema, 'payments');
