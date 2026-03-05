const express = require('express');
const { getToken } = require('./auth.controller');

const router = express.Router();

router.post('/', getToken);

module.exports = router;
