// app.js
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');

const authMiddleware = require('./middlewares/auth');
const fileHandlingMiddleware = require('./middlewares/fileHandling');

const app = express();

// ✅ Use the cPanel-assigned port
const PORT = process.env.PORT || 3001;

// === Middlewares ===
app.use(cookieParser());
app.use(express.json());
app.use(fileHandlingMiddleware);

// ✅ Serve static files
app.use(express.static(path.join(__dirname, 'static')));

// ✅ Optional: Basic root route to avoid redirect loops
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'static', 'index.html'));
});

// ✅ Apply authentication after public files
app.use(authMiddleware);

// ✅ API routes
app.use('/api', require('./routes/api'));

// ✅ Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send(`<pre>${err.stack}</pre>`);
});

// ✅ Start app using correct port for cPanel
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
