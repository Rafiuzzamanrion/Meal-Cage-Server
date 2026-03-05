const express = require('express');
const { body } = require('express-validator');
const verifyJWT = require('../../middleware/verifyJWT');
const verifyAdmin = require('../../middleware/verifyAdmin');
const { subscribe, getSubscribers } = require('./newsletter.controller');

const router = express.Router();

router.post(
    '/subscribe',
    [body('email').isEmail().withMessage('Please provide a valid email address').normalizeEmail()],
    subscribe
);

router.get('/subscribers', verifyJWT, verifyAdmin, getSubscribers);

module.exports = router;
