import time
import re
from datetime import datetime
from collections import defaultdict
from pynput import mouse, keyboard
import pygetwindow as gw
import psutil

class ActivityTracker:
    def __init__(self, config):
        self.config = config
        self.last_activity_time = time.time()
        self.session_start_time = time.time()
        self.current_app = None
        self.current_window_title = None
        
        # ADD THESE FOR IDLE TRACKING
        self.total_idle_time = 0  # Cumulative idle time
        self.idle_start_time = None  # When idle period started
        self.last_idle_check = time.time()
        
        # Track activity per app/website
        self.app_activities = defaultdict(lambda: {
            'mouse_movements': 0,
            'key_presses': 0,
            'time_spent': 0,
            'last_active': time.time(),
            'window_title': '',
            'url': ''
        })
        
        self.total_mouse_movements = 0
        self.total_key_presses = 0
        self.mouse_listener = None
        self.keyboard_listener = None
        self.last_app_check = time.time()
        
        self.start_listeners()
    
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
        url = self.extract_url_from_title(window_title, process_name)
        if url:
            return f"{process_name} ({url})"
        return process_name
    
    def update_current_app(self):
        process_name, window_title = self.get_active_window_info()
        app_key = self.get_app_key(process_name, window_title)
        
        if self.current_app and self.current_app != app_key:
            time_spent = time.time() - self.app_activities[self.current_app]['last_active']
            self.app_activities[self.current_app]['time_spent'] += time_spent
        
        self.current_app = app_key
        self.current_window_title = window_title
        self.app_activities[app_key]['last_active'] = time.time()
        self.app_activities[app_key]['window_title'] = window_title
        
        url = self.extract_url_from_title(window_title, process_name)
        if url:
            self.app_activities[app_key]['url'] = url
    
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
                print(f"[IDLE] User became idle at {datetime.fromtimestamp(self.idle_start_time).strftime('%H:%M:%S')}")
        else:
            # If was idle but now active, add the idle period to total
            if self.idle_start_time is not None:
                idle_duration = self.last_activity_time - self.idle_start_time
                self.total_idle_time += idle_duration
                print(f"[ACTIVE] User became active. Was idle for {idle_duration:.0f} seconds")
                self.idle_start_time = None
        
        return is_currently_idle
    
    def on_mouse_move(self, x, y):
        current_time = time.time()
        
        # Check idle status before updating
        self.check_idle_status()
        
        if current_time - self.last_app_check > 1:
            self.update_current_app()
            self.last_app_check = current_time
        
        if self.current_app:
            self.app_activities[self.current_app]['mouse_movements'] += 1
        
        self.total_mouse_movements += 1
        self.last_activity_time = current_time
    
    def on_key_press(self, key):
        current_time = time.time()
        
        # Check idle status before updating
        self.check_idle_status()
        
        if current_time - self.last_app_check > 1:
            self.update_current_app()
            self.last_app_check = current_time
        
        if self.current_app:
            self.app_activities[self.current_app]['key_presses'] += 1
        
        self.total_key_presses += 1
        self.last_activity_time = current_time
    
    def is_idle(self):
        return (time.time() - self.last_activity_time) > self.config.IDLE_THRESHOLD
    
    def get_idle_time(self):
        """Get total idle time for this reporting period"""
        # Check current idle status
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
        # Update idle status
        self.check_idle_status()
        
        if self.current_app:
            time_spent = time.time() - self.app_activities[self.current_app]['last_active']
            self.app_activities[self.current_app]['time_spent'] += time_spent
            self.app_activities[self.current_app]['last_active'] = time.time()
        
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
        
        # Calculate totals
        total_idle_seconds = self.get_idle_time()
        session_seconds = self.get_session_time()
        active_seconds = max(0, session_seconds - total_idle_seconds)
        
        return {
            "timestamp": datetime.utcnow().isoformat(),
            "is_idle": self.is_idle(),
            "idle_time_seconds": total_idle_seconds,  # Now returns cumulative idle time
            "active_time_seconds": active_seconds,  # Added active time
            "session_time_seconds": session_seconds,
            "total_mouse_movements": self.total_mouse_movements,
            "total_key_presses": self.total_key_presses,
            "current_application": self.current_app or "Unknown",
            "applications": app_breakdown
        }
    
    def display_summary(self):
        print("\n" + "=" * 80)
        print("[*] ACTIVITY BREAKDOWN BY APPLICATION")
        print("=" * 80)
        
        data = self.get_activity_data()
        
        for app in data['applications']:
            minutes = app['time_spent_seconds'] // 60
            print(f"\n[APP] {app['application']}")
            if app['url']:
                print(f"   [WEB] {app['url']}")
            print(f"   [TIME] Time: {minutes} minutes")
            print(f"   [MOUSE] Mouse: {app['mouse_movements']} movements")
            print(f"   [KEYBOARD] Keyboard: {app['key_presses']} key presses")
        
        # ADD IDLE TIME TO SUMMARY
        idle_mins = data['idle_time_seconds'] // 60
        active_mins = data['active_time_seconds'] // 60
        
        print("\n" + "=" * 80)
        print(f"Total Session: {data['session_time_seconds'] // 60} minutes")
        print(f"Active Time: {active_mins} minutes")
        print(f"Idle Time: {idle_mins} minutes")
        print(f"Total Mouse: {data['total_mouse_movements']}")
        print(f"Total Keys: {data['total_key_presses']}")
        print("=" * 80)
    
    def reset_counters(self):
        """Reset counters for next reporting period"""
        # Reset per-app counters
        for app_key in self.app_activities:
            self.app_activities[app_key]['mouse_movements'] = 0
            self.app_activities[app_key]['key_presses'] = 0
            self.app_activities[app_key]['time_spent'] = 0
        
        # Reset idle tracking for the period
        self.total_idle_time = 0
        # Keep idle_start_time if currently idle
    
    def stop(self):
        if self.mouse_listener:
            self.mouse_listener.stop()
        if self.keyboard_listener:
            self.keyboard_listener.stop()
        print("[STOP] Activity tracking stopped")