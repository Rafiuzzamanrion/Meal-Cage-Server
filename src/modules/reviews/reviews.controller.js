const Review = require('../../models/Review');

// GET /review — all reviews
const getAllReviews = async (req, res, next) => {
    try {
        const reviews = await Review.find();
        res.json(reviews);
    } catch (err) {
        next(err);
    }
};

module.exports = { getAllReviews };
