const jwt = require('jsonwebtoken');

const verifyJWT = (req, res, next) => {
    const authorization = req.headers.authorization;
    if (!authorization) {
        return res.status(401).json({ error: true, message: 'Unauthorized: no token provided' });
    }
    const token = authorization.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRETE, (err, decoded) => {
        if (err) {
            return res.status(401).json({ error: true, message: 'Unauthorized: invalid token' });
        }
        req.decoded = decoded;
        next();
    });
};

module.exports = verifyJWT;
