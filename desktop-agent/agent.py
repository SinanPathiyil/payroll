import requests
import time
import os
import signal
import sys
from datetime import datetime
from activity_tracker import ActivityTracker
from config import Config

class MonitoringAgent:
    def __init__(self):
        self.config = Config()
        self.tracker = None
        self.token = None
        self.employee_email = None
        self.is_running = False
        
        # Setup signal handlers for graceful shutdown
        signal.signal(signal.SIGTERM, self._signal_handler)
        signal.signal(signal.SIGINT, self._signal_handler)
        
        print("=" * 80)
        print("[*] EMPLOYEE MONITORING AGENT - ENHANCED")
        print("=" * 80)
        print("[*] Tracks activity by application and website")
        print("=" * 80)
    
    def _signal_handler(self, signum, frame):
        """Handle shutdown signals gracefully"""
        print(f"\n[*] Received signal {signum}, shutting down gracefully...")
        self.stop()
        sys.exit(0)
    
    def authenticate(self):
        """
        Authenticate using token from environment (Electron) or credentials (standalone)
        """
        # Try to get token from environment (set by Electron)
        env_token = os.getenv('EMPLOYEE_TOKEN')
        env_email = os.getenv('EMPLOYEE_EMAIL')
        
        if env_token and env_email:
            print(f"\n[*] Using token from Electron for: {env_email}")
            self.token = env_token
            self.employee_email = env_email
            return True
        
        # Fallback: Login with credentials (standalone mode)
        print(f"\n[*] Logging in as: {self.config.EMPLOYEE_EMAIL}")
        try:
            response = requests.post(
                f"{self.config.API_URL}/api/auth/login",
                json={
                    "email": self.config.EMPLOYEE_EMAIL,
                    "password": self.config.EMPLOYEE_PASSWORD
                },
                timeout=10
            )
            
            print(f"Response status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                self.token = data["access_token"]
                self.employee_email = data["user"]["email"]
                print(f"[OK] Login successful!")
                return True
            else:
                print(f"[ERROR] Login failed: {response.status_code}")
                print(f"Response: {response.text}")
                return False
        except Exception as e:
            print(f"[ERROR] Login error: {str(e)}")
            return False
    
    def send_activity_data(self, activity_data):
        try:
            headers = {
                "Authorization": f"Bearer {self.token}",
                "Content-Type": "application/json"
            }
            
            activity_data["employee_email"] = self.employee_email
            
            # Ensure API URL doesn't have double /api
            api_url = self.config.API_URL.rstrip('/')
            if not api_url.endswith('/api'):
                endpoint = f"{api_url}/api/employee/activity"
            else:
                endpoint = f"{api_url}/employee/activity"
            
            print(f"[*] Sending to: {endpoint}")
            print(f"[*] Payload keys: {list(activity_data.keys())}")
            
            response = requests.post(
                endpoint,
                headers=headers,
                json=activity_data,
                timeout=10
            )
            
            if response.status_code == 200:
                result = response.json()
                print(f"[OK] Activity logged: {result.get('message', 'Success')}")
                self.display_activity_summary(activity_data)
                return True
            else:
                print(f"[ERROR] Failed: {response.status_code}")
                print(f"[ERROR] Response: {response.text}")
                return False
        except requests.exceptions.RequestException as e:
            print(f"[ERROR] Network error: {str(e)}")
            return False
        except Exception as e:
            print(f"[ERROR] Unexpected error: {str(e)}")
            import traceback
            traceback.print_exc()
            return False
    
    def display_activity_summary(self, activity_data):
        status = "[IDLE]" if activity_data["is_idle"] else "[ACTIVE]"
        current = activity_data.get("current_application", "Unknown")
        
        print(f"\n{status} | Currently: {current}")
        print("-" * 80)
        
        apps = activity_data.get("applications", [])[:5]
        if apps:
            print("[*] Top 5 Applications:")
            for i, app in enumerate(apps, 1):
                mins = app['time_spent_seconds'] // 60
                url = f" - {app['url']}" if app['url'] else ""
                print(f"   {i}. {app['application']}{url}")
                print(f"      Time: {mins}m | Mouse: {app['mouse_movements']} | Keys: {app['key_presses']}")
        print("-" * 80)
    
    def run(self):
        if not self.authenticate():
            print("\n[ERROR] Cannot start monitoring - authentication failed")
            print("[*] Check:")
            print("   1. Backend is running at", self.config.API_URL)
            print("   2. Employee credentials are correct")
            print("   3. Token is valid")
            return
    
        self.tracker = ActivityTracker(self.config)
    
        print(f"\n[*] Monitoring started!")
        print(f"[*] Employee: {self.employee_email}")
        print(f"[*] Updates every {self.config.ACTIVITY_CHECK_INTERVAL} seconds")
        print(f"[*] Idle threshold: {self.config.IDLE_THRESHOLD} seconds")
        print("\nPress Ctrl+C to stop\n")
    
        self.is_running = True
    
        # REMOVED: Initial 5-second wait and immediate send
        # Now just start the regular interval loop
    
        try:
            while self.is_running:
                # Wait for the configured interval FIRST
                print(f"\n[*] Collecting activity data for {self.config.ACTIVITY_CHECK_INTERVAL} seconds...")
                time.sleep(self.config.ACTIVITY_CHECK_INTERVAL)
            
                # Then get and send the data
                activity_data = self.tracker.get_activity_data()
                print(f"\n[*] Sending activity data...")
                success = self.send_activity_data(activity_data)
                if success:
                    print(f"[OK] Activity data sent successfully")
                    # Show idle/active time in summary
                    idle_time = activity_data.get('idle_time_seconds', 0)
                    active_time = activity_data.get('active_time_seconds', 0)
                    print(f"[INFO] Active: {active_time}s, Idle: {idle_time}s")
                else:
                    print(f"[WARN] Failed to send activity data")
            
                self.tracker.reset_counters()
            
        except KeyboardInterrupt:
            print("\n\n[*] Stopping...")
            self.stop()
        except Exception as e:
            print(f"\n[ERROR] Unexpected error: {str(e)}")
            import traceback
            traceback.print_exc()
            self.stop()
    
    def stop(self):
        self.is_running = False
        if self.tracker:
            # Send final activity data before stopping
            print("\n[*] Sending final activity data...")
            try:
                final_data = self.tracker.get_activity_data()
                self.send_activity_data(final_data)
            except Exception as e:
                print(f"[WARN] Failed to send final data: {str(e)}")
            
            self.tracker.stop()
            self.tracker.display_summary()
        print("\n[OK] Stopped!")

if __name__ == "__main__":
    agent = MonitoringAgent()
    agent.run()