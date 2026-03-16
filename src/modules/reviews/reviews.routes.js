const express = require('express');
const { getAllReviews, getReviewsByMenuId, createReview } = require('./reviews.controller');
const verifyJWT = require('../../middleware/verifyJWT');

const router = express.Router();

router.get('/', getAllReviews);
router.get('/menu/:menuItemId', getReviewsByMenuId);
router.post('/', verifyJWT, createReview);

module.exports = router;
