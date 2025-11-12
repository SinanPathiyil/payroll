from datetime import datetime, date
from typing import List, Dict
from bson import ObjectId
import re

class ActivityTrackerService:
    def __init__(self, db):
        self.db = db
    
    def _extract_site_name(self, application: str, url: str) -> str:
        """
        Extracts a meaningful site name from browser applications.
        For non-browser apps, returns the application name.
        
        Args:
            application: e.g., "chrome.exe (google.com)" or "Code.exe"
            url: e.g., "Browser: facebook.com" or ""
            
        Returns:
            Cleaned name like "Chrome - google.com" or "VS Code"
        """
        # List of browser identifiers
        browsers = ["chrome", "edge", "firefox", "safari", "opera", "brave", "msedge"]
        
        # Check if it's a browser
        is_browser = any(browser in application.lower() for browser in browsers)
        
        if is_browser:
            # Try to extract domain from the application field first
            # e.g., "chrome.exe (google.com)" -> "google.com"
            match = re.search(r'$([^)]+)$', application)
            if match:
                site = match.group(1)
                # Clean up "Browser: " prefix if present
                site = site.replace("Browser: ", "").strip()
                
                # Get browser name
                browser_name = "Browser"
                if "chrome" in application.lower():
                    browser_name = "Chrome"
                elif "edge" in application.lower() or "msedge" in application.lower():
                    browser_name = "Edge"
                elif "firefox" in application.lower():
                    browser_name = "Firefox"
                elif "safari" in application.lower():
                    browser_name = "Safari"
                
                return f"{browser_name} - {site}"
            
            # If no match in application, try URL field
            if url and url.strip():
                site = url.replace("Browser: ", "").strip()
                return f"Browser - {site}"
            
            # Fallback
            return "Browser - Unknown Site"
        
        # For non-browser apps, clean up the application name
        # e.g., "Code.exe" -> "VS Code"
        app_name = application.split(".exe")[0].strip()
        
        # Friendly names mapping
        friendly_names = {
            "Code": "VS Code",
            "WINWORD": "Microsoft Word",
            "EXCEL": "Microsoft Excel",
            "POWERPNT": "Microsoft PowerPoint",
            "Spotify": "Spotify",
            "slack": "Slack",
            "Teams": "Microsoft Teams",
            "WhatsApp": "WhatsApp",
            "Telegram": "Telegram"
        }
        
        return friendly_names.get(app_name, app_name)
    
    async def get_app_activity_breakdown(
        self, 
        employee_email: str, 
        start_date: date, 
        end_date: date
    ) -> List[Dict]:
        """
        Aggregates per-application activity breakdown for an employee
        within a specified date range. Groups browser activities by site.
        
        Args:
            employee_email: The employee's email address
            start_date: Start date for filtering
            end_date: End date for filtering
            
        Returns:
            List of dictionaries with app_name, total_duration_minutes, and percentage
        """
        
        # Convert dates to datetime for MongoDB query
        start_datetime = datetime.combine(start_date, datetime.min.time())
        end_datetime = datetime.combine(end_date, datetime.max.time())
        
        # Fetch all matching activities
        cursor = self.db.activities.find({
            "employee_email": employee_email,
            "recorded_at": {
                "$gte": start_datetime,
                "$lte": end_datetime
            }
        })
        
        activities = await cursor.to_list(length=None)
        
        if not activities:
            return []
        
        # Manual aggregation with site grouping
        app_time_map = {}
        
        for activity in activities:
            applications = activity.get("applications", [])
            
            for app in applications:
                application_name = app.get("application", "Unknown")
                url = app.get("url", "")
                time_spent = app.get("time_spent_seconds", 0)
                
                # Extract meaningful name (with site for browsers)
                display_name = self._extract_site_name(application_name, url)
                
                # Accumulate time
                if display_name in app_time_map:
                    app_time_map[display_name] += time_spent
                else:
                    app_time_map[display_name] = time_spent
        
        if not app_time_map:
            return []
        
        # Calculate total duration for percentage
        total_duration_seconds = sum(app_time_map.values())
        
        # Format response
        breakdown_list = []
        for app_name, duration_seconds in app_time_map.items():
            duration_minutes = round(duration_seconds / 60, 2)
            percentage = round((duration_seconds / total_duration_seconds) * 100, 2) if total_duration_seconds > 0 else 0
            
            breakdown_list.append({
                "app_name": app_name,
                "total_duration_minutes": duration_minutes,
                "total_duration_seconds": duration_seconds,
                "percentage": percentage
            })
        
        # Sort by duration descending
        breakdown_list.sort(key=lambda x: x["total_duration_seconds"], reverse=True)
        
        return breakdown_list