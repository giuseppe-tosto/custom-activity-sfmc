const express = require('express');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

// Importa la tua custom activity
const emailFilter = require('./activities/emailFilter/execute');

app.post('/activities/emailFilter/execute', emailFilter);

// Per Vercel
module.exports = app;
