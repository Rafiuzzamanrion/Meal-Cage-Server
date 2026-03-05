const User = require('../../models/User');

// POST /users — create user (no JWT required, called on sign-up)
const createUser = async (req, res, next) => {
    try {
        const { email, name, photoURL } = req.body;
        const existing = await User.findOne({ email });
        if (existing) return res.json({ message: 'user already exists' });
        const user = await User.create({ email, name, photoURL });
        res.status(201).json(user);
    } catch (err) {
        next(err);
    }
};

// GET /users — all users (admin)
const getAllUsers = async (req, res, next) => {
    try {
        const users = await User.find();
        res.json(users);
    } catch (err) {
        next(err);
    }
};

// GET /users/admin/:email — check if user is admin
const checkAdmin = async (req, res, next) => {
    try {
        const { email } = req.params;
        if (req.decoded.email !== email) return res.json({ admin: false });
        const user = await User.findOne({ email });
        res.json({ admin: user?.role === 'admin' });
    } catch (err) {
        next(err);
    }
};

// PATCH /users/admin/:id — promote user to admin
const makeAdmin = async (req, res, next) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { $set: { role: 'admin' } },
            { new: true }
        );
        if (!user) return res.status(404).json({ error: true, message: 'User not found' });
        res.json(user);
    } catch (err) {
        next(err);
    }
};

// DELETE /users/:id — delete user (admin)
const deleteUser = async (req, res, next) => {
    try {
        const deleted = await User.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ error: true, message: 'User not found' });
        res.json({ success: true });
    } catch (err) {
        next(err);
    }
};

module.exports = { createUser, getAllUsers, checkAdmin, makeAdmin, deleteUser };
