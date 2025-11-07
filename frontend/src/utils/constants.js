export const ROLES = {
    HR: 'hr',
    EMPLOYEE: 'employee'
  };
  
  export const TASK_STATUS = {
    PENDING: 'pending',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed'
  };
  
  export const ATTENDANCE_STATUS = {
    ACTIVE: 'active',
    COMPLETED: 'completed'
  };
  
  export const API_ENDPOINTS = {
    AUTH: {
      LOGIN: '/auth/login',
      LOGOUT: '/auth/logout'
    },
    HR: {
      CREATE_USER: '/hr/create-user',
      GET_EMPLOYEES: '/hr/employees',
      GET_EMPLOYEE_STATS: '/hr/employee/:id/stats',
      UPDATE_SETTINGS: '/hr/settings'
    },
    EMPLOYEE: {
      LOGIN: '/employee/login',
      LOGOUT: '/employee/logout',
      STATUS: '/employee/status',
      ACTIVITY: '/employee/activity'
    },
    TASKS: {
      CREATE: '/tasks/create',
      MY_TASKS: '/tasks/my-tasks',
      UPDATE: '/tasks/:id/update',
      ALL: '/tasks/all'
    },
    MESSAGES: {
      MY_MESSAGES: '/messages/my-messages',
      MARK_READ: '/messages/:id/read',
      SEND: '/messages/send',
      UNREAD_COUNT: '/messages/unread-count'
    }
  };
  
  export const COLORS = {
    PRIMARY: '#3B82F6',
    SUCCESS: '#10B981',
    WARNING: '#F59E0B',
    DANGER: '#EF4444',
    INFO: '#06B6D4'
  };
  
  export const DATE_FORMATS = {
    SHORT: 'MMM dd, yyyy',
    LONG: 'MMMM dd, yyyy',
    TIME: 'hh:mm a',
    DATETIME: 'MMM dd, yyyy hh:mm a'
  };