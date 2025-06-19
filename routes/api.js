//const express = require('express');
//const router = express.Router();
//const fs = require('fs');
//const path = require('path');
//
//router.get('/list', (req, res) => {
//  const requestedPath = req.query.path || '';
//  const baseDir = path.join(__dirname, '../../data/MekaneHeywetFiles');
//  const safePath = path.normalize(path.join(baseDir, requestedPath));
//
//  if (!safePath.startsWith(baseDir)) {
//    return res.status(400).json({ error: 'Invalid path' });
//  }
//
//  fs.readdir(safePath, { withFileTypes: true }, (err, files) => {
//    if (err) {
//      return res.status(500).json({ error: 'Cannot read directory' });
//    }
//
//    const result = files.map(f => ({
//      name: f.name,
//      type: f.isDirectory() ? 'folder' : 'file'
//    }));
//
//    res.json(result);
//  });
//});
//
//
//
//
//router.post('/login', (req, res) => {
//    const validPasswords = [
//        "dagi", "Dagi", "mekane heywet", "mekaneheywet",
//        "Mekane heywet", "Mekane Heywet", "MEKANE HEYWET",
//        "መካነ ሕይወት", "መካነ ህይወት", "መካነሕይወት", "2017"
//    ];
//
//    if (validPasswords.includes(req.body.password)) {
//        res.cookie('auth_token', req.body.password, {
//            httpOnly: true,
//            sameSite: 'strict',
//            maxAge: 86400000 // 1 day
//        });
//        return res.json({ success: true });
//    }
//
//    res.status(401).json({ error: 'Invalid password' });
//});
//
//// ✅ Don't forget this
//module.exports = router;


// routes/api.js
const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const mime = require('mime-types');

// Import authentication details for the login route, INCLUDING cookieOptions
const { SECRET_PASSWORD, SESSION_COOKIE_NAME, cookieOptions } = require('../middlewares/auth');

// Import the base directory from fileHandling middleware
const { FILES_BASE_DIR } = require('../middlewares/fileHandling');

// --- Helper function to get directory contents ---
async function getDirectoryContents(directoryPath) {
    return new Promise((resolve, reject) => {
        fs.readdir(directoryPath, { withFileTypes: true }, (err, entries) => {
            if (err) {
                return reject(err);
            }

            const items = entries.map(entry => {
                const itemPath = path.join(directoryPath, entry.name);
                const type = entry.isDirectory() ? 'folder' : 'file';
                let size = 0; // Default size for folders or if not available

                if (type === 'file') {
                    try {
                        const stats = fs.statSync(itemPath); // Synchronous stat for simplicity in listing
                        size = stats.size;
                    } catch (statErr) {
                        console.warn(`Could not get stats for ${itemPath}:`, statErr.message);
                        // size remains 0
                    }
                }

                return {
                    name: entry.name,
                    type: type,
                    size: size
                };
            });
            resolve(items);
        });
    });
}

// --- API Routes ---


router.post('/login', (req, res) => {
    const validPasswords = [
        "dagi", "Dagi", "mekane heywet", "mekaneheywet",
        "Mekane heywet", "Mekane Heywet", "MEKANE HEYWET",
        "መካነ ሕይወት", "መካነ ህይወት", "መካነሕይወት", "2017"
    ];

    if (validPasswords.includes(req.body.password)) {
        res.cookie(SESSION_COOKIE_NAME, 'loggedIn', cookieOptions);
        res.json({ success: true });
    }

    res.status(401).json({ error: 'Invalid password' });
});

//router.post('/login', (req, res) => {
//    const { password } = req.body;
//
//    if (password === SECRET_PASSWORD) { // Check against the secret password
//        // Use the imported cookieOptions for persistence and local compatibility
//        res.cookie(SESSION_COOKIE_NAME, 'loggedIn', cookieOptions);
//        res.json({ success: true });
//    } else {
//        res.status(401).json({ success: false, error: 'Incorrect password.' });
//    }
//});

// GET /api/check-auth
router.get('/check-auth', (req, res) => {
    // Check if the session cookie exists and has the correct value
    const isAuthenticated = req.cookies[SESSION_COOKIE_NAME] === 'loggedIn';
    res.json({ authenticated: isAuthenticated });
});

// GET /api/list (List files and folders)
router.get('/list', async (req, res) => {
    const requestedPath = req.query.path || '';
    const absolutePath = res.locals.getSafePath(requestedPath);

    if (!absolutePath) {
        return res.status(400).json({ error: 'Invalid or forbidden path.' });
    }

    try {
        const stats = await fs.promises.stat(absolutePath);
        if (!stats.isDirectory()) {
            return res.status(400).json({ error: 'Path is not a directory.' });
        }
        const items = await getDirectoryContents(absolutePath);
        items.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
        res.json(items);
    } catch (err) {
        console.error('Error listing directory:', err);
        res.status(500).json({ error: 'Failed to list directory contents.' });
    }
});


// GET /api/view (Preview files)
router.get('/view', (req, res) => {
    const requestedPath = req.query.path;

    if (!requestedPath) {
        return res.status(400).send('File path is required.');
    }

    const absoluteFilePath = res.locals.getSafePath(requestedPath);

    if (!absoluteFilePath) {
        return res.status(403).send('Access to the requested file is forbidden.');
    }

    fs.stat(absoluteFilePath, (err, stats) => {
        if (err) {
            if (err.code === 'ENOENT') {
                return res.status(404).send('File not found.');
            }
            console.error('Error stating file for view:', err);
            return res.status(500).send('Server error accessing file.');
        }

        if (!stats.isFile()) {
            return res.status(400).send('Path is not a file.');
        }

        // Set Content-Type header based on file extension
        const contentType = mime.lookup(absoluteFilePath) || 'application/octet-stream';
        res.setHeader('Content-Type', contentType);

        const fileStream = fs.createReadStream(absoluteFilePath);
        fileStream.pipe(res);

        fileStream.on('error', (streamErr) => {
            console.error('Error streaming file for view:', streamErr);
            if (!res.headersSent) {
                res.status(500).send('Error streaming file.');
            }
        });
    });
});

// GET /api/download (Download files)
router.get('/download', (req, res) => {
    const requestedPath = req.query.path;

    if (!requestedPath) {
        return res.status(400).send('File path is required.');
    }

    const absoluteFilePath = res.locals.getSafePath(requestedPath);

    if (!absoluteFilePath) {
        return res.status(403).send('Access to the requested file is forbidden.');
    }

    fs.stat(absoluteFilePath, (err, stats) => {
        if (err) {
            if (err.code === 'ENOENT') {
                return res.status(404).send('File not found.');
            }
            console.error('Error stating file for download:', err);
            return res.status(500).send('Server error accessing file.');
        }

        if (!stats.isFile()) {
            return res.status(400).send('Path is not a file.');
        }

        // Set Content-Type
        const contentType = mime.lookup(absoluteFilePath) || 'application/octet-stream';
        res.setHeader('Content-Type', contentType);

        // Crucial for download: Set Content-Disposition to 'attachment'
        const fileName = path.basename(absoluteFilePath);
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`); // Encode filename for non-ASCII

        const fileStream = fs.createReadStream(absoluteFilePath);
        fileStream.pipe(res);

        fileStream.on('error', (streamErr) => {
            console.error('Error streaming file for download:', streamErr);
            if (!res.headersSent) {
                res.status(500).send('Error streaming file.');
            }
        });
    });
});

module.exports = router;
