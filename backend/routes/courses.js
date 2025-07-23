const express = require('express');
const Course = require('../models/Course');
const Progress = require('../models/Progress');
const { authenticateToken, authorizeRoles, authorizeCourseAccess } = require('../middleware/auth');

const router = express.Router();

// Get all courses with filtering and pagination
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, search, category, department, level } = req.query;
    
    let query = { isPublished: true };
    
    // Search functionality
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }
    
    // Filter by category
    if (category) {
      query.category = category;
    }
    
    // Filter by department
    if (department) {
      query.department = { $in: [department, 'All'] };
    }
    
    // Filter by level
    if (level) {
      query.level = level;
    }
    
    const courses = await Course.find(query)
      .populate('createdBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Course.countDocuments(query);
    
    res.json({
      courses,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
      message: 'Courses retrieved successfully'
    });
  } catch (error) {
    console.error('Courses fetch error:', error);
    res.status(500).json({ message: 'Failed to fetch courses' });
  }
});

// Get a single course by ID
router.get('/:id', authenticateToken, authorizeCourseAccess, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('createdBy', 'firstName lastName avatar')
      .populate('prerequisites', 'title thumbnail');

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Get user's progress for this course if exists
    const progress = await Progress.findOne({ 
      user: req.user._id, 
      course: req.params.id 
    });

    res.json({
      course,
      progress,
      message: 'Course retrieved successfully'
    });
  } catch (error) {
    console.error('Course fetch error:', error);
    res.status(500).json({ message: 'Failed to fetch course' });
  }
});

// Enroll in a course
router.post('/:id/enroll', authenticateToken, authorizeCourseAccess, async (req, res) => {
  try {
    const courseId = req.params.id;
    const userId = req.user._id;
    
    // Check if user is already enrolled
    const existingProgress = await Progress.findOne({ user: userId, course: courseId });
    if (existingProgress) {
      return res.status(400).json({ message: 'Already enrolled in this course' });
    }
    
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Create progress record
    const progress = new Progress({
      user: userId,
      course: courseId,
      lessonsProgress: course.lessons.map((lesson, index) => ({
        lessonId: lesson._id,
        status: 'not-started',
        order: index
      }))
    });
    
    await progress.save();
    
    // Update course enrollment count
    course.enrollment.enrolled += 1;
    await course.save();
    
    res.json({
      progress,
      message: 'Successfully enrolled in course'
    });
  } catch (error) {
    console.error('Course enrollment error:', error);
    res.status(500).json({ message: 'Failed to enroll in course' });
  }
});

// Create a new course (admin only)
router.post('/', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const courseData = {
      ...req.body,
      createdBy: req.user._id,
      lastUpdatedBy: req.user._id
    };
    
    const course = new Course(courseData);
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

// Update a course by ID (admin only)
router.put('/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const updateData = {
      ...req.body,
      lastUpdatedBy: req.user._id
    };
    
    const course = await Course.findByIdAndUpdate(req.params.id, updateData, {
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
router.delete('/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Also delete all progress records for this course
    await Progress.deleteMany({ course: req.params.id });

    res.json({
      message: 'Course deleted successfully'
    });
  } catch (error) {
    console.error('Course delete error:', error);
    res.status(500).json({ message: 'Failed to delete course' });
  }
});

module.exports = router;
