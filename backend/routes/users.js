const express = require('express');
const User = require('../models/User');
const Progress = require('../models/Progress');
const { authenticateToken, authorizeRoles, authorizeOwnerOrAdmin } = require('../middleware/auth');

const router = express.Router();

// Get current user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    res.json({
      user: req.user,
      message: 'Profile retrieved successfully'
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ message: 'Failed to fetch profile' });
  }
});

// Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { firstName, lastName, department, position, preferences } = req.body;
    
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        firstName,
        lastName,
        department,
        position,
        preferences
      },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      user: updatedUser,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Failed to update profile' });
  }
});

// Get all users (admin/manager only)
router.get('/', authenticateToken, authorizeRoles('admin', 'manager'), async (req, res) => {
  try {
    const { page = 1, limit = 10, search, department, role, status } = req.query;
    
    let query = {};
    
    // Search functionality
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Filter by department
    if (department) {
      query.department = department;
    }
    
    // Filter by role
    if (role) {
      query.role = role;
    }
    
    // Filter by status
    if (status) {
      query.isActive = status === 'active';
    }
    
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await User.countDocuments(query);
    
    res.json({
      users,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
      message: 'Users retrieved successfully'
    });
  } catch (error) {
    console.error('Users fetch error:', error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

// Get user by ID (admin/manager only)
router.get('/:userId', authenticateToken, authorizeRoles('admin', 'manager'), async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Get user's course progress
    const progress = await Progress.find({ user: req.params.userId })
      .populate('course', 'title thumbnail category duration')
      .sort({ updatedAt: -1 });
    
    res.json({
      user,
      progress,
      message: 'User details retrieved successfully'
    });
  } catch (error) {
    console.error('User fetch error:', error);
    res.status(500).json({ message: 'Failed to fetch user details' });
  }
});

// Update user (admin only)
router.put('/:userId', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { firstName, lastName, email, department, position, role, isActive } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      {
        firstName,
        lastName,
        email,
        department,
        position,
        role,
        isActive
      },
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({
      user,
      message: 'User updated successfully'
    });
  } catch (error) {
    console.error('User update error:', error);
    res.status(500).json({ message: 'Failed to update user' });
  }
});

// Delete user (admin only)
router.delete('/:userId', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Soft delete by deactivating
    user.isActive = false;
    await user.save();
    
    res.json({ message: 'User deactivated successfully' });
  } catch (error) {
    console.error('User deletion error:', error);
    res.status(500).json({ message: 'Failed to delete user' });
  }
});

// Get user dashboard stats
router.get('/dashboard/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Get user's progress
    const progress = await Progress.find({ user: userId });
    
    const stats = {
      totalCourses: progress.length,
      completedCourses: progress.filter(p => p.status === 'completed').length,
      inProgressCourses: progress.filter(p => p.status === 'in-progress').length,
      totalTimeSpent: progress.reduce((total, p) => total + p.totalTimeSpent, 0),
      averageScore: progress.length > 0 
        ? Math.round(progress.reduce((total, p) => {
            const bestScores = p.quizResults.map(q => q.bestScore || 0);
            const avgScore = bestScores.length > 0 ? bestScores.reduce((a, b) => a + b, 0) / bestScores.length : 0;
            return total + avgScore;
          }, 0) / progress.length)
        : 0,
      certificates: progress.filter(p => p.certificate && p.certificate.issued).length,
      currentStreak: req.user.stats.currentStreak || 0,
      longestStreak: req.user.stats.longestStreak || 0
    };
    
    res.json({
      stats,
      message: 'Dashboard stats retrieved successfully'
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ message: 'Failed to fetch dashboard stats' });
  }
});

// Change password
router.put('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }
    
    const user = await User.findById(req.user._id);
    
    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }
    
    // Update password
    user.password = newPassword;
    await user.save();
    
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ message: 'Failed to change password' });
  }
});

module.exports = router;
