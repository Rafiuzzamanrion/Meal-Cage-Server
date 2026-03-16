const Review = require('../../models/Review');

// GET /review — all reviews
const getAllReviews = async (req, res, next) => {
    try {
        const reviews = await Review.find().sort({ createdAt: -1 });
        res.json(reviews);
    } catch (err) {
        next(err);
    }
};

// GET /review/menu/:menuItemId — reviews for a specific product
const getReviewsByMenuId = async (req, res, next) => {
    try {
        const { menuItemId } = req.params;
        const reviews = await Review.find({ menuItemId }).sort({ createdAt: -1 });
        res.json(reviews);
    } catch (err) {
        next(err);
    }
};

// POST /review — submit a new review
const createReview = async (req, res, next) => {
    try {
        const reviewData = req.body;
        // Basic validation
        if (!reviewData.menuItemId || !reviewData.rating) {
            return res.status(400).json({ error: true, message: 'menuItemId and rating are required' });
        }
        const newReview = new Review(reviewData);
        const savedReview = await newReview.save();
        res.status(201).json({ insertedId: savedReview._id, message: 'Review added successfully' });
    } catch (err) {
        next(err);
    }
};

module.exports = { getAllReviews, getReviewsByMenuId, createReview };
