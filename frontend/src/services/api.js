import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
console.log("API URL : ", API_URL);


const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add token to all requests
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

// Response interceptor - Handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// Auth
export const login = (credentials) => api.post('/auth/login', credentials);
export const logout = () => api.post('/auth/logout');

// HR
export const createUser = (userData) => api.post('/hr/create-user', userData);
export const getEmployees = () => api.get('/hr/employees');
export const getEmployeeStats = (employeeId) => api.get(`/hr/employee/${employeeId}/stats`);
// <<< ADD THIS NEW FUNCTION >>>
export const getEmployeeAppBreakdown = (employeeId, startDate, endDate) => 
  api.get(`/hr/employee/${employeeId}/app-breakdown`, {
    params: {
      start_date: startDate,
      end_date: endDate
    }
  });
// <<< END OF NEW FUNCTION >>>
export const updateSettings = (settings) => api.put('/hr/settings', settings);

// Get AI productivity analysis for an employee (HR only)
export const getEmployeeAIProductivity = (employeeId) => 
  api.get(`/hr/employee/${employeeId}/ai-productivity`);

// Employee
export const employeeLogin = () => api.post('/employee/login');
export const employeeLogout = () => api.post('/employee/logout');
export const getEmployeeStatus = () => api.get('/employee/status');
export const logActivity = (activityData) => api.post('/employee/activity', activityData);
export const getActivityHistory = (params) =>
  api.get('/employee/activity-history', { params });

// Tasks
export const createTask = (taskData) => api.post('/tasks/create', taskData);
export const getMyTasks = () => api.get('/tasks/my-tasks');
export const updateTask = (taskId, updateData) => api.put(`/tasks/${taskId}/update`, updateData);
export const getAllTasks = () => api.get('/tasks/all');

// Messages
export const getMyMessages = () => api.get('/messages/my-messages');
export const markAsRead = (messageId) => api.put(`/messages/${messageId}/read`);
export const sendMessage = (messageData) => api.post('/messages/send', messageData);
export const getUnreadCount = () => api.get('/messages/unread-count');

export default api;