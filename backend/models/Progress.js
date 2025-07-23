const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  status: {
    type: String,
    enum: ['not-started', 'in-progress', 'completed', 'failed'],
    default: 'not-started'
  },
  enrolledAt: {
    type: Date,
    default: Date.now
  },
  startedAt: Date,
  completedAt: Date,
  lastAccessedAt: {
    type: Date,
    default: Date.now
  },
  totalTimeSpent: {
    type: Number, // in minutes
    default: 0
  },
  overallProgress: {
    type: Number, // percentage (0-100)
    default: 0
  },
  lessonsProgress: [{
    lessonId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    status: {
      type: String,
      enum: ['not-started', 'in-progress', 'completed'],
      default: 'not-started'
    },
    startedAt: Date,
    completedAt: Date,
    timeSpent: {
      type: Number, // in minutes
      default: 0
    },
    attempts: [{
      startedAt: {
        type: Date,
        default: Date.now
      },
      completedAt: Date,
      score: Number,
      passed: Boolean,
      answers: [{
        questionId: String,
        selectedAnswer: String,
        isCorrect: Boolean,
        timeSpent: Number
      }]
    }],
    bestScore: {
      type: Number,
      default: 0
    },
    currentPosition: {
      type: Number, // for video/interactive content
      default: 0
    }
  }],
  quizResults: [{
    lessonId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    attempts: [{
      attemptNumber: Number,
      startedAt: {
        type: Date,
        default: Date.now
      },
      completedAt: Date,
      score: {
        type: Number,
        required: true
      },
      totalQuestions: Number,
      correctAnswers: Number,
      passed: {
        type: Boolean,
        required: true
      },
      timeSpent: Number, // in seconds
      answers: [{
        questionId: String,
        question: String,
        selectedAnswer: String,
        correctAnswer: String,
        isCorrect: Boolean,
        points: Number,
        timeSpent: Number
      }]
    }],
    bestScore: {
      type: Number,
      default: 0
    },
    totalAttempts: {
      type: Number,
      default: 0
    }
  }],
  finalAssessment: {
    attempts: [{
      attemptNumber: Number,
      startedAt: Date,
      completedAt: Date,
      score: Number,
      passed: Boolean,
      timeSpent: Number,
      answers: [{
        questionId: String,
        selectedAnswer: String,
        isCorrect: Boolean,
        points: Number
      }]
    }],
    bestScore: {
      type: Number,
      default: 0
    },
    passed: {
      type: Boolean,
      default: false
    }
  },
  certificate: {
    issued: {
      type: Boolean,
      default: false
    },
    issuedAt: Date,
    certificateId: String,
    downloadUrl: String,
    validUntil: Date
  },
  notes: [{
    lessonId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    content: {
      type: String,
      required: true
    },
    timestamp: {
      type: Number, // for video content
      default: 0
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  }],
  bookmarks: [{
    lessonId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    timestamp: {
      type: Number, // for video content
      default: 0
    },
    title: String,
    description: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  rating: {
    stars: {
      type: Number,
      min: 1,
      max: 5
    },
    review: String,
    submittedAt: Date
  },
  streakData: {
    currentStreak: {
      type: Number,
      default: 0
    },
    longestStreak: {
      type: Number,
      default: 0
    },
    lastActivityDate: Date
  }
}, {
  timestamps: true
});

// Compound indexes for better performance
progressSchema.index({ user: 1, course: 1 }, { unique: true });
progressSchema.index({ user: 1, status: 1 });
progressSchema.index({ course: 1, status: 1 });
progressSchema.index({ completedAt: -1 });
progressSchema.index({ lastAccessedAt: -1 });

// Virtual for completion percentage
progressSchema.virtual('completionPercentage').get(function() {
  return this.overallProgress;
});

// Method to calculate overall progress
progressSchema.methods.calculateProgress = function() {
  if (!this.lessonsProgress || this.lessonsProgress.length === 0) {
    return 0;
  }

  const completedLessons = this.lessonsProgress.filter(
    lesson => lesson.status === 'completed'
  ).length;

  return Math.round((completedLessons / this.lessonsProgress.length) * 100);
};

// Method to update progress
progressSchema.methods.updateProgress = function() {
  this.overallProgress = this.calculateProgress();
  
  // Update status based on progress
  if (this.overallProgress === 0) {
    this.status = 'not-started';
  } else if (this.overallProgress === 100) {
    this.status = 'completed';
    if (!this.completedAt) {
      this.completedAt = new Date();
    }
  } else {
    this.status = 'in-progress';
    if (!this.startedAt) {
      this.startedAt = new Date();
    }
  }

  this.lastAccessedAt = new Date();
};

// Pre-save middleware to update progress
progressSchema.pre('save', function(next) {
  this.updateProgress();
  next();
});

module.exports = mongoose.model('Progress', progressSchema);
