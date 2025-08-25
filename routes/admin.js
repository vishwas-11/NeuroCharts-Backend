// routes/admin.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware'); // We'll update the middleware for superadmin check

// New middleware to check for superadmin role
const authorizeSuperadmin = (req, res, next) => {
  if (req.user && req.user.role === 'superadmin') {
    next(); // User is a superadmin, proceed
  } else {
    res.status(403).json({ message: 'Not authorized as a superadmin' });
  }
};

// @route   GET /api/admin/users
// @desc    Get all users (for superadmins and admins)
// @access  Private (Superadmin/Admin only)
router.get('/users', protect, async (req, res) => {
  // Check if the user is an admin or superadmin
  if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
    return res.status(403).json({ message: 'Not authorized to view users' });
  }

  try {
    const users = await User.find().select('-password'); // Get all users, but exclude their password
    res.status(200).json({
      message: 'Users retrieved successfully!',
      users,
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Server error fetching users' });
  }
});

// @route   PUT /api/admin/users/:id/role
// @desc    Update a user's role (Superadmin only)
// @access  Private (Superadmin only)
router.put('/users/:id/role', protect, authorizeSuperadmin, async (req, res) => {
  const { role } = req.body;
  const userIdToUpdate = req.params.id;

  try {
    const userToUpdate = await User.findById(userIdToUpdate);

    if (!userToUpdate) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // You cannot change the role of the current superadmin
    if (userToUpdate.role === 'superadmin' && userToUpdate._id.toString() !== req.user.id) {
       return res.status(403).json({ message: 'Cannot change the role of another superadmin.' });
    }
    
    if (!['user', 'admin', 'superadmin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role provided' });
    }

    userToUpdate.role = role;
    await userToUpdate.save();

    res.status(200).json({
      message: `User role updated to ${role} successfully!`,
      user: {
        id: userToUpdate._id,
        username: userToUpdate.username,
        email: userToUpdate.email,
        role: userToUpdate.role,
      },
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ message: 'Server error updating user role' });
  }
});

// @route   DELETE /api/admin/users/:id
// @desc    Delete a user (Superadmin only)
// @access  Private (Superadmin only)
router.delete('/users/:id', protect, authorizeSuperadmin, async (req, res) => {
  const userIdToDelete = req.params.id;

  try {
    const userToDelete = await User.findById(userIdToDelete);

    if (!userToDelete) {
      return res.status(404).json({ message: 'User not found' });
    }

    // A superadmin cannot delete themselves.
    if (userToDelete._id.toString() === req.user.id) {
      return res.status(403).json({ message: 'You cannot delete yourself.' });
    }

    await userToDelete.deleteOne();

    res.status(200).json({ message: 'User deleted successfully!' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Server error deleting user' });
  }
});

module.exports = router;
