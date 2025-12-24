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

// ============================================
// AUTHENTICATION
// ============================================
export const login = (credentials) => api.post('/auth/login', credentials);
export const logout = () => api.post('/auth/logout');

// ============================================
// BUSINESS ANALYST - DASHBOARD
// ============================================
export const getBADashboardSummary = () => api.get('/ba/dashboard/summary');
export const getBARevenueAnalytics = (params) => api.get('/ba/dashboard/revenue-analytics', { params });
export const getBAProjectAnalytics = (params) => api.get('/ba/dashboard/project-analytics', { params });
export const getBAAlerts = () => api.get('/ba/dashboard/alerts');

// ============================================
// BUSINESS ANALYST - CLIENTS
// ============================================
export const getClients = (params) => api.get('/ba/clients', { params });
export const getClient = (clientId) => api.get(`/ba/clients/${clientId}`);
export const createClient = (clientData) => api.post('/ba/clients', clientData);
export const updateClient = (clientId, clientData) => api.patch(`/ba/clients/${clientId}`, clientData);
export const deleteClient = (clientId) => api.delete(`/ba/clients/${clientId}`);
export const getClientStats = (clientId) => api.get(`/ba/clients/${clientId}/stats`);
export const logClientCommunication = (clientId, data) => 
  api.post(`/ba/clients/${clientId}/communications`, data);
export const getClientCommunications = (clientId) => 
  api.get(`/ba/clients/${clientId}/communications`);

// ============================================
// BUSINESS ANALYST - PROJECTS
// ============================================
export const getBAProjects = (params) => api.get('/ba/projects', { params });
export const getBAProject = (projectId) => api.get(`/ba/projects/${projectId}`);
export const createBAProject = (projectData) => api.post('/ba/projects', projectData);
export const updateBAProject = (projectId, projectData) => 
  api.patch(`/ba/projects/${projectId}`, projectData);
