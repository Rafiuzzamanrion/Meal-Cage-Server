const express = require('express');
const verifyJWT = require('../../middleware/verifyJWT');
const { getMyPoints, earnPoints, redeemPoints, recalculateTier } = require('./loyalty.controller');

const router = express.Router();

router.get('/my-points', verifyJWT, getMyPoints);
router.post('/earn', verifyJWT, earnPoints);
router.post('/redeem', verifyJWT, redeemPoints);
router.patch('/recalculate-tier', verifyJWT, recalculateTier);

module.exports = router;
