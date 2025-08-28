// routes/auth.js
// Defines the authentication routes for user registration and login.

const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { hashPassword, comparePassword } = require('../utils/bcrypt');
const { generateToken } = require('../utils/jwt');
const { protect, authorizeAdmin } = require('../middleware/authMiddleware'); // Import middleware

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', async (req, res) => {
  const { username, email, password, role } = req.body;

  try {
    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create new user
    user = new User({
      username,
      email,
      password: hashedPassword,
      role: role || 'user', // Default to 'user' if role is not provided
    });

    await user.save(); // Save user to database

    // Generate JWT
    const token = generateToken({ id: user._id, role: user.role });

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    console.error('Registration error:', error.message);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Compare provided password with hashed password in DB
    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate JWT
    const token = generateToken({ id: user._id, role: user.role });

    res.status(200).json({
      message: 'Logged in successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// @route   GET /api/auth/profile
// @desc    Get user profile (protected route example)
// @access  Private
router.get('/profile', protect, (req, res) => {
  // req.user is available here due to the 'protect' middleware
  res.status(200).json({
    message: 'User profile accessed successfully',
    user: req.user, // Contains user data fetched by the middleware
  });
});

// @route   GET /api/auth/admin-dashboard
// @desc    Access admin-only dashboard (protected & admin-only route example)
// @access  Private (Admin only)
router.get('/admin-dashboard', protect, authorizeAdmin, (req, res) => {
  res.status(200).json({
    message: 'Welcome to the Admin Dashboard!',
    user: req.user,
    // In a real app, you'd fetch and send admin-specific data here
  });
});

module.exports = router;

/*
  Explanation for routes/auth.js:
  - `express.Router()`: Creates a new router object.
  - `router.post('/register', ...)`:
    - Handles user registration.
    - Checks if a user with the given email already exists.
    - Hashes the password using `hashPassword`.
    - Creates a new User document and saves it to MongoDB.
    - Generates a JWT using `generateToken` and sends it back in the response along with user details.
  - `router.post('/login', ...)`:
    - Handles user login.
    - Finds the user by email.
    - Compares the provided password with the stored hashed password using `comparePassword`.
    - If credentials are valid, generates a JWT and sends it back.
  - `router.get('/profile', protect, ...)`:
    - An example of a protected route. The `protect` middleware runs first. If the token is valid, `req.user` will be populated, and the route handler will execute.
  - `router.get('/admin-dashboard', protect, authorizeAdmin, ...)`:
    - An example of an admin-only route. Both `protect` and `authorizeAdmin` middlewares run. Only if both pass will the route handler execute.
  - `try...catch` blocks: Used for error handling in asynchronous operations (database calls, hashing).
*/