export const getBAProjectStats = (projectId) => api.get(`/ba/projects/${projectId}/stats`);
export const uploadRequirementDoc = (projectId, formData) => 
  api.post(`/ba/projects/${projectId}/requirements/upload`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
export const shareRequirementWithTL = (projectId, docId, teamLeadId) => 
  api.post(`/ba/projects/${projectId}/requirements/${docId}/share`, { team_lead_id: teamLeadId });
export const getProjectRequirements = (projectId) => 
  api.get(`/ba/projects/${projectId}/requirements`);
export const getProjectMilestones = (projectId) => 
  api.get(`/ba/projects/${projectId}/milestones`);
export const updateMilestone = (projectId, milestoneId, data) => 
  api.patch(`/ba/projects/${projectId}/milestones/${milestoneId}`, data);

// ============================================
// BUSINESS ANALYST - PAYMENTS
// ============================================
export const recordPayment = (paymentData) => api.post('/ba/payments/record', paymentData);
export const getPayments = (params) => api.get('/ba/payments', { params });
export const getPendingPayments = () => api.get('/ba/payments/pending');
export const getPaymentStats = () => api.get('/ba/payments/stats');

// ============================================
// BUSINESS ANALYST - MEETINGS
// ============================================
export const scheduleMeeting = (meetingData) => api.post('/ba/meetings', meetingData);
export const getMeetings = (params) => api.get('/ba/meetings', { params });
export const getMeeting = (meetingId) => api.get(`/ba/meetings/${meetingId}`);
export const updateMeeting = (meetingId, meetingData) => 
  api.patch(`/ba/meetings/${meetingId}`, meetingData);
export const completeMeeting = (meetingId, notes) => 
  api.post(`/ba/meetings/${meetingId}/complete`, { notes });
export const cancelMeeting = (meetingId) => api.delete(`/ba/meetings/${meetingId}`);
export const getUpcomingMeetingsCount = () => api.get('/ba/meetings/upcoming/count');

// ============================================
// TEAM LEAD - DASHBOARD
// ============================================
export const getTLDashboardSummary = () => api.get('/team-lead/dashboard/summary');

// ============================================
// TEAM LEAD - PROJECTS
// ============================================
export const getTLProjects = (params) => api.get('/team-lead/projects', { params });
export const getTLPendingApprovalProjects = () => api.get('/team-lead/projects/pending-approval');
export const getTLActiveProjects = () => api.get('/team-lead/projects/active');
export const getTLProject = (projectId) => api.get(`/team-lead/projects/${projectId}`);
export const completeProject = (projectId, data) => 
  api.post(`/team-lead/projects/${projectId}/complete`, data);

// ============================================
// TEAM LEAD - REQUIREMENTS
// ============================================
export const getTLRequirements = (projectId, params) => 
  api.get(`/team-lead/projects/${projectId}/requirements`, { params });
export const approveRequirement = (projectId, docId, data) => 
  api.post(`/team-lead/projects/${projectId}/requirements/approve`, {
    doc_id: docId,
    approved: true,
    approval_notes: data.notes || data.approval_notes
  });
export const rejectRequirement = (projectId, docId, data) => 
  api.post(`/team-lead/projects/${projectId}/requirements/approve`, {
    doc_id: docId,
    approved: false,
    approval_notes: data.notes || data.rejection_notes
  });

// ============================================
// TEAM LEAD - MILESTONES
// ============================================
export const getTLMilestones = (projectId) => 
  api.get(`/team-lead/projects/${projectId}/milestones`);
export const notifyMilestoneCompletion = (projectId, data) => 
  api.post(`/team-lead/projects/${projectId}/milestones/notify`, data);

// ============================================
// TEAM LEAD - TEAM
// ============================================
export const getTeamMembers = () => api.get('/teams');
export const getTeam = (teamId) => api.get(`/teams/${teamId}`);
export const getTeamMembersList = (teamId) => api.get(`/teams/${teamId}/members`);

// ============================================
// HR
// ============================================
export const createUser = (userData) => api.post('/hr/employees/create', userData);
export const getEmployees = (params) => api.get('/hr/employees', { params });
export const getEmployee = (employeeId) => api.get(`/hr/employees/${employeeId}`);
export const getEmployeeStats = (employeeId) => api.get(`/hr/employee/${employeeId}/stats`);
export const getEmployeeAppBreakdown = (employeeId, startDate, endDate) =>
  api.get(`/hr/employee/${employeeId}/app-breakdown`, {
    params: {
      start_date: startDate,
      end_date: endDate
    }
  });
export const updateSettings = (settings) => api.put('/hr/settings', settings);
export const getEmployeeAIProductivity = (employeeId) =>
  api.get(`/hr/employee/${employeeId}/ai-productivity`);
export const getHRDashboard = () => api.get('/hr/dashboard');
export const getAttendanceRecords = (params) => api.get('/hr/attendance', { params });

// ============================================
// EMPLOYEE
// ============================================
export const employeeLogin = () => api.post('/employee/login');
export const employeeLogout = () => api.post('/employee/logout');
export const getEmployeeStatus = () => api.get('/employee/status');
export const clockIn = () => api.post('/employee/login');  
export const clockOut = () => api.post('/employee/logout');  
export const getEmployeeProfile = () => api.get('/employee/profile');
export const logActivity = (activityData) => api.post('/employee/activity', activityData);
export const getActivityHistory = (params) =>
  api.get('/employee/activity-history', { params });

// ============================================
// TASKS
// ============================================
export const createTask = (taskData) => api.post('/tasks/create', taskData);
export const getMyTasks = () => api.get('/tasks/my-tasks');
export const getAllTasks = () => api.get('/tasks/all');
export const getTask = (taskId) => api.get(`/tasks/${taskId}`);
export const updateTask = (taskId, updateData) => api.patch(`/tasks/${taskId}`, updateData);
export const updateTaskStatus = (taskId, status) => 
  api.patch(`/tasks/${taskId}/status`, { status });
export const deleteTask = (taskId) => api.delete(`/tasks/${taskId}`);
export const validateTaskCompletion = (taskId, data) => 
  api.post(`/tasks/${taskId}/validate`, data);
export const updateTaskTime = (taskId, timeData) => 
  api.patch(`/tasks/${taskId}/time`, timeData);
export const uploadTaskDeliverable = (taskId, formData) => 
  api.post(`/tasks/${taskId}/deliverables`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
export const getTaskDeliverables = (taskId) => api.get(`/tasks/${taskId}/deliverables`);
export const reviewDeliverable = (taskId, deliverableId, data) => 
  api.patch(`/tasks/${taskId}/deliverables/${deliverableId}/review`, data);
export const deleteDeliverable = (taskId, deliverableId) => 
  api.delete(`/tasks/${taskId}/deliverables/${deliverableId}`);
export const getTaskStats = () => api.get('/tasks/stats/overview');
export const getEmployeeTaskStats = (employeeId) => 
  api.get(`/tasks/stats/employee/${employeeId}`);

// ============================================
// TEAMS
// ============================================
export const createTeam = (teamData) => api.post('/teams', teamData);
export const getTeams = (params) => api.get('/teams', { params });
export const updateTeam = (teamId, teamData) => api.patch(`/teams/${teamId}`, teamData);
export const deleteTeam = (teamId) => api.delete(`/teams/${teamId}`);
export const addTeamMember = (teamId, employeeId) => 
  api.post(`/teams/${teamId}/members`, { employee_id: employeeId });
export const removeTeamMember = (teamId, employeeId) => 
  api.delete(`/teams/${teamId}/members/${employeeId}`);

// ============================================
// PROJECTS (HR - Legacy)
// ============================================
export const getProjects = (params) => api.get('/projects', { params });
export const getProject = (projectId) => api.get(`/projects/${projectId}`);
export const createProject = (projectData) => api.post('/projects', projectData);
export const updateProject = (projectId, projectData) => 
  api.patch(`/projects/${projectId}`, projectData);
export const deleteProject = (projectId) => api.delete(`/projects/${projectId}`);
export const updateProjectStatus = (projectId, status) => 
  api.patch(`/projects/${projectId}/status`, { status });
export const updateProjectProgress = (projectId, progress) => 
  api.patch(`/projects/${projectId}/progress`, { progress });
export const uploadProjectDocument = (projectId, formData) => 
  api.post(`/projects/${projectId}/documents`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
export const getProjectDocuments = (projectId) => 
  api.get(`/projects/${projectId}/documents`);
export const deleteProjectDocument = (projectId, docId) => 
  api.delete(`/projects/${projectId}/documents/${docId}`);
export const getProjectStats = (projectId) => api.get(`/projects/${projectId}/stats`);

// ============================================
// MESSAGES
// ============================================
export const sendMessage = (messageData) => api.post('/messages/send', messageData);
export const getMyMessages = () => api.get('/messages/my-messages');
export const markAsRead = (messageId) => api.patch(`/messages/${messageId}/read`);
export const getUnreadCount = () => api.get('/messages/unread-count');

// ============================================
// NOTES (Sticky Notes)
// ============================================
export const getNotes = () => api.get('/notes');
export const createNote = (noteData) => api.post('/notes', noteData);
export const updateNote = (noteId, noteData) => api.patch(`/notes/${noteId}`, noteData);
export const deleteNote = (noteId) => api.delete(`/notes/${noteId}`);
export const togglePinNote = (noteId) => api.patch(`/notes/${noteId}/pin`);

// ============================================
// AGENT (Desktop)
// ============================================
export const submitActivity = (activityData) => api.post('/agent/activity', activityData);
export const uploadScreenshot = (formData) => api.post('/agent/screenshot', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});

// ============================================
// SUPER ADMIN
// ============================================
export const createHRUser = (userData) => api.post('/super-admin/users/hr', userData);
export const createBAUser = (userData) => api.post('/super-admin/users/business-analyst', userData);
export const createSuperAdmin = (userData) => api.post('/super-admin/users/super-admin', userData);
export const getAllUsers = (params) => api.get('/super-admin/users', { params });
export const getUser = (userId) => api.get(`/super-admin/users/${userId}`);
export const updateUser = (userId, userData) => api.patch(`/super-admin/users/${userId}`, userData);
export const deleteUser = (userId) => api.delete(`/super-admin/users/${userId}`);
export const resetUserPassword = (userId, passwordData) => 
  api.post(`/super-admin/users/${userId}/reset-password`, passwordData);
export const getOverrideRequests = () => api.get('/super-admin/override-requests');
export const approveOverrideRequest = (requestId) => 
  api.post(`/super-admin/override-requests/${requestId}/approve`);
export const rejectOverrideRequest = (requestId) => 
  api.post(`/super-admin/override-requests/${requestId}/reject`);
export const getAuditLogs = (params) => api.get('/super-admin/audit-logs', { params });
export const getSystemStats = () => api.get('/super-admin/stats');

export default api;