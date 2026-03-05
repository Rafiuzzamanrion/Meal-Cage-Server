require('dotenv').config();
const connectDB = require('./src/config/db');
const app = require('./src/app');

const port = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(port, () => {
    console.log(`🚀 MealCage server running on port ${port}`);
  });
});
