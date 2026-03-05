const express = require('express');
const { getCartItems, addCartItem, deleteCartItem } = require('./carts.controller');

const router = express.Router();

router.get('/', getCartItems);
router.post('/', addCartItem);
router.delete('/:id', deleteCartItem);

module.exports = router;
