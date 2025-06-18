//module.exports = function(req, res, next) {
//    const validPasswords = [
//        "dagi", "Dagi", "mekane heywet", "mekaneheywet",
//        "Mekane heywet", "Mekane Heywet", "MEKANE HEYWET",
//        "መካነ ሕይወት", "መካነ ህይወት", "መካነሕይወት", "2017"
//    ];
//
//    // Skip auth for static files and login route
//    if (req.path.startsWith('/static/') || req.path === '/api/login') {
//        return next();
//    }
//
//    const authToken = req.cookies?.auth_token;
//
//    if (validPasswords.includes(authToken)) {
//        return next();
//    }
//
//    if (req.path.startsWith('/api')) {
//        return res.status(401).json({ error: 'Unauthorized' });
//    } else {
//        return res.redirect('/?authError=1');
//    }
//};


// middlewares/auth.js
const jwt = require('jsonwebtoken'); // You'd typically use JWT for sessions. (npm install jsonwebtoken)
                                    // For this simple example, we'll just use a direct session check.

// In a real app, this would be retrieved securely (e.g., from environment variables)
const SECRET_PASSWORD = [
       "dagi", "Dagi", "mekane heywet", "mekaneheywet",
      "Mekane heywet", "Mekane Heywet", "MEKANE HEYWET",
        "መካነ ሕይወት", "መካነ ህይወት", "መካነሕይወት", "2017"
    ]; // <-- CHANGE THIS! MAKE IT A STRONG SECRET!
const SESSION_COOKIE_NAME = 'auth_token';

// Define cookie options for reuse
// For local development (HTTP), 'secure' should be false.
// 'SameSite' should also be explicitly set for cross-site cookie behavior if needed,
// but for simple cases, 'Lax' or 'None' (with secure: true)
// `path: '/'` ensures the cookie is available across your entire domain.
const cookieOptions = {
    httpOnly: true, // Prevents client-side JavaScript from accessing the cookie
    secure: process.env.NODE_ENV === 'production', // true in production (HTTPS), false in development (HTTP)
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds (adjust as needed)
    sameSite: 'Lax', // Protects against some CSRF attacks; 'Strict' is more secure but can be restrictive
    path: '/' // Make cookie available to all paths on your domain
};

const authMiddleware = (req, res, next) => {
    // Exclude login and check-auth routes from direct authentication check
    // as they handle authentication themselves.
    if (req.path === '/api/login' || req.path === '/api/check-auth') {
        return next();
    }

    const token = req.cookies[SESSION_COOKIE_NAME];

    if (!token) {
        // If no token, and not trying to login, redirect to login or send 401
        if (req.accepts('html') && !req.path.startsWith('/api')) {
             // For HTML requests, redirect to root which should show login page
            return res.redirect('/');
        } else {
             // For API requests, send 401 Unauthorized
            return res.status(401).json({ error: 'Unauthorized: No token provided.' });
        }
    }

    // In a real app, you would verify a JWT token here.
    // For this example, we'll just check if *any* token exists and is 'loggedIn'.
    // This is a VERY BASIC and INSECURE check for demonstration.
    // Replace with proper token validation (e.g., `jwt.verify(token, process.env.JWT_SECRET)`)!
    if (token === 'loggedIn') { // Simple check for our 'loggedIn' string
        next();
    } else {
        res.clearCookie(SESSION_COOKIE_NAME); // Clear invalid cookie
        return res.status(401).json({ error: 'Unauthorized: Invalid token.' });
    }
};

module.exports = authMiddleware;
module.exports.SECRET_PASSWORD = SECRET_PASSWORD;
module.exports.SESSION_COOKIE_NAME = SESSION_COOKIE_NAME;
module.exports.cookieOptions = cookieOptions; // Export the cookie options