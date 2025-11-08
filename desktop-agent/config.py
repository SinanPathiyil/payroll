import json
import os

class Config:
    def __init__(self):
        config_path = os.path.join(os.path.dirname(__file__), 'config.json')
        
        # Try to load from config.json
        if os.path.exists(config_path):
            try:
                with open(config_path, 'r') as f:
                    config_data = json.load(f)
            except:
                print("⚠️ Error reading config.json, using defaults")
                config_data = {}
        else:
            print("⚠️ config.json not found, using defaults")
            config_data = {}
        
        # Settings
        self.API_URL = config_data.get('api_url', 'http://localhost:8000')
        self.EMPLOYEE_EMAIL = config_data.get('employee_email', 'employee@company.com')
        self.EMPLOYEE_PASSWORD = config_data.get('employee_password', 'password123')
        self.ACTIVITY_CHECK_INTERVAL = int(config_data.get('activity_check_interval', 60))
        self.IDLE_THRESHOLD = int(config_data.get('idle_threshold', 180))
        self.TRACK_MOUSE = config_data.get('track_mouse', True)
        self.TRACK_KEYBOARD = config_data.get('track_keyboard', True)
        self.TRACK_APPLICATIONS = config_data.get('track_applications', True)
        
        print(f"✅ Config loaded: {self.API_URL}")