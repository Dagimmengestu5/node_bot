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


const path = require('path');
const fs = require('fs');

const FILES_BASE_DIR = path.join(__dirname, '../data/MekaneHeywetFiles');

if (!fs.existsSync(FILES_BASE_DIR)) {
    console.error(`ERROR: FILES_BASE_DIR does not exist: ${FILES_BASE_DIR}`);
    console.error('Please create this directory or update the path in middlewares/fileHandling.js');
    process.exit(1);
}

// Natural sort comparator for filenames
function naturalCompare(a, b) {
  const ax = [], bx = [];

  a.replace(/(\d+)|(\D+)/g, (_, $1, $2) => {
    ax.push([$1 !== undefined ? parseInt($1, 10) : Infinity, $2 || ""]);
  });
  b.replace(/(\d+)|(\D+)/g, (_, $1, $2) => {
    bx.push([$1 !== undefined ? parseInt($1, 10) : Infinity, $2 || ""]);
  });

  while (ax.length && bx.length) {
    const an = ax.shift();
    const bn = bx.shift();

    const numDiff = an[0] - bn[0];
    if (numDiff !== 0) return numDiff;

    const strDiff = an[1].localeCompare(bn[1]);
    if (strDiff !== 0) return strDiff;
  }

  return ax.length - bx.length;
}

module.exports = (req, res, next) => {
  res.locals.getSafePath = (relativePath) => {
    if (!relativePath) {
      return FILES_BASE_DIR;
    }

    const normalizedPath = path.normalize(relativePath);
    const absolutePath = path.join(FILES_BASE_DIR, normalizedPath);

    if (!absolutePath.startsWith(FILES_BASE_DIR + path.sep) && absolutePath !== FILES_BASE_DIR) {
      console.warn(`Attempted directory traversal detected for path: ${relativePath}`);
      return null;
    }

    return absolutePath;
  };

  next();
};

// Helper to list directory contents naturally sorted
module.exports.listDirSorted = function(dirPath, callback) {
  fs.readdir(dirPath, (err, files) => {
    if (err) {
      return callback(err);
    }

    files.sort(naturalCompare);
    callback(null, files);
  });
};

module.exports.FILES_BASE_DIR = FILES_BASE_DIR;
