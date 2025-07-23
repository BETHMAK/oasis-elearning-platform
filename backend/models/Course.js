const mongoose = require('mongoose');

const lessonSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Lesson title is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  content: {
    type: String,
    required: [true, 'Lesson content is required']
  },
  contentType: {
    type: String,
    enum: ['video', 'text', 'interactive', 'pdf', 'scorm'],
    required: true
  },
  duration: {
    type: Number, // in minutes
    required: true
  },
  resources: [{
    name: String,
    url: String,
    type: String
  }],
  quiz: {
    questions: [{
      question: {
        type: String,
        required: true
      },
      options: [{
        text: String,
        isCorrect: Boolean
      }],
      explanation: String,
      points: {
        type: Number,
        default: 1
      }
    }],
    passingScore: {
      type: Number,
      default: 70
    },
    timeLimit: {
      type: Number, // in minutes
      default: 30
    }
  },
  order: {
    type: Number,
    required: true
  }
});

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Course title is required'],
    trim: true,
    maxlength: [100, 'Course title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Course description is required'],
    trim: true,
    maxlength: [1000, 'Course description cannot exceed 1000 characters']
  },
  thumbnail: {
    type: String,
    default: ''
  },
  category: {
    type: String,
    required: [true, 'Course category is required'],
    enum: [
      'Technical Skills',
      'Soft Skills',
      'Compliance',
      'Leadership',
      'Safety',
      'Professional Development',
      'Industry Specific',
      'Onboarding'
    ]
  },
  department: {
    type: String,
    required: [true, 'Department is required'],
    trim: true
  },
  level: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    required: true
  },
  duration: {
    type: Number, // Total duration in minutes
    required: true
  },
  instructor: {
    name: {
      type: String,
      required: true
    },
    bio: String,
    avatar: String,
    credentials: [String]
  },
  lessons: [lessonSchema],
  prerequisites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  }],
  tags: [{
    type: String,
    trim: true
  }],
  learningObjectives: [{
    type: String,
    required: true
  }],
  certification: {
    isAvailable: {
      type: Boolean,
      default: true
    },
    template: String,
    validityPeriod: {
      type: Number, // in months
      default: 12
    },
    cpd_points: {
      type: Number,
      default: 0
    }
  },
  enrollment: {
    isOpen: {
      type: Boolean,
      default: true
    },
    capacity: {
      type: Number,
      default: 0 // 0 means unlimited
    },
    enrolled: {
      type: Number,
      default: 0
    },
    startDate: Date,
    endDate: Date
  },
  settings: {
    allowDiscussions: {
      type: Boolean,
      default: true
    },
    trackProgress: {
      type: Boolean,
      default: true
    },
    showLeaderboard: {
      type: Boolean,
      default: true
    },
    requireSequentialCompletion: {
      type: Boolean,
      default: false
    }
  },
  stats: {
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    totalRatings: {
      type: Number,
      default: 0
    },
    completionRate: {
      type: Number,
      default: 0
    },
    averageCompletionTime: {
      type: Number,
      default: 0
    }
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  publishedAt: Date,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes for better performance
courseSchema.index({ category: 1, department: 1 });
courseSchema.index({ level: 1 });
courseSchema.index({ tags: 1 });
courseSchema.index({ isPublished: 1 });
courseSchema.index({ createdAt: -1 });

// Virtual for total lessons
courseSchema.virtual('totalLessons').get(function() {
  return this.lessons.length;
});

// Pre-save middleware to calculate total duration
courseSchema.pre('save', function(next) {
  if (this.lessons && this.lessons.length > 0) {
    this.duration = this.lessons.reduce((total, lesson) => total + lesson.duration, 0);
  }
  next();
});

module.exports = mongoose.model('Course', courseSchema);
