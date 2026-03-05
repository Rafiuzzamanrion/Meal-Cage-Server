// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
    console.error('❌ Error:', err.message);

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors).map((e) => e.message);
        return res.status(400).json({ error: true, message: messages.join(', ') });
    }

    // Mongoose duplicate key
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        return res.status(409).json({ error: true, message: `${field} already exists` });
    }

    // Mongoose cast error (invalid ObjectId)
    if (err.name === 'CastError') {
        return res.status(400).json({ error: true, message: 'Invalid ID format' });
    }

    const statusCode = err.status || err.statusCode || 500;
    res.status(statusCode).json({
        error: true,
        message: err.message || 'Internal Server Error',
    });
};

module.exports = errorHandler;
