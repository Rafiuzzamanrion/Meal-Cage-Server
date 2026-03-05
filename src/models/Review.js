const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
    {
        name: { type: String, trim: true },
        email: { type: String, lowercase: true, trim: true },
        rating: { type: Number, min: 1, max: 5 },
        details: { type: String, trim: true },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Review', reviewSchema, 'reviews');
