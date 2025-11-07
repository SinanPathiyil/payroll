// desktop-agent/electron/api.js

const axios = require('axios');

class API {
  constructor(baseUrl, token = null) {
    this.baseUrl = baseUrl;
    this.token = token;
    
    this.client = axios.create({
      baseURL: baseUrl,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        if (this.token) {
          config.headers.Authorization = `Bearer ${this.token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response.data,
      (error) => {
        const message = error.response?.data?.detail || error.message;
        console.error('API Error:', message);
        throw new Error(message);
      }
    );
  }

  /**
   * Login
   */
  async login(credentials) {
    const response = await this.client.post('/auth/login', credentials);
    this.token = response.access_token;
    return response;
  }

  /**
   * Send activity data
   */
  async sendActivity(activityData) {
    return await this.client.post('/employee/activity/smart', activityData);
  }

  /**
   * Get productivity insights
   */
  async getProductivityInsights() {
    return await this.client.get('/employee/productivity-insights');
  }

  /**
   * Get current status
   */
  async getStatus() {
    return await this.client.get('/employee/status');
  }
}

module.exports = API;