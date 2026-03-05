const jwt = require('jsonwebtoken');

// POST /jwt — sign and return a JWT
const getToken = (req, res) => {
    const user = req.body;
    const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRETE, { expiresIn: '5000y' });
    res.json({ token });
};

module.exports = { getToken };
