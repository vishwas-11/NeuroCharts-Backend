// utils/jwt.js
// Utility functions for generating and verifying JSON Web Tokens.

const jwt = require('jsonwebtoken');

// Get JWT secret from environment variables
const jwtSecret = process.env.JWT_SECRET;

// Generate a JWT
function generateToken(payload) {
  // Signs the token with the payload, secret, and an expiration time
  return jwt.sign(payload, jwtSecret, { expiresIn: '1h' }); // Token expires in 1 hour
}

// Verify a JWT
function verifyToken(token) {
  try {
    // Verifies the token using the secret. If valid, returns the decoded payload.
    return jwt.verify(token, jwtSecret);
  } catch (error) {
    // If verification fails (e.g., token expired, invalid signature), an error is thrown.
    console.error('JWT verification failed:', error.message);
    return null; // Return null if token is invalid
  }
}

module.exports = {
  generateToken,
  verifyToken,
};

/*
  Explanation for utils/jwt.js:
  - `jwt.sign(payload, secret, options)`: Creates a new JWT.
    - `payload`: An object containing the data you want to store in the token (e.g., user ID, role).
    - `secret`: The secret key used to sign the token. This must be kept confidential.
    - `expiresIn: '1h'`: Sets the token to expire in 1 hour. Adjust as needed.
  - `jwt.verify(token, secret)`: Decodes and verifies the token. If valid, it returns the payload. If invalid, it throws an error.
  - `try...catch`: Handles potential errors during token verification (e.g., if the token is expired or malformed).
*/
