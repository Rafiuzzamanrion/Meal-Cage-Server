require('dotenv').config();
const connectDB = require('./src/config/db');
const app = require('./src/app');

connectDB();

// Only listen when running locally — Vercel handles this in serverless mode
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
        console.log(`🍽️  MealCage Server running on port ${PORT}`);
    });
}

module.exports = app;
