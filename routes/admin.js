const express = require('express');
const router = express.Router();
const User = require('../models/User');
const ExcelData = require('../models/ExcelData');
const RoleRequest = require('../models/RoleRequest'); // NEW: Import the RoleRequest model
const { protect } = require('../middleware/authMiddleware');

const authorizeSuperadmin = (req, res, next) => {
  if (req.user && req.user.role === 'superadmin') {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as a superadmin' });
  }
};

// @route   GET /api/admin/users
// @desc    Get all users (for superadmins and admins)
// @access  Private (Superadmin/Admin only)
router.get('/users', protect, async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
    return res.status(403).json({ message: 'Not authorized to view users' });
  }

  try {
    const users = await User.find().select('-password');
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

// @route   GET /api/admin/metrics/users
// @desc    Get total user count
// @access  Private (Admin/Superadmin only)
router.get('/metrics/users', protect, async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
    return res.status(403).json({ message: 'Not authorized to view metrics' });
  }
  try {
    const count = await User.countDocuments();
    res.status(200).json({ totalUsers: count });
  } catch (error) {
    console.error('Error fetching user count:', error);
    res.status(500).json({ message: 'Server error fetching user count' });
  }
});

// @route   GET /api/admin/metrics/files
// @desc    Get total file count
// @access  Private (Admin/Superadmin only)
router.get('/metrics/files', protect, async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
    return res.status(403).json({ message: 'Not authorized to view metrics' });
  }
  try {
    const count = await ExcelData.countDocuments();
    res.status(200).json({ totalFiles: count });
  } catch (error) {
    console.error('Error fetching file count:', error);
    res.status(500).json({ message: 'Server error fetching file count' });
  }
});

// --- NEW ENDPOINT: Request superadmin role ---
// @route   POST /api/admin/role-request
// @desc    Admin requests superadmin role
// @access  Private (Admin only)



// router.post('/role-request', protect, async (req, res) => {
//     // Only allow 'admin' users to make this request
//     if (req.user.role !== 'admin') {
//         return res.status(403).json({ message: 'Only admins can request the superadmin role.' });
//     }

//     try {
//         const existingRequest = await RoleRequest.findOne({ userId: req.user.id, status: 'pending' });
//         if (existingRequest) {
//             return res.status(400).json({ message: 'A pending request already exists.' });
//         }

//         const newRequest = new RoleRequest({ userId: req.user.id });
//         await newRequest.save();

//         res.status(201).json({ message: 'Role request submitted successfully!' });
//     } catch (error) {
//         console.error('Error submitting role request:', error);
//         res.status(500).json({ message: 'Server error submitting role request.' });
//     }
// });



// @route   POST /api/admin/role-request
// @desc    Admin requests superadmin role
// @access  Private (Admin only)
router.post('/role-request', protect, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Only admins can request the superadmin role.' });
  }

  try {
    const existingRequest = await RoleRequest.findOne({ userId: req.user.id });

    if (existingRequest) {
      if (existingRequest.status === 'pending') {
        return res.status(400).json({ message: 'You already have a pending request.' });
      }
      if (existingRequest.status === 'approved') {
        return res.status(400).json({ message: 'You are already a Superadmin.' });
      }
      if (existingRequest.status === 'denied') {
        // Reset denied request to pending
        existingRequest.status = 'pending';
        existingRequest.createdAt = Date.now();
        await existingRequest.save();
        return res.status(200).json({ message: 'Your denied request has been resubmitted.' });
      }
    }

    // No request exists → create new one
    const newRequest = new RoleRequest({ userId: req.user.id });
    await newRequest.save();

    res.status(201).json({ message: 'Role request submitted successfully!' });
  } catch (error) {
    console.error('Error submitting role request:', error);
    res.status(500).json({ message: 'Server error submitting role request.' });
  }
});



// --- NEW ENDPOINT: Get all pending role requests ---
// @route   GET /api/admin/role-requests
// @desc    Get all pending role requests
// @access  Private (Superadmin only)
// router.get('/role-requests', protect, authorizeSuperadmin, async (req, res) => {
//     try {
//         // Find all pending requests and populate the user details
//         const requests = await RoleRequest.find({ status: 'pending' }).populate('userId', 'username email');
//         res.status(200).json({ requests });
//     } catch (error) {
//         console.error('Error fetching role requests:', error);
//         res.status(500).json({ message: 'Server error fetching role requests.' });
//     }
// });


// --- UPDATED ENDPOINT: Get role requests ---
// @route   GET /api/admin/role-requests
// @desc    Superadmins see all requests, admins see their own
// @access  Private (Admin/Superadmin)
router.get('/role-requests', protect, async (req, res) => {
  try {
    if (req.user.role === 'superadmin') {
      // superadmins see all pending requests
      const requests = await RoleRequest.find({ status: 'pending' })
        .populate('userId', 'username email');
      return res.status(200).json({ requests });
    } 
    
    if (req.user.role === 'admin') {
      // admins only see their own request
      const request = await RoleRequest.findOne({ userId: req.user.id });
      return res.status(200).json({ requests: request ? [request] : [] });
    }

    return res.status(403).json({ message: 'Not authorized to view role requests' });
  } catch (error) {
    console.error('Error fetching role requests:', error);
    res.status(500).json({ message: 'Server error fetching role requests.' });
  }
});



// --- NEW ENDPOINT: Approve or deny a role request ---
// @route   PUT /api/admin/role-request/:id
// @desc    Approve or deny a role request
// @access  Private (Superadmin only)
router.put('/role-request/:id', protect, authorizeSuperadmin, async (req, res) => {
    const { status } = req.body;
    const requestId = req.params.id;

    if (status !== 'approved' && status !== 'denied') {
        return res.status(400).json({ message: 'Invalid status provided.' });
    }

    try {
        const request = await RoleRequest.findById(requestId);
        if (!request) {
            return res.status(404).json({ message: 'Request not found.' });
        }

        // Find the user and update their role if the request is approved
        if (status === 'approved') {
            const userToUpdate = await User.findById(request.userId);
            if (userToUpdate) {
                userToUpdate.role = 'superadmin';
                await userToUpdate.save();
            }
        }
        
        // Update the request status and save
        request.status = status;
        await request.save();

        res.status(200).json({ message: `Role request ${status} successfully!` });
    } catch (error) {
        console.error('Error updating role request:', error);
        res.status(500).json({ message: 'Server error updating role request.' });
    }
});

module.exports = router;
