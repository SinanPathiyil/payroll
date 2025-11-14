# desktop-agent/config.py
import json
import os
from pathlib import Path

class Config:
    def __init__(self):
        # Try to load from config.json first
        config_path = Path(__file__).parent / "config.json"
        
        if config_path.exists():
            with open(config_path, 'r') as f:
                config = json.load(f)
                self.API_URL = config.get('api_url', 'http://localhost:8000')
                self.EMPLOYEE_EMAIL = config.get('employee_email', 'employee@company.com')
                self.EMPLOYEE_PASSWORD = config.get('employee_password', 'password123')
                self.ACTIVITY_CHECK_INTERVAL = config.get('activity_check_interval', 10)
                self.IDLE_THRESHOLD = config.get('idle_threshold', 20)
                self.TRACK_MOUSE = config.get('track_mouse', True)
                self.TRACK_KEYBOARD = config.get('track_keyboard', True)
                self.TRACK_APPLICATIONS = config.get('track_applications', True)
                print(f"[OK] Config loaded: {self.API_URL}")  # Changed from emoji
        else:
            # Fallback to environment variables or defaults
            self.API_URL = os.getenv('API_URL', 'http://localhost:8000')
            self.EMPLOYEE_EMAIL = os.getenv('EMPLOYEE_EMAIL', 'employee@company.com')
            self.EMPLOYEE_PASSWORD = os.getenv('EMPLOYEE_PASSWORD', 'password123')
            self.ACTIVITY_CHECK_INTERVAL = int(os.getenv('ACTIVITY_CHECK_INTERVAL', '10'))
            self.IDLE_THRESHOLD = int(os.getenv('IDLE_THRESHOLD', '20'))
            self.TRACK_MOUSE = os.getenv('TRACK_MOUSE', 'True').lower() == 'true'
            self.TRACK_KEYBOARD = os.getenv('TRACK_KEYBOARD', 'True').lower() == 'true'
            self.TRACK_APPLICATIONS = os.getenv('TRACK_APPLICATIONS', 'True').lower() == 'true'
            print("[WARN] config.json not found, using defaults")