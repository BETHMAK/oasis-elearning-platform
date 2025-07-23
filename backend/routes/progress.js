const express = require('express');
const Progress = require('../models/Progress');
const { authenticateToken, authorizeOwnerOrAdmin } = require('../middleware/auth');

const router = express.Router();

// Get all progress for a specific user or all users (admin/manager)
router.get('/', authenticateToken, authorizeOwnerOrAdmin('user'), async (req, res) => {
  try {
    const { userId } = req.query;
    const query = userId ? { user: userId } : {};

    const progress = await Progress.find(query)
      .populate('user', 'firstName lastName email')
      .populate('course', 'title thumbnail duration');

    res.json({
      progress,
      message: 'Progress retrieved successfully'
    });
  } catch (error) {
    console.error('Progress fetch error:', error);
    res.status(500).json({ message: 'Failed to fetch progress' });
  }
});

// Get progress for a specific course for current user
router.get('/course/:courseId', authenticateToken, async (req, res) => {
  try {
    const { courseId } = req.params;
    const progress = await Progress.findOne({
      user: req.user._id,
      course: courseId
    });

    if (!progress) {
      return res.status(404).json({ message: 'Progress not found for this course' });
    }

    res.json({
      progress,
      message: 'Progress retrieved successfully'
    });
  } catch (error) {
    console.error('Course progress fetch error:', error);
    res.status(500).json({ message: 'Failed to fetch course progress' });
  }
});

// Update course progress
router.put('/course/:courseId', authenticateToken, async (req, res) => {
  try {
    const { courseId } = req.params;
    const updateData = req.body;

    const progress = await Progress.findOneAndUpdate(
      {
        user: req.user._id,
        course: courseId
      },
      updateData,
      { new: true, runValidators: true }
    );

    if (!progress) {
      return res.status(404).json({ message: 'Progress not found for this course' });
    }

    res.json({
      progress,
      message: 'Progress updated successfully'
    });
  } catch (error) {
    console.error('Progress update error:', error);
    res.status(500).json({ message: 'Failed to update progress' });
  }
});

module.exports = router;
