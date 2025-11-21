import requests
import time
import os
import signal
import sys
import atexit  # ADD THIS LINE
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
        self.session_number = None
        self.cleanup_completed = False
    
        # ===== ADD THIS: Cleanup any leftover signal files =====
        signal_file = os.path.join(os.path.dirname(__file__), '.clockout_signal')
        if os.path.exists(signal_file):
            try:
                os.remove(signal_file)
                print("[CLEANUP] Removed leftover clock-out signal file")
            except Exception as e:
                print(f"[WARN] Could not remove signal file: {e}")
        # ========================================================
    
        # Setup signal handlers
        signal.signal(signal.SIGTERM, self._signal_handler)
        signal.signal(signal.SIGINT, self._signal_handler)
        atexit.register(self._cleanup_handler)
    
        print("=" * 80)
        print("[*] EMPLOYEE MONITORING AGENT - ENHANCED")
        print("=" * 80)
        
        
    def _signal_handler(self, signum, frame):
        """Handle shutdown signals gracefully (includes clock-out)"""
        print(f"\n[*] Received signal {signum} (Clock-out detected), shutting down gracefully...")
        self._handle_clock_out()
        self.is_running = False
        sys.exit(0)
    
    def _cleanup_handler(self):
        """Atexit cleanup handler - runs even if signal handler fails"""
        if not self.cleanup_completed:
            print("\n[CLEANUP] Final cleanup via atexit handler...")
            self._handle_clock_out()
    
    def _handle_clock_out(self):
        """Handle clock-out event - update lifetime totals and reset session"""
        if not self.tracker or self.cleanup_completed:
            return
        
        self.cleanup_completed = True
        
        try:
            print("[CLOCK-OUT] Saving final session data...")
        
            # Get final activity data (includes partial interval)
            final_data = self.tracker.get_activity_data()
        
            # Send final activity data with session completion marker
            final_data["session_completed"] = True
            final_data["session_number"] = self.session_number

            success = self.send_activity_data(final_data)
            if success:
                print("[OK] Final session data saved")
            else:
                print("[WARN] Failed to save final session data")
            
            # Reset session data for next time
            self.tracker.reset_session_data()
        
        except Exception as e:
            print(f"[ERROR] Clock-out handling error: {str(e)}")
    
        # ... rest of the methods stay the same ...
    
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
    
    def get_session_number(self):
        """Get session number by counting attendance records for this employee"""
        try:
            headers = {
                "Authorization": f"Bearer {self.token}",
                "Content-Type": "application/json"
            }
            
            # Clean API URL
            api_url = self.config.API_URL.rstrip('/')
            if not api_url.endswith('/api'):
                endpoint = f"{api_url}/api/employee/session-count"
            else:
                endpoint = f"{api_url}/employee/session-count"
            
            print(f"[*] Getting session number from: {endpoint}")
            
            response = requests.get(endpoint, headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                session_count = data.get('session_count', 1)
                print(f"[OK] Current session number: {session_count}")
                return session_count
            else:
                print(f"[WARN] Could not get session number: {response.status_code}, defaulting to 1")
                return 1
                
        except Exception as e:
            print(f"[WARN] Session number error: {str(e)}, defaulting to 1")
            return 1

    def send_activity_data(self, activity_data):
        try:
            headers = {
                "Authorization": f"Bearer {self.token}",
                "Content-Type": "application/json"
            }
            
            activity_data["employee_email"] = self.employee_email
            
            # Add session number instead of session_time_seconds
            activity_data["session_number"] = self.session_number
            
            # Remove session_time_seconds if present
            if "session_time_seconds" in activity_data:
                del activity_data["session_time_seconds"]
            
            # Ensure API URL doesn't have double /api
            api_url = self.config.API_URL.rstrip('/')
            if not api_url.endswith('/api'):
                endpoint = f"{api_url}/api/employee/activity"
            else:
                endpoint = f"{api_url}/employee/activity"
            
            print(f"[*] Sending to: {endpoint}")
            print(f"[*] Session: {self.session_number}")
            
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
        
        print(f"\n{status} | Session #{self.session_number} | Currently: {current}")
        print("-" * 80)
        
        # Show session vs lifetime data
        session_mouse = activity_data.get("mouse_events", 0)
        session_keys = activity_data.get("keyboard_events", 0)
        lifetime_mouse = activity_data.get("total_mouse_movements", 0)
        lifetime_keys = activity_data.get("total_key_presses", 0)
        
        print(f"[SESSION] Mouse: {session_mouse:,} | Keys: {session_keys:,}")
        print(f"[LIFETIME] Mouse: {lifetime_mouse:,} | Keys: {lifetime_keys:,}")
        
        apps = activity_data.get("applications", [])[:5]
        if apps:
            print("[*] Top 5 Applications (This Interval):")
            for i, app in enumerate(apps, 1):
                mins = app['time_spent_seconds'] // 60
                url = f" - {app['url']}" if app['url'] else ""
                print(f"   {i}. {app['application']}{url}")
                print(f"      Time: {mins}m | Mouse: {app['mouse_movements']} | Keys: {app['key_presses']}")
        print("-" * 80)
    
    def check_clock_status(self):
        """Check if employee is still clocked in"""
        try:
            headers = {
                "Authorization": f"Bearer {self.token}",
                "Content-Type": "application/json"
            }
            
            api_url = self.config.API_URL.rstrip('/')
            if not api_url.endswith('/api'):
                endpoint = f"{api_url}/api/employee/status"
            else:
                endpoint = f"{api_url}/employee/status"
            
            response = requests.get(endpoint, headers=headers, timeout=5)
            
            if response.status_code == 200:
                data = response.json()
                return data.get("is_clocked_in", False)
            else:
                print(f"[WARN] Status check failed: {response.status_code}")
                return True  # Assume still clocked in on error
                
        except Exception as e:
            print(f"[WARN] Status check error: {str(e)}")
            return True  # Assume still clocked in on error

    def run(self):
        if not self.authenticate():
            print("\n[ERROR] Cannot start monitoring - authentication failed")
            return
    
        # Get session number
        self.session_number = self.get_session_number()
        
        # Fetch lifetime totals before starting tracker
        lifetime_totals = self.get_lifetime_totals()

        # Initialize tracker with lifetime totals
        self.tracker = ActivityTracker(self.config, lifetime_totals, self.employee_email)

        print(f"\n[*] Monitoring started!")
        print(f"[*] Employee: {self.employee_email}")
        print(f"[*] Session Number: {self.session_number}")
        print(f"[*] Updates every {self.config.ACTIVITY_CHECK_INTERVAL} seconds")
        print(f"[*] Idle threshold: {self.config.IDLE_THRESHOLD} seconds")
        print("\nPress Ctrl+C to stop\n")   

        self.is_running = True
        last_status_check = time.time()

        try:
            while self.is_running:
                # Wait for interval, but check every second for clock-out signal
                print(f"\n[*] Collecting activity data for {self.config.ACTIVITY_CHECK_INTERVAL} seconds...")
    
                # Check every second instead of sleeping for full interval
                for i in range(self.config.ACTIVITY_CHECK_INTERVAL):
                    # Check if clock-out signal file exists
                    signal_file = os.path.join(os.path.dirname(__file__), '.clockout_signal')
                    if os.path.exists(signal_file):
                        print("\n[CLOCK-OUT SIGNAL] Detected! Sending data immediately...")
                        os.remove(signal_file)

                        # Mark cleanup as completed BEFORE sending (prevents double-send)
                        self.cleanup_completed = True

                        # Send data immediately
                        activity_data = self.tracker.get_activity_data()
                        activity_data["session_completed"] = True
                        activity_data["session_number"] = self.session_number
                        self.send_activity_data(activity_data)

                        # Reset session data for next time
                        self.tracker.reset_session_data()
                        print("[OK] Clock-out data sent, exiting...")

                        # Stop tracker and exit
                        if self.tracker:
                            self.tracker.stop()
                        return  # Exit cleanly
        
                    time.sleep(1)  # Sleep 1 second at a time
            
                # ✅ SEND DATA AFTER INTERVAL COMPLETES
                print(f"[*] Interval complete, sending activity data...")
                activity_data = self.tracker.get_activity_data()
                activity_data["session_completed"] = False  # Not final
                activity_data["session_number"] = self.session_number
            
                success = self.send_activity_data(activity_data)
            
                if success:
                    # ✅ Reset interval data (but keep session totals)
                    self.tracker.reset_app_interval_data()
                    print(f"[OK] Data sent, continuing monitoring...")
                else:
                    print(f"[WARN] Failed to send data, will retry next interval")
            
                # Check clock status every 5 intervals
                current_time = time.time()
                if current_time - last_status_check > (self.config.ACTIVITY_CHECK_INTERVAL * 5):
                    if not self.check_clock_status():
                        print("\n[*] Clock-out detected via status check")
                        break
                    last_status_check = current_time
    
        except KeyboardInterrupt:
            print("\n\n[*] Manual stop detected...")
            self.stop()
        except Exception as e:
            print(f"\n[ERROR] Unexpected error: {str(e)}")
            import traceback
            traceback.print_exc()
            self.stop()
    
    def stop(self):
        self.is_running = False
        if self.tracker:
            self._handle_clock_out()
            self.tracker.stop()
            self.tracker.display_summary()
        print("\n[OK] Agent stopped!")

    def get_lifetime_totals(self):
        """Fetch lifetime cumulative totals for this user (only for TODAY)"""
        try:
            headers = {
                "Authorization": f"Bearer {self.token}",
                "Content-Type": "application/json"
            }
    
            api_url = self.config.API_URL.rstrip('/')
            if not api_url.endswith('/api'):
                endpoint = f"{api_url}/api/employee/last-lifetime-totals"
            else:
                endpoint = f"{api_url}/employee/last-lifetime-totals"
    
            print(f"[*] Fetching lifetime totals for TODAY...")
    
            response = requests.get(endpoint, headers=headers, timeout=10)
    
            if response.status_code == 200:
                data = response.json()
            
                # ✅ CHECK IF DATA IS FROM TODAY
                last_session_date = data.get('last_session_date')
                today = datetime.now().strftime("%Y-%m-%d")
            
                if data.get('found') and last_session_date == today:
                    # Same day - use previous totals
                    print(f"[OK] Found lifetime totals from today ({today}): Mouse={data.get('lifetime_mouse', 0)}, Active={data.get('lifetime_active_seconds', 0)}s")
                    return data
                else:
                    # Different day or no data - start fresh
                    if last_session_date:
                        print(f"[*] New day! Previous session was on {last_session_date}, starting fresh for {today}")
                    else:
                        print(f"[*] No previous activity found, starting fresh")
                    return None
            else:
                print(f"[WARN] Could not fetch lifetime totals: {response.status_code}")
                return None
        
        except Exception as e:
            print(f"[WARN] Error fetching lifetime totals: {str(e)}")
            return None

if __name__ == "__main__":
    agent = MonitoringAgent()
    agent.run()