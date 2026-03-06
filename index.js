require('dotenv').config();
const connectDB = require('./src/config/db');
const app = require('./src/app');

connectDB();

module.exports = app;
