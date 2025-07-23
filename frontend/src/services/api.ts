import axios, { AxiosResponse } from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5001/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API endpoints
export const authAPI = {
  login: (credentials: { email: string; password: string }) =>
    api.post('/auth/login', credentials),
  
  register: (userData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    department: string;
    position?: string;
  }) => api.post('/auth/register', userData),
  
  logout: () => api.post('/auth/logout'),
};

export const userAPI = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data: any) => api.put('/users/profile', data),
  getDashboardStats: () => api.get('/users/dashboard/stats'),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.put('/users/change-password', data),
};

export const courseAPI = {
  getCourses: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    department?: string;
    level?: string;
  }) => api.get('/courses', { params }),
  
  getCourse: (id: string) => api.get(`/courses/${id}`),
  enrollInCourse: (id: string) => api.post(`/courses/${id}/enroll`),
  createCourse: (data: any) => api.post('/courses', data),
  updateCourse: (id: string, data: any) => api.put(`/courses/${id}`, data),
  deleteCourse: (id: string) => api.delete(`/courses/${id}`),
};

export const progressAPI = {
  getProgress: (userId?: string) => api.get('/progress', { params: { userId } }),
  getCourseProgress: (courseId: string) => api.get(`/progress/course/${courseId}`),
  updateProgress: (courseId: string, data: any) =>
    api.put(`/progress/course/${courseId}`, data),
};

export default api;
