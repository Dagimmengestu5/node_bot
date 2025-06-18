// app.js
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');

// Import your custom middlewares
const authMiddleware = require('./middlewares/auth');
const fileHandlingMiddleware = require('./middlewares/fileHandling'); // Renamed for clarity

const app = express();
const PORT = 4000;

// === Middlewares ===
app.use(cookieParser()); // 1. Parse cookies
app.use(express.json()); // 2. Parse JSON bodies (for login, etc.)

app.use(fileHandlingMiddleware);

app.use(express.static(path.join(__dirname, '..', 'static')));


app.use(authMiddleware);

app.use('/api', require('./routes/api'));


app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));