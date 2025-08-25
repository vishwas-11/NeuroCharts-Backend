const { verifyToken } = require('../utils/jwt');
const User = require('../models/User'); // Import User model to fetch user details if needed

async function protect(req, res, next) {
  let token;

  // Check if Authorization header exists and starts with 'Bearer'
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header (e.g., "Bearer TOKEN_STRING")
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = verifyToken(token);

      if (!decoded) {
        return res.status(401).json({ message: 'Not authorized, token failed' });
      }

      // Attach user to the request object (excluding password for security)
      // This makes user data available in subsequent middleware/route handlers
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }

      next(); // Proceed to the next middleware/route handler
    } catch (error) {
      console.error('Auth middleware error:', error.message);
      res.status(401).json({ message: 'Not authorized, token invalid or expired' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
}

// Middleware to check if the authenticated user has an 'admin' role.
function authorizeAdmin(req, res, next) {
  // 'req.user' is set by the 'protect' middleware.
  if (req.user && req.user.role === 'admin') {
    next(); // User is an admin, proceed
  } else {
    res.status(403).json({ message: 'Not authorized as an admin' }); // Forbidden
  }
}

module.exports = {
  protect,
  authorizeAdmin,
};

/*
  Explanation for middleware/authMiddleware.js:
  - `protect` middleware:
    - Checks for a `Bearer` token in the `Authorization` header.
    - Uses `verifyToken` from `utils/jwt.js` to validate the token.
    - If valid, it decodes the payload (which contains `id` and `role`).
    - It then fetches the user from the database using the `id` and attaches the user object (without the password) to `req.user`. This is useful for accessing user details in your route handlers.
    - If the token is missing or invalid, it sends appropriate 401 (Unauthorized) responses.
  - `authorizeAdmin` middleware:
    - Assumes `protect` middleware has already run and set `req.user`.
    - Checks if `req.user` exists and if `req.user.role` is 'admin'.
    - If not an admin, it sends a 403 (Forbidden) response.
*/
