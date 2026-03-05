const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema(
    {
        menuItemId: { type: String, required: true },
        name: { type: String, required: true },
        image: { type: String },
        price: { type: Number, required: true, min: 0 },
        email: { type: String, required: true, lowercase: true, trim: true },
    },
    { timestamps: true }
);

cartSchema.index({ email: 1 });

module.exports = mongoose.model('Cart', cartSchema, 'carts');
