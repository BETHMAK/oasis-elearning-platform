import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { courseAPI } from '../../services/api';

export interface Course {
  _id: string;
  title: string;
  description: string;
  thumbnail: string;
  category: string;
  department: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  duration: number;
  instructor: {
    name: string;
    bio: string;
    avatar: string;
    credentials: string[];
  };
  lessons: Array<{
    _id: string;
    title: string;
    description: string;
    content: string;
    contentType: 'video' | 'text' | 'interactive' | 'pdf' | 'scorm';
    duration: number;
    order: number;
  }>;
  tags: string[];
  learningObjectives: string[];
  certification: {
    isAvailable: boolean;
    template: string;
    validityPeriod: number;
    cpd_points: number;
  };
  enrollment: {
    isOpen: boolean;
    capacity: number;
    enrolled: number;
    startDate?: Date;
    endDate?: Date;
  };
  stats: {
    averageRating: number;
    totalRatings: number;
    completionRate: number;
    averageCompletionTime: number;
  };
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CourseState {
  courses: Course[];
  currentCourse: Course | null;
  isLoading: boolean;
  error: string | null;
  filters: {
    category: string;
    department: string;
    level: string;
    search: string;
  };
  pagination: {
    currentPage: number;
    totalPages: number;
    limit: number;
    total: number;
  };
}

const initialState: CourseState = {
  courses: [],
  currentCourse: null,
  isLoading: false,
  error: null,
  filters: {
    category: '',
    department: '',
    level: '',
    search: '',
  },
  pagination: {
    currentPage: 1,
    totalPages: 1,
    limit: 12,
    total: 0,
  },
};

// Async thunks
export const fetchCourses = createAsyncThunk(
  'courses/fetchCourses',
  async (params: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    department?: string;
    level?: string;
  } = {}, { rejectWithValue }) => {
    try {
      const response = await courseAPI.getCourses(params);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch courses');
    }
  }
);

export const fetchCourse = createAsyncThunk(
  'courses/fetchCourse',
  async (courseId: string, { rejectWithValue }) => {
    try {
      const response = await courseAPI.getCourse(courseId);
      return response.data.course;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch course');
    }
  }
);

export const enrollInCourse = createAsyncThunk(
  'courses/enrollInCourse',
  async (courseId: string, { rejectWithValue }) => {
    try {
      const response = await courseAPI.enrollInCourse(courseId);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to enroll in course');
    }
  }
);

export const createCourse = createAsyncThunk(
  'courses/createCourse',
  async (courseData: Partial<Course>, { rejectWithValue }) => {
    try {
      const response = await courseAPI.createCourse(courseData);
      return response.data.course;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create course');
    }
  }
);

const courseSlice = createSlice({
  name: 'courses',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setFilters: (state, action: PayloadAction<Partial<CourseState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    setPagination: (state, action: PayloadAction<Partial<CourseState['pagination']>>) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
    clearCurrentCourse: (state) => {
      state.currentCourse = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch courses
      .addCase(fetchCourses.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCourses.fulfilled, (state, action) => {
        state.isLoading = false;
        state.courses = action.payload.courses;
        state.pagination = {
          currentPage: action.payload.currentPage,
          totalPages: action.payload.totalPages,
          limit: state.pagination.limit,
          total: action.payload.total,
        };
      })
      .addCase(fetchCourses.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Fetch single course
      .addCase(fetchCourse.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCourse.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentCourse = action.payload;
      })
      .addCase(fetchCourse.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Enroll in course
      .addCase(enrollInCourse.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(enrollInCourse.fulfilled, (state) => {
        state.isLoading = false;
        // Update enrollment count if current course is being viewed
        if (state.currentCourse) {
          state.currentCourse.enrollment.enrolled += 1;
        }
      })
      .addCase(enrollInCourse.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Create course
      .addCase(createCourse.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(createCourse.fulfilled, (state, action) => {
        state.isLoading = false;
        state.courses.unshift(action.payload);
      })
      .addCase(createCourse.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, setFilters, setPagination, clearCurrentCourse } = courseSlice.actions;
export default courseSlice.reducer;
