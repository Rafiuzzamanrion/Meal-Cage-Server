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

router.post('/create-payment-intent', createPaymentIntent);
router.post('/payments', savePayment);
router.get('/payments', getPaymentHistory);
router.get('/paymentHistory', getPaymentHistoryAlias);
router.get('/admin-states', verifyJWT, verifyAdmin, getAdminStats);
router.get('/chart-data', verifyJWT, verifyAdmin, getChartDataAdmin);
router.get('/chart-data-user', getChartDataUser);

module.exports = router;
