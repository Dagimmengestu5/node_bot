//const path = require('path');
//const fs = require('fs');
//
//module.exports = function (req, res, next) {
//    const baseDir = path.join(__dirname, '../../data/MekaneHeywetFiles');
//    console.log('Base dir:', baseDir);
//
//    res.locals.getSafePath = (requestedPath) => {
//        if (!requestedPath) return baseDir;
//
//        requestedPath = requestedPath.replace(/^\//, '');
//        const fullPath = path.join(baseDir, requestedPath);
//        const normalizedPath = path.normalize(fullPath);
//
//        if (!normalizedPath.startsWith(path.resolve(baseDir))) {
//            return null;
//        }
//
//        return normalizedPath;
//    };
//
//    next();
//};


// middlewares/fileHandling.js
const path = require('path');
const fs = require('fs');

// --- CRITICAL CONFIGURATION ---
// This MUST point to the absolute path of your content files (audio, pdf, images, etc.)
// Adjust 'YOUR_ACTUAL_FILES_FOLDER' to match your project structure.
// Example: If your project root is `/home/user/my_project/`
// and your files are in `/home/user/my_project/content/`, then it might be:
// const FILES_BASE_DIR = path.join(__dirname, '..', '..', 'content');
// Or if 'backend' is directly in the project root and files are in 'files' next to 'backend':
// const FILES_BASE_DIR = path.join(__dirname, '..', 'files');
const FILES_BASE_DIR = path.join(__dirname, '../data/MekaneHeywetFiles');

// Ensure the base directory exists
if (!fs.existsSync(FILES_BASE_DIR)) {
    console.error(`ERROR: FILES_BASE_DIR does not exist: ${FILES_BASE_DIR}`);
    console.error('Please create this directory or update the path in middlewares/fileHandling.js');
    process.exit(1); // Exit if the base directory is not found
}

module.exports = (req, res, next) => {
    /**
     * Safely resolves a user-provided relative path to an absolute path within FILES_BASE_DIR.
     * Prevents directory traversal attacks.
     *
     * @param {string} relativePath - The path provided by the client (e.g., 'folder/file.pdf').
     * @returns {string | null} The absolute, resolved path if safe, otherwise null.
     */
    res.locals.getSafePath = (relativePath) => {
        if (!relativePath) {
            return FILES_BASE_DIR; // If no path, refers to the root content directory
        }

        // Normalize the path to handle sequences like 'folder/./file' or 'folder/../file'
        const normalizedPath = path.normalize(relativePath);

        // Construct the absolute path
        const absolutePath = path.join(FILES_BASE_DIR, normalizedPath);

        // Crucial security check: Ensure the resolved path is still within the base directory
        // This prevents directory traversal attacks like ../../../etc/passwd
        // It also handles cases where `normalizedPath` might be '..' or '.'
        if (!absolutePath.startsWith(FILES_BASE_DIR + path.sep) && absolutePath !== FILES_BASE_DIR) {
            console.warn(`Attempted directory traversal detected for path: ${relativePath}`);
            return null; // Path is outside the allowed directory
        }

        return absolutePath;
    };
    next();
};

// Export the base directory so routes can use it directly for operations like `readdir`
module.exports.FILES_BASE_DIR = FILES_BASE_DIR;