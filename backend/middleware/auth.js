const jwt = require('jsonwebtoken');
const User = require('../models/User');

// JWT Secret (should be in environment variables)
const JWT_SECRET = process.env.JWT_SECRET || 'oasis-elearning-secret-key-2024';

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

// Authentication middleware
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        message: 'Access denied. No token provided.' 
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ 
        message: 'Access denied. User not found.' 
      });
    }

    if (!user.isActive) {
      return res.status(401).json({ 
        message: 'Access denied. Account is inactive.' 
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        message: 'Access denied. Invalid token.' 
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        message: 'Access denied. Token expired.' 
      });
    }

    console.error('Auth middleware error:', error);
    res.status(500).json({ 
      message: 'Internal server error during authentication.' 
    });
  }
};

// Authorization middleware for different roles
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        message: 'Access denied. Authentication required.' 
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Access denied. Required roles: ${roles.join(', ')}. Your role: ${req.user.role}` 
      });
    }

    next();
  };
};

// Check if user owns the resource or has admin privileges
const authorizeOwnerOrAdmin = (resourceUserField = 'userId') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        message: 'Access denied. Authentication required.' 
      });
    }

    // Admin can access any resource
    if (req.user.role === 'admin') {
      return next();
    }

    // Check if user owns the resource
    const resourceUserId = req.params[resourceUserField] || req.body[resourceUserField];
    
    if (req.user._id.toString() === resourceUserId) {
      return next();
    }

    return res.status(403).json({ 
      message: 'Access denied. You can only access your own resources.' 
    });
  };
};

// Middleware to check if user can access course based on department
const authorizeCourseAccess = async (req, res, next) => {
  try {
    const Course = require('../models/Course');
    const courseId = req.params.courseId || req.params.id;
    
    const course = await Course.findById(courseId);
    
    if (!course) {
      return res.status(404).json({ 
        message: 'Course not found.' 
      });
    }

    // Admin can access all courses
    if (req.user.role === 'admin') {
      return next();
    }

    // Manager can access courses in their department
    if (req.user.role === 'manager' && req.user.department === course.department) {
      return next();
    }

    // Employee can access courses in their department or public courses
    if (req.user.department === course.department || course.department === 'All') {
      return next();
    }

    return res.status(403).json({ 
      message: 'Access denied. You cannot access this course.' 
    });
  } catch (error) {
    console.error('Course authorization error:', error);
    res.status(500).json({ 
      message: 'Internal server error during course authorization.' 
    });
  }
};

// Optional authentication - doesn't fail if no token provided
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-password');
      
      if (user && user.isActive) {
        req.user = user;
      }
    }

    next();
  } catch (error) {
    // Don't fail, just continue without user
    next();
  }
};

module.exports = {
  generateToken,
  authenticateToken,
  authorizeRoles,
  authorizeOwnerOrAdmin,
  authorizeCourseAccess,
  optionalAuth
};
