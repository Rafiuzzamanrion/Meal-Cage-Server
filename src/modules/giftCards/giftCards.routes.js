const express = require('express');
const verifyJWT = require('../../middleware/verifyJWT');
const verifyAdmin = require('../../middleware/verifyAdmin');
const { purchaseGiftCard, getMyCards, redeemGiftCard, getAllGiftCards } = require('./giftCards.controller');

const router = express.Router();

router.post('/purchase', verifyJWT, purchaseGiftCard);
router.get('/my-cards', verifyJWT, getMyCards);
router.post('/redeem', verifyJWT, redeemGiftCard);
router.get('/', verifyJWT, verifyAdmin, getAllGiftCards);

module.exports = router;
