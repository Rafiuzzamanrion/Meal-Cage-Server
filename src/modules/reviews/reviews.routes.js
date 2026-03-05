const express = require('express');
const { getAllReviews } = require('./reviews.controller');

const router = express.Router();

router.get('/', getAllReviews);

module.exports = router;
