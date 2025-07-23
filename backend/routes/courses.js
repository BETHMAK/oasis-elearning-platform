const express = require('express');
const Course = require('../models/Course');
const { authenticateToken, authorizeRoles, authorizeCourseAccess } = require('../middleware/auth');

const router = express.Router();

// Create a new course (admin only)
router.post('/', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const course = new Course(req.body);
    await course.save();
    res.status(201).json({
      course,
      message: 'Course created successfully'
    });
  } catch (error) {
    console.error('Course create error:', error);
    res.status(500).json({ message: 'Failed to create course' });
  }
});

// Get all courses
router.get('/', authenticateToken, async (req, res) => {
  try {
    const courses = await Course.find();
    res.json({
      courses,
      message: 'Courses retrieved successfully'
    });
  } catch (error) {
    console.error('Courses fetch error:', error);
    res.status(500).json({ message: 'Failed to fetch courses' });
  }
});

// Get a single course by ID
router.get('/:id', authenticateToken, authorizeCourseAccess, async (req, res) =e {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    res.json({
      course,
      message: 'Course retrieved successfully'
    });
  } catch (error) {
    console.error('Course fetch error:', error);
    res.status(500).json({ message: 'Failed to fetch course' });
  }
});

// Update a course by ID (admin only)
router.put('/:id', authenticateToken, authorizeRoles('admin'), async (req, res) =e {
  try {
    const course = await Course.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    res.json({
      course,
      message: 'Course updated successfully'
    });
  } catch (error) {
    console.error('Course update error:', error);
    res.status(500).json({ message: 'Failed to update course' });
  }
});

// Delete a course by ID (admin only)
router.delete('/:id', authenticateToken, authorizeRoles('admin'), async (req, res) =e {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    res.json({
      message: 'Course deleted successfully'
    });
  } catch (error) {
    console.error('Course delete error:', error);
    res.status(500).json({ message: 'Failed to delete course' });
  }
});

module.exports = router;
