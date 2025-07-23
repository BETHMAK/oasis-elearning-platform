const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { generateToken } = require('../middleware/auth');

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const { firstName, lastName, email, password, department, position } = req.body;

    if (!firstName || !lastName || !email || !password || !department) {
      return res.status(400).json({
        message: 'Please fill in all required fields.'
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        message: 'Email is already registered.'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = new User({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      department,
      position
    });

    await user.save();
    const token = generateToken(user._id);
    
    res.status(201).json({
      message: 'User registered successfully!',
      user: user.toJSON(),
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      message: 'Internal server error during registration.'
    });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        message: 'Please enter email and password.'
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        message: 'User not found.'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        message: 'Invalid credentials.'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        message: 'Account is inactive. Please contact support.'
      });
    }

    const token = generateToken(user._id);
    user.lastLogin = Date.now();
    await user.save();

    res.status(200).json({
      message: 'User logged in successfully!',
      user: user.toJSON(),
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      message: 'Internal server error during login.'
    });
  }
});

// Logout
router.post('/logout', (req, res) => {
  // Invalidate token on client side by removing it
  res.status(200).json({
    message: 'User logged out successfully!'
  });
});

module.exports = router;
