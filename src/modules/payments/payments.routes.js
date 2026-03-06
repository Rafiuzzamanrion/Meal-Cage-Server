const express = require('express');
const verifyJWT = require('../../middleware/verifyJWT');
const verifyAdmin = require('../../middleware/verifyAdmin');
const {
    createPaymentIntent,
    savePayment,
    getPaymentHistory,
    getAdminStats,
    getChartDataAdmin,
    getChartDataUser,
    getPaymentHistoryAlias,
} = require('./payments.controller');

const router = express.Router();

router.post('/create-payment-intent', verifyJWT, createPaymentIntent);
router.post('/payments', verifyJWT, savePayment);
router.get('/payments', verifyJWT, getPaymentHistory);
router.get('/paymentHistory', verifyJWT, getPaymentHistoryAlias);
router.get('/admin-states', verifyJWT, verifyAdmin, getAdminStats);
router.get('/chart-data', verifyJWT, verifyAdmin, getChartDataAdmin);
router.get('/chart-data-user', verifyJWT, getChartDataUser);

module.exports = router;
