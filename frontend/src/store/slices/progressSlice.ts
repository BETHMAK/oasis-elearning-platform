import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { progressAPI } from '../../services/api';

export interface Progress {
  _id: string;
  user: string;
  course: {
    _id: string;
    title: string;
    thumbnail: string;
    duration: number;
  };
  status: 'not-started' | 'in-progress' | 'completed' | 'failed';
  enrolledAt: string;
  startedAt?: string;
  completedAt?: string;
  lastAccessedAt: string;
  totalTimeSpent: number;
  overallProgress: number;
  lessonsProgress: Array<{
    lessonId: string;
    status: 'not-started' | 'in-progress' | 'completed';
    startedAt?: string;
    completedAt?: string;
    timeSpent: number;
    bestScore: number;
    currentPosition: number;
  }>;
  quizResults: Array<{
    lessonId: string;
    attempts: Array<{
      attemptNumber: number;
      startedAt: string;
      completedAt?: string;
      score: number;
      totalQuestions: number;
      correctAnswers: number;
      passed: boolean;
      timeSpent: number;
    }>;
    bestScore: number;
    totalAttempts: number;
  }>;
  certificate?: {
    issued: boolean;
    issuedAt?: string;
    certificateId?: string;
    downloadUrl?: string;
    validUntil?: string;
  };
  rating?: {
    stars: number;
    review: string;
    submittedAt: string;
  };
}

interface ProgressState {
  userProgress: Progress[];
  currentCourseProgress: Progress | null;
  dashboardStats: {
    totalCourses: number;
    completedCourses: number;
    inProgressCourses: number;
    totalTimeSpent: number;
    averageScore: number;
    certificates: number;
    currentStreak: number;
    longestStreak: number;
  } | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: ProgressState = {
  userProgress: [],
  currentCourseProgress: null,
  dashboardStats: null,
  isLoading: false,
  error: null,
};

// Async thunks
export const fetchUserProgress = createAsyncThunk(
  'progress/fetchUserProgress',
  async (userId: string | undefined = undefined, { rejectWithValue }) => {
    try {
      const response = await progressAPI.getProgress(userId);
      return response.data.progress;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch progress');
    }
  }
);

export const fetchCourseProgress = createAsyncThunk(
  'progress/fetchCourseProgress',
  async (courseId: string, { rejectWithValue }) => {
    try {
      const response = await progressAPI.getCourseProgress(courseId);
      return response.data.progress;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch course progress');
    }
  }
);

export const updateCourseProgress = createAsyncThunk(
  'progress/updateCourseProgress',
  async ({ courseId, progressData }: { courseId: string; progressData: any }, { rejectWithValue }) => {
    try {
      const response = await progressAPI.updateProgress(courseId, progressData);
      return response.data.progress;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update progress');
    }
  }
);

const progressSlice = createSlice({
  name: 'progress',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setDashboardStats: (state, action: PayloadAction<ProgressState['dashboardStats']>) => {
      state.dashboardStats = action.payload;
    },
    updateLessonProgress: (state, action: PayloadAction<{
      lessonId: string;
      progress: Partial<Progress['lessonsProgress'][0]>;
    }>) => {
      if (state.currentCourseProgress) {
        const lessonIndex = state.currentCourseProgress.lessonsProgress.findIndex(
          lesson => lesson.lessonId === action.payload.lessonId
        );
        if (lessonIndex !== -1) {
          state.currentCourseProgress.lessonsProgress[lessonIndex] = {
            ...state.currentCourseProgress.lessonsProgress[lessonIndex],
            ...action.payload.progress,
          };
        }
      }
    },
    clearCurrentCourseProgress: (state) => {
      state.currentCourseProgress = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch user progress
      .addCase(fetchUserProgress.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUserProgress.fulfilled, (state, action) => {
        state.isLoading = false;
        state.userProgress = action.payload;
      })
      .addCase(fetchUserProgress.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Fetch course progress
      .addCase(fetchCourseProgress.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCourseProgress.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentCourseProgress = action.payload;
      })
      .addCase(fetchCourseProgress.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Update course progress
      .addCase(updateCourseProgress.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateCourseProgress.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentCourseProgress = action.payload;
        
        // Update the progress in the user progress array
        const index = state.userProgress.findIndex(
          progress => progress.course._id === action.payload.course._id
        );
        if (index !== -1) {
          state.userProgress[index] = action.payload;
        }
      })
      .addCase(updateCourseProgress.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  clearError,
  setDashboardStats,
  updateLessonProgress,
  clearCurrentCourseProgress,
} = progressSlice.actions;

export default progressSlice.reducer;
