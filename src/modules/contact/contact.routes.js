const express = require('express');
const { body } = require('express-validator');
const verifyJWT = require('../../middleware/verifyJWT');
const verifyAdmin = require('../../middleware/verifyAdmin');
const { submitContact, getAllMessages, markRead } = require('./contact.controller');

const router = express.Router();

const validateContact = [
    body('name').notEmpty().withMessage('Name is required').trim(),
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('message').notEmpty().withMessage('Message is required').trim(),
];

router.post('/', validateContact, submitContact);
router.get('/', verifyJWT, verifyAdmin, getAllMessages);
router.patch('/:id', verifyJWT, verifyAdmin, markRead);

module.exports = router;
