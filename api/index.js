// Vercel Serverless Function — wraps the Express backend
require('dotenv').config({ path: require('path').join(__dirname, '../backend/.env') });

const app = require('../backend/src/server');

module.exports = app;
