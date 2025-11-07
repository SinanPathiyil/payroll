import psutil
import time
from datetime import datetime
from pynput import mouse, keyboard
import platform

class ActivityTracker:
    def __init__(self):
        self.mouse_events = 0
        self.keyboard_events = 0
        self.active_window = None
        self.websites_visited = []
        self.apps_used = {}
        self.last_activity = time.time()
        
    def on_mouse_move(self, x, y):
        self.mouse_events += 1
        self.last_activity = time.time()
    
    def on_mouse_click(self, x, y, button, pressed):
        if pressed:
            self.mouse_events += 1
            self.last_activity = time.time()
    
    def on_key_press(self, key):
        self.keyboard_events += 1
        self.last_activity = time.time()
    
    def get_active_window(self):
        """Get active window title"""
        try:
            if platform.system() == "Windows":
                import win32gui
                window = win32gui.GetForegroundWindow()
                return win32gui.GetWindowText(window)
            elif platform.system() == "Darwin":  # macOS
                from AppKit import NSWorkspace
                active_app = NSWorkspace.sharedWorkspace().activeApplication()
                return active_app['NSApplicationName']
            else:  # Linux
                import subprocess
                return subprocess.check_output(['xdotool', 'getwindowfocus', 'getwindowname']).decode().strip()
        except Exception as e:
            return "Unknown"
    
    def get_running_apps(self):
        """Get list of running applications"""
        apps = {}
        for proc in psutil.process_iter(['name', 'cpu_percent']):
            try:
                name = proc.info['name']
                if name not in apps:
                    apps[name] = {
                        'cpu_usage': proc.info['cpu_percent'],
                        'memory': proc.memory_info().rss / 1024 / 1024  # MB
                    }
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                pass
        return apps
    
    def get_stats(self):
        """Get current activity statistics"""
        active_time = time.time() - self.last_activity
        is_idle = active_time > 60  # 1 minute idle threshold
        
        return {
            "mouse_events": self.mouse_events,
            "keyboard_events": self.keyboard_events,
            "active_window": self.get_active_window(),
            "running_apps": self.get_running_apps(),
            "is_idle": is_idle,
            "idle_time": active_time if is_idle else 0,
            "timestamp": datetime.utcnow().isoformat()
        }
    
    def reset_stats(self):
        """Reset counters"""
        self.mouse_events = 0
        self.keyboard_events = 0
    
    def start(self):
        """Start listening to mouse and keyboard events"""
        mouse_listener = mouse.Listener(
            on_move=self.on_mouse_move,
            on_click=self.on_mouse_click
        )
        keyboard_listener = keyboard.Listener(
            on_press=self.on_key_press
        )
        
        mouse_listener.start()
        keyboard_listener.start()
        
        print("✅ Activity tracking started")
        return mouse_listener, keyboard_listener