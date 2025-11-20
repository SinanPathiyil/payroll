import time
import re
from datetime import datetime
from collections import defaultdict
from pynput import mouse, keyboard
import pygetwindow as gw
import psutil

class ActivityTracker:
    def __init__(self, config, lifetime_totals=None, current_employee_email=None):
        self.config = config
        self.current_employee_email = current_employee_email
        self.last_activity_time = time.time()
        self.session_start_time = time.time()
        self.current_app = None
        self.current_window_title = None
    
        # ===============================
        # LIFETIME TOTALS (across all sessions for same employee)
        # ===============================
        if lifetime_totals:
            self.lifetime_mouse = lifetime_totals.get('lifetime_mouse', 0)
            self.lifetime_keys = lifetime_totals.get('lifetime_keys', 0)
            self.lifetime_active_seconds = lifetime_totals.get('lifetime_active_seconds', 0)
            self.lifetime_idle_seconds = lifetime_totals.get('lifetime_idle_seconds', 0)
            print(f"[OK] Resuming lifetime totals: Mouse={self.lifetime_mouse}, Keys={self.lifetime_keys}")
        else:
            self.lifetime_mouse = 0
            self.lifetime_keys = 0
            self.lifetime_active_seconds = 0
            self.lifetime_idle_seconds = 0
    
        # ===============================
        # CURRENT SESSION DATA (reset only on clock-out)
        # ===============================
        self.session_mouse_events = 0
        self.session_key_events = 0
        self.session_active_seconds = 0
        self.session_idle_seconds = 0
        
        # ===============================
        # SESSION TIME TRACKING
        # ===============================
        self.session_start_time = time.time()
        self.last_interval_time = time.time()  # ← ADD THIS
    
        # ===============================
        # IDLE TRACKING
        # ===============================
        self.total_idle_time = 0
        self.idle_start_time = None
        self.last_idle_check = time.time()
    
        # ===============================
        # APPLICATION TRACKING (reset every interval for reporting)
        # ===============================
        self.app_activities = defaultdict(lambda: {
            'mouse_movements': 0,     # Reset every interval
            'key_presses': 0,         # Reset every interval  
            'time_spent': 0,          # Reset every interval
            'last_active': time.time(),
            'window_title': '',
            'url': ''
        })
        
        # ===============================
        # SESSION APPLICATION TOTALS (reset only on clock-out)
        # ===============================
        self.session_app_activities = defaultdict(lambda: {
            'total_mouse': 0,         # Session total per app
            'total_keys': 0,          # Session total per app
            'total_time': 0,          # Session total per app
            'window_title': '',
            'url': ''
        })
    
        self.mouse_listener = None
        self.keyboard_listener = None
        self.last_app_check = time.time()
    
        self.start_listeners()
    
    def reset_session_data(self):
        """Reset current session data (called on clock-out)"""
        print(f"[RESET] Resetting session data...")
    
        # Reset session counters
        self.session_mouse_events = 0
        self.session_key_events = 0
        self.session_active_seconds = 0
        self.session_idle_seconds = 0
    
        # Reset session tracking
        self.session_start_time = time.time()
        self.last_interval_time = time.time()  # ← ADD THIS
        self.total_idle_time = 0
        self.idle_start_time = None
        
        # Reset session application totals
        self.session_app_activities.clear()
        
        # Reset interval app counters (they'll be reset anyway)
        self.reset_app_interval_data()
        
        print(f"[OK] Session data reset complete")
    
    def reset_all_data(self, new_employee_email):
        """Reset all data when employee changes"""
        print(f"[RESET] Employee changed from {self.current_employee_email} to {new_employee_email}")
        
        # Reset lifetime totals
        self.lifetime_mouse = 0
        self.lifetime_keys = 0
        self.lifetime_active_seconds = 0
        self.lifetime_idle_seconds = 0
        
        # Reset session data
        self.reset_session_data()
        
        # Update employee
        self.current_employee_email = new_employee_email
        
        print(f"[OK] All data reset for new employee")

    def on_mouse_move(self, x, y):
        current_time = time.time()

        self.check_idle_status()

        if current_time - self.last_app_check > 0.5:
            self.update_current_app()
            self.last_app_check = current_time

        if self.current_app:
            # Increment interval counter (for this 10s period)
            self.app_activities[self.current_app]['mouse_movements'] += 1
            
            # Increment session counter (for this login session)
            self.session_app_activities[self.current_app]['total_mouse'] += 1

        # Increment session totals
        self.session_mouse_events += 1
        self.last_activity_time = current_time

    def on_key_press(self, key):
        current_time = time.time()

        self.check_idle_status()

        if current_time - self.last_app_check > 1:
            self.update_current_app()
            self.last_app_check = current_time

        if self.current_app:
            # Increment interval counter (for this 10s period)
            self.app_activities[self.current_app]['key_presses'] += 1
            
            # Increment session counter (for this login session)
            self.session_app_activities[self.current_app]['total_keys'] += 1

        # Increment session totals
        self.session_key_events += 1
        self.last_activity_time = current_time

    def start_listeners(self):
        if self.config.TRACK_MOUSE:
            self.mouse_listener = mouse.Listener(on_move=self.on_mouse_move)
            self.mouse_listener.start()
            print("[OK] Mouse tracking started (per-application)")
        
        if self.config.TRACK_KEYBOARD:
            self.keyboard_listener = keyboard.Listener(on_press=self.on_key_press)
            self.keyboard_listener.start()
            print("[OK] Keyboard tracking started (per-application)")
    
    def get_active_window_info(self):
        try:
            import win32gui
            import win32process
            hwnd = win32gui.GetForegroundWindow()
            _, pid = win32process.GetWindowThreadProcessId(hwnd)
            process = psutil.Process(pid)
            window_title = win32gui.GetWindowText(hwnd)
            process_name = process.name()
            return process_name, window_title
        except:
            return "Unknown", "Unknown"
    
    def extract_url_from_title(self, window_title, process_name):
        browsers = ['chrome.exe', 'firefox.exe', 'msedge.exe', 'brave.exe']
        
        if process_name.lower() in browsers:
            title_lower = window_title.lower()
            
            # Check for common websites
            if 'facebook' in title_lower:
                return 'facebook.com'
            elif 'youtube' in title_lower:
                return 'youtube.com'
            elif 'google' in title_lower:
                return 'google.com'
            elif 'gmail' in title_lower:
                return 'gmail.com'
            elif 'twitter' in title_lower or 'x.com' in title_lower:
                return 'twitter.com'
            elif 'linkedin' in title_lower:
                return 'linkedin.com'
            elif 'github' in title_lower:
                return 'github.com'
            elif 'instagram' in title_lower:
                return 'instagram.com'
            elif 'reddit' in title_lower:
                return 'reddit.com'
            elif 'stackoverflow' in title_lower:
                return 'stackoverflow.com'
            elif 'netflix' in title_lower:
                return 'netflix.com'
            elif 'amazon' in title_lower:
                return 'amazon.com'
            
            return f"Browser: {title_lower[:40]}"
        return ""
    
    def get_app_key(self, process_name, window_title):
        """Generate unique app key with special handling"""
        process_lower = process_name.lower()
    
        # ✅ Windows Store apps / UWP apps
        if process_lower in ["applicationframehost.exe", "wwahost.exe", "RuntimeBroker.exe", "electron.exe"]:
        #if process_lower.endswith(".exe"):
            if window_title and window_title not in ["", "Unknown"]:
                app_name = window_title.split(' - ')[0].strip()
                return app_name
            return "Windows Store App"
    
        # Handle browser URLs
        url = self.extract_url_from_title(window_title, process_name)
        if url:
            return f"{process_name} ({url})"
    
        return process_name
    
    def update_current_app(self):
        process_name, window_title = self.get_active_window_info()
        app_key = self.get_app_key(process_name, window_title)

        current_time = time.time()

        if self.current_app and self.current_app != app_key:
            # Calculate time spent on previous app
            time_spent = current_time - self.app_activities[self.current_app]['last_active']
            self.app_activities[self.current_app]['time_spent'] += time_spent
    
            # Add to session total
            self.session_app_activities[self.current_app]['total_time'] += time_spent
        
            # Set new app's start time
            self.app_activities[app_key]['last_active'] = current_time
        elif self.current_app is None:
            # First time tracking - set start time
            self.app_activities[app_key]['last_active'] = current_time

        self.current_app = app_key
        self.current_window_title = window_title

        # ✅ Store the CLEANED app name, but keep original window_title for reference
        self.app_activities[app_key]['window_title'] = window_title
        self.session_app_activities[app_key]['window_title'] = window_title
    
        # ✅ Store the original process name for debugging
        self.app_activities[app_key]['process_name'] = process_name
        self.session_app_activities[app_key]['process_name'] = process_name

        url = self.extract_url_from_title(window_title, process_name)
        if url:
            self.app_activities[app_key]['url'] = url
            self.session_app_activities[app_key]['url'] = url
    
    def check_idle_status(self):
        """Check and update idle status"""
        current_time = time.time()
        time_since_activity = current_time - self.last_activity_time
    
        # User is idle if no activity for more than threshold
        is_currently_idle = time_since_activity > self.config.IDLE_THRESHOLD
    
        if is_currently_idle:
            # If just became idle, record the start time
            if self.idle_start_time is None:
                self.idle_start_time = self.last_activity_time + self.config.IDLE_THRESHOLD
        else:
            # ✅ If was idle but now active, add the idle period to total
            if self.idle_start_time is not None:
                idle_duration = current_time - self.idle_start_time  # Use current_time, not last_activity_time
                self.total_idle_time += idle_duration
                print(f"[DEBUG] User became active. Added {idle_duration:.1f}s idle time. Total idle: {self.total_idle_time:.1f}s")
                self.idle_start_time = None
    
        return is_currently_idle
    
    def is_idle(self):
        return (time.time() - self.last_activity_time) > self.config.IDLE_THRESHOLD
    
    def get_session_idle_time(self):
        """Get total idle time for current session"""
        self.check_idle_status()
        
        # Calculate total idle time
        total_idle = self.total_idle_time
        
        # If currently idle, add the current idle period
        if self.idle_start_time is not None:
            current_idle_duration = time.time() - self.idle_start_time
            total_idle += current_idle_duration
        
        return int(total_idle)
    
    def get_session_time(self):
        return int(time.time() - self.session_start_time)
    

    
    def get_activity_data(self):
        """
        Returns activity data with proper separation:
        - Lifetime cumulative (total_*, *_time_seconds)  
        - Current session (*_time, *_events)
        - Application breakdown (interval data for this 10s period)
        """
        self.check_idle_status()
    
        current_time = time.time()

        # Update current app time before getting breakdown
        if self.current_app:
            time_spent = current_time - self.app_activities[self.current_app]['last_active']
            self.app_activities[self.current_app]['time_spent'] += time_spent
            self.app_activities[self.current_app]['last_active'] = current_time
        
            # Also update session total
            self.session_app_activities[self.current_app]['total_time'] += time_spent

        # Build application breakdown (INTERVAL DATA - this 10s period only)
        app_breakdown = []
        for app_key, data in self.app_activities.items():
            if data['mouse_movements'] > 0 or data['key_presses'] > 0 or data['time_spent'] > 0:
                app_breakdown.append({
                    'application': app_key,
                    'window_title': data['window_title'],
                    'url': data['url'],
                    'mouse_movements': data['mouse_movements'],
                    'key_presses': data['key_presses'],
                    'time_spent_seconds': int(data['time_spent'])
                })

        app_breakdown.sort(key=lambda x: x['time_spent_seconds'], reverse=True)

        # Calculate interval duration (time since last interval report)
        interval_duration = int(current_time - self.last_interval_time)
    
        # Get idle time accumulated so far in this interval
        interval_idle = self.get_session_idle_time() - self.session_idle_seconds
        interval_active = max(0, interval_duration - interval_idle)
    
        # ACCUMULATE to session totals
        self.session_active_seconds += interval_active
        self.session_idle_seconds += interval_idle
    
        # Update last interval time for next call
        self.last_interval_time = current_time

        # LIFETIME TOTALS = Previous lifetime + Current session
        lifetime_mouse_total = self.lifetime_mouse + self.session_mouse_events
        lifetime_keys_total = self.lifetime_keys + self.session_key_events
        lifetime_idle_total = self.lifetime_idle_seconds + self.session_idle_seconds
        lifetime_active_total = self.lifetime_active_seconds + self.session_active_seconds

        # Calculate total app time for this interval
        total_app_time = sum(app['time_spent_seconds'] for app in app_breakdown)

        print(f"[DEBUG] Interval: {interval_duration}s | Active: {interval_active}s | Idle: {interval_idle}s")
        print(f"[DEBUG] Session totals: Active={self.session_active_seconds}s | Idle={self.session_idle_seconds}s")

        return {
            "timestamp": datetime.now().isoformat(),
            "is_idle": self.is_idle(),

            # LIFETIME CUMULATIVE (across all sessions for this employee)
            "idle_time_seconds": lifetime_idle_total,
            "active_time_seconds": lifetime_active_total,
            "total_mouse_movements": lifetime_mouse_total,
            "total_key_presses": lifetime_keys_total,

            # CURRENT SESSION DATA (this login session only - accumulated since clock-in)
            "idle_time": self.session_idle_seconds,
            "active_time": self.session_active_seconds,
            "mouse_events": self.session_mouse_events,
            "keyboard_events": self.session_key_events,

            # APPLICATION BREAKDOWN (interval data)
            "current_application": self.current_app or "Unknown",
            "applications": app_breakdown,
            "applications_total_time_seconds": total_app_time
        }
    
    def reset_app_interval_data(self):
        """Reset per-app counters for next interval (called after sending data)"""
        current_time = time.time()

        # Reset per-app interval counters only (for applications breakdown)
        for app_key in self.app_activities:
            self.app_activities[app_key]['mouse_movements'] = 0
            self.app_activities[app_key]['key_presses'] = 0
            self.app_activities[app_key]['time_spent'] = 0
            # Reset last_active to current time for next interval
            self.app_activities[app_key]['last_active'] = current_time

        # ✅ DON'T reset total_idle_time - it needs to accumulate!
        # ✅ DON'T reset idle_start_time - it's managed by check_idle_status()
    
        # Just reset the interval tracking time
        self.last_interval_time = current_time
    
        print(f"[DEBUG] Interval data reset. Idle continues tracking if still idle.")
    
    def display_summary(self):
        print("\n" + "=" * 80)
        print("[*] ACTIVITY BREAKDOWN BY APPLICATION (Session Totals)")
        print("=" * 80)
        
        for app_key, data in self.session_app_activities.items():
            minutes = data['total_time'] // 60
            print(f"\n[APP] {app_key}")
            if data['url']:
                print(f"   [WEB] {data['url']}")
            print(f"   [TIME] Time: {minutes} minutes")
            print(f"   [MOUSE] Mouse: {data['total_mouse']} movements")
            print(f"   [KEYBOARD] Keyboard: {data['total_keys']} key presses")
        
        # Session totals
        current_idle = self.get_session_idle_time()
        current_session_time = self.get_session_time()
        current_active = max(0, current_session_time - current_idle)
        
        print("\n" + "=" * 80)
        print(f"Session Time: {current_session_time // 60} minutes")
        print(f"Active Time: {current_active // 60} minutes")
        print(f"Idle Time: {current_idle // 60} minutes")
        print(f"Total Mouse (Session): {self.session_mouse_events}")
        print(f"Total Keys (Session): {self.session_key_events}")
        print("=" * 80)
    
    def stop(self):
        if self.mouse_listener:
            self.mouse_listener.stop()
        if self.keyboard_listener:
            self.keyboard_listener.stop()
        print("[STOP] Activity tracking stopped")