const Menu = require('../../models/Menu');

// GET /menu — list all, with optional ?category= and ?dietaryTag= filters
const getAllMenuItems = async (req, res, next) => {
    try {
        const filter = {};
        if (req.query.category) filter.category = req.query.category;
        if (req.query.dietaryTag) filter.dietaryTags = req.query.dietaryTag;
        const items = await Menu.find(filter);
        res.json(items);
    } catch (err) {
        next(err);
    }
};

// GET /menu/:id — get single item by MongoDB _id
const getMenuItemById = async (req, res, next) => {
    try {
        const item = await Menu.findById(req.params.id);
        if (!item) return res.status(404).json({ error: true, message: 'Menu item not found' });
        res.json(item);
    } catch (err) {
        next(err);
    }
};

// POST /menu — add a new menu item (admin)
const createMenuItem = async (req, res, next) => {
    try {
        const item = await Menu.create(req.body);
        res.status(201).json(item);
    } catch (err) {
        next(err);
    }
};

// PATCH /menu/:id — update a menu item (admin)
const updateMenuItem = async (req, res, next) => {
    try {
        const updated = await Menu.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true, runValidators: true }
        );
        if (!updated) return res.status(404).json({ error: true, message: 'Menu item not found' });
        res.json(updated);
    } catch (err) {
        next(err);
    }
};

// DELETE /menu/:id — delete a menu item (admin)
const deleteMenuItem = async (req, res, next) => {
    try {
        const deleted = await Menu.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ error: true, message: 'Menu item not found' });
        res.json({ success: true, deletedId: req.params.id });
    } catch (err) {
        next(err);
    }
};

module.exports = { getAllMenuItems, getMenuItemById, createMenuItem, updateMenuItem, deleteMenuItem };
