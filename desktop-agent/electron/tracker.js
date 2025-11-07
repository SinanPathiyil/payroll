// desktop-agent/electron/tracker.js

const activeWin = require('active-win');
const EventEmitter = require('events');
const si = require('systeminformation');

class ActivityTracker extends EventEmitter {
  constructor(api, sendInterval = 300000) {
    super();
    
    this.api = api;
    this.sendInterval = sendInterval;
    this.isTracking = false;
    
    // Current activity
    this.currentActivity = {
      application: '',
      window_title: '',
      url: null,
      start_time: null,
      duration: 0,
      keyboard_events: 0,
      mouse_events: 0,
      idle_time: 0,
      last_activity: Date.now()
    };
    
    // Configuration
    this.IDLE_THRESHOLD = 5 * 60 * 1000; // 5 minutes
    this.WINDOW_CHECK_INTERVAL = 10000; // 10 seconds
    
    // Timers
    this.timers = {
      windowCheck: null,
      idleCheck: null,
      send: null
    };
    
    // Statistics
    this.stats = {
      sessions_sent: 0,
      total_time: 0,
      last_sync: null,
      current_score: 0
    };
  }

  /**
   * Start tracking
   */
  async start() {
    if (this.isTracking) {
      console.log('⚠ Tracker already running');
      return;
    }

    console.log('🔄 Starting activity tracker...');
    this.isTracking = true;

    // Initialize first activity
    await this.checkActiveWindow();

    // Setup event listeners
    this.setupEventListeners();

    // Start timers
    this.timers.windowCheck = setInterval(
      () => this.checkActiveWindow(),
      this.WINDOW_CHECK_INTERVAL
    );
    
    this.timers.idleCheck = setInterval(
      () => this.checkIdleTime(),
      60000
    );
    
    this.timers.send = setInterval(
      () => this.sendActivity(),
      this.sendInterval
    );

    console.log('✓ Activity tracker started');
    this.emit('started');
  }

  /**
   * Stop tracking
   */
  async stop() {
    if (!this.isTracking) return;

    console.log('🔄 Stopping activity tracker...');

    // Send final activity
    await this.sendActivity();

    // Clear all timers
    Object.values(this.timers).forEach(timer => {
      if (timer) clearInterval(timer);
    });

    this.isTracking = false;

    console.log('✓ Activity tracker stopped');
    this.emit('stopped');
  }

  /**
   * Setup event listeners for keyboard/mouse
   */
  setupEventListeners() {
    // Use systeminformation for activity detection
    const checkActivity = async () => {
      try {
        const processes = await si.processes();
        const currentLoad = await si.currentLoad();
                // Use CPU load as proxy for activity
                if (currentLoad.currentLoad > 5) {
                    this.currentActivity.keyboard_events++;
                    this.currentActivity.mouse_events++;
                    this.currentActivity.last_activity = Date.now();
                  }
                } catch (error) {
                  console.error('Error checking activity:', error);
                }
              };
          
              // Check every 2 seconds
              this.timers.activityCheck = setInterval(checkActivity, 2000);
            }
          
            /**
             * Check active window
             */
            async checkActiveWindow() {
              try {
                const window = await activeWin();
          
                if (!window) return;
          
                // Check if window changed
                const windowChanged =
                  window.title !== this.currentActivity.window_title ||
                  window.owner.name !== this.currentActivity.application;
          
                if (windowChanged && this.currentActivity.start_time) {
                  // Send previous activity
                  await this.sendActivity();
          
                  // Start new activity
                  this.currentActivity = {
                    application: window.owner.name,
                    window_title: window.title,
                    url: this.extractUrl(window),
                    start_time: Date.now(),
                    duration: 0,
                    keyboard_events: 0,
                    mouse_events: 0,
                    idle_time: 0,
                    last_activity: Date.now()
                  };
                } else if (!this.currentActivity.start_time) {
                  // Initialize first activity
                  this.currentActivity = {
                    application: window.owner.name,
                    window_title: window.title,
                    url: this.extractUrl(window),
                    start_time: Date.now(),
                    duration: 0,
                    keyboard_events: 0,
                    mouse_events: 0,
                    idle_time: 0,
                    last_activity: Date.now()
                  };
                }
              } catch (error) {
                console.error('Error checking active window:', error);
              }
            }
          
            /**
             * Extract URL from window (for browsers)
             */
            extractUrl(window) {
              // Check if browser
              const browsers = ['chrome', 'firefox', 'safari', 'edge', 'brave', 'opera'];
              const isBrowser = browsers.some(b => 
                window.owner.name.toLowerCase().includes(b)
              );
          
              if (isBrowser && window.url) {
                return window.url;
              }
          
              // Try to extract from title
              const urlMatch = window.title.match(/(https?:\/\/[^\s]+)/);
              if (urlMatch) {
                return urlMatch[1];
              }
          
              return null;
            }
          
            /**
             * Check and calculate idle time
             */
            async checkIdleTime() {
              const now = Date.now();
              const timeSinceActivity = now - this.currentActivity.last_activity;
          
              if (timeSinceActivity > this.IDLE_THRESHOLD) {
                this.currentActivity.idle_time += Math.floor(timeSinceActivity / 1000);
                this.currentActivity.last_activity = now;
              }
            }
          
            /**
             * Send activity to backend
             */
            async sendActivity() {
              if (!this.currentActivity.application || !this.currentActivity.start_time) {
                return;
              }
          
              try {
                const now = Date.now();
                this.currentActivity.duration = Math.floor(
                  (now - this.currentActivity.start_time) / 1000
                );
          
                // Only send if duration > 10 seconds
                if (this.currentActivity.duration < 10) {
                  return;
                }
          
                const payload = {
                  application: this.currentActivity.application,
                  window_title: this.currentActivity.window_title,
                  url: this.currentActivity.url,
                  duration: this.currentActivity.duration,
                  keyboard_events: this.currentActivity.keyboard_events,
                  mouse_events: this.currentActivity.mouse_events,
                  idle_time: this.currentActivity.idle_time
                };
          
                console.log('📤 Sending activity:', payload);
          
                const response = await this.api.sendActivity(payload);
          
                // Update stats
                this.stats.sessions_sent++;
                this.stats.total_time += this.currentActivity.duration;
                this.stats.last_sync = new Date().toISOString();
                this.stats.current_score = response.productivity_score || 0;
          
                console.log('✓ Activity sent successfully');
                this.emit('activity-sent', response);
          
                // Reset current activity
                this.currentActivity = {
                  application: this.currentActivity.application,
                  window_title: this.currentActivity.window_title,
                  url: this.currentActivity.url,
                  start_time: Date.now(),
                  duration: 0,
                  keyboard_events: 0,
                  mouse_events: 0,
                  idle_time: 0,
                  last_activity: Date.now()
                };
          
              } catch (error) {
                console.error('✗ Failed to send activity:', error);
                this.emit('error', error);
              }
            }
          
            /**
             * Get current statistics
             */
            getCurrentStats() {
              return {
                ...this.stats,
                current_activity: {
                  application: this.currentActivity.application,
                  window_title: this.currentActivity.window_title,
                  duration: Math.floor((Date.now() - this.currentActivity.start_time) / 1000)
                }
              };
            }
          }
          
          module.exports = ActivityTracker;