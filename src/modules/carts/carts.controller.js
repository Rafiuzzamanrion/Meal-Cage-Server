const Cart = require('../../models/Cart');

// GET /carts?email= — get user cart items
const getCartItems = async (req, res, next) => {
    try {
        const { email } = req.query;
        if (!email) return res.json([]);
        const items = await Cart.find({ email });
        res.json(items);
    } catch (err) {
        next(err);
    }
};

// POST /carts — add item to cart
const addCartItem = async (req, res, next) => {
    try {
        const item = await Cart.create(req.body);
        res.status(201).json(item);
    } catch (err) {
        next(err);
    }
};

// DELETE /carts/:id — remove item from cart
const deleteCartItem = async (req, res, next) => {
    try {
        const deleted = await Cart.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ error: true, message: 'Cart item not found' });
        res.json({ deletedCount: 1 });
    } catch (err) {
        next(err);
    }
};

module.exports = { getCartItems, addCartItem, deleteCartItem };
