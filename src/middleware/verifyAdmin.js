const User = require('../models/User');

const verifyAdmin = async (req, res, next) => {
    try {
        const user = await User.findOne({ email: req.decoded.email });
        if (!user || user.role !== 'admin') {
            return res.status(403).json({ error: true, message: 'Forbidden: admin access required' });
        }
        next();
    } catch (err) {
        next(err);
    }
};

module.exports = verifyAdmin;
