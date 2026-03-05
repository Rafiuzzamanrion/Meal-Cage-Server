const mongoose = require('mongoose');

const menuSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        category: { type: String, required: true, trim: true },
        price: { type: Number, required: true, min: 0 },
        recipe: { type: String, trim: true },
        image: { type: String },
        dietaryTags: {
            type: [String],
            enum: ['vegan', 'vegetarian', 'glutenFree', 'organic', 'bestSeller'],
            default: [],
        },
    },
    { timestamps: true }
);

// Index for faster dietary tag filtering
menuSchema.index({ dietaryTags: 1 });
menuSchema.index({ category: 1 });

module.exports = mongoose.model('Menu', menuSchema, 'menu');
