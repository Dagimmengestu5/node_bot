const express = require('express');
const path = require('path');
const router = express.Router();

// Serve static assets
router.use(express.static(path.join(__dirname, '../../static')));

// Fallback to index.html for SPA
router.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../static/index.html'));
});

module.exports = router;