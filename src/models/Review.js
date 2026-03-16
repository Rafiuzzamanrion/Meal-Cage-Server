const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
    {
        menuItemId: { type: String, required: false }, // optional for legacy reviews
        userId: { type: String, required: false }, // for reference to users collection
        userAvatar: { type: String, required: false }, // cache avatar for fast UI rendering
        name: { type: String, trim: true },
        email: { type: String, lowercase: true, trim: true },
        rating: { type: Number, min: 1, max: 5, required: true },
        details: { type: String, trim: true },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Review', reviewSchema, 'reviews');
