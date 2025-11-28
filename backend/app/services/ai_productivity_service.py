# backend/app/services/ai_productivity_service.py

from groq import Groq
from app.core.config import settings
from datetime import datetime
import json
import logging

logger = logging.getLogger(__name__)

class AIProductivityService:
    def __init__(self):
        self.client = Groq(api_key=settings.GROQ_API_KEY)
        self.model = "llama-3.3-70b-versatile"
    
    def format_raw_app_data_for_llm(self, raw_apps: list, employee_name: str, month: str) -> str:
        """Format raw application data into a structured prompt for LLM"""
        
         # ✅ ADD THIS
        print("\n" + "="*80)
        print(f"📊 FORMATTING DATA FOR LLM")
        print(f"Employee: {employee_name}")
        print(f"Month: {month}")
        print(f"Total Apps: {len(raw_apps)}")
        print("="*80 + "\n")
        
        total_seconds = sum(app["total_time_spent_seconds"] for app in raw_apps)
        total_hours = round(total_seconds / 3600, 2)
        total_minutes = round(total_seconds / 60, 2)
        
        total_mouse = sum(app["total_mouse_movements"] for app in raw_apps)
        total_keys = sum(app["total_key_presses"] for app in raw_apps)
        
        # Build detailed app list with all metrics
        app_details = []
        # for i, app in enumerate(raw_apps[:20], 1):  # Top 20 apps
        for i, app in enumerate(raw_apps, 1):  # ALL apps
            time_minutes = round(app["total_time_spent_seconds"] / 60, 2)
            percentage = round((app["total_time_spent_seconds"] / total_seconds * 100), 1) if total_seconds > 0 else 0
            
            app_details.append(
                f"{i}. {app['application']}: {time_minutes} min ({percentage}%) | "
                f"Mouse: {app['total_mouse_movements']:,} | Keys: {app['total_key_presses']:,}"
            )
        
        prompt = f"""Analyze this employee's computer activity for {month} and provide a productivity assessment.

**Employee:** {employee_name}
**Period:** {month}
**Total Time:** {total_hours} hours
**Mouse Movements:** {total_mouse:,}
**Keystrokes:** {total_keys:,}


**All Applications Used ({len(raw_apps)} total):**
{chr(10).join(app_details)}

**Task:**
1. Assign a productivity score (0-100) based on ALL {len(raw_apps)} applications:
   - Time on productive apps (IDEs, work tools) vs entertainment/social media
   - Activity intensity (mouse/keyboard usage)
   - Work tool variety

2. Write a 2-3 sentence summary covering:
   - Overall productivity level
   - Main activities observed
   - One key insight

**Response (JSON ONLY):**
{{
  "productivity_score": 85,
  "summary": "Highly productive month with 65% time on development tools. Strong focus on coding with minimal distractions. Consider taking more breaks between deep work sessions."
}}

Return ONLY the JSON, no extra text."""

        return prompt
    
    async def analyze_productivity(self, raw_apps: list, employee_name: str, month: str) -> dict:
        """Send raw app data to Groq AI and get productivity analysis"""
        
        if not raw_apps:
            return {
                "error": "No activity data available",
                "productivity_score": 0,
                "summary": "No data to analyze"
            }
        
        try:
            prompt = self.format_raw_app_data_for_llm(raw_apps, employee_name, month)
            
            # ✅ ADD THESE PRINT STATEMENTS
            print("\n" + "="*80)
            print("🤖 FULL PROMPT BEING SENT TO GROQ:")
            print("="*80)
            print(prompt)
            print("="*80 + "\n")
            
            logger.info(f"🤖 Sending raw app data to Groq AI for analysis...")
            
            completion = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert productivity analyst. Analyze employee data and return only valid JSON with a score and brief summary."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=1,
                max_tokens=500,
                response_format={"type": "json_object"}
            )
            
            response_text = completion.choices[0].message.content
            logger.info(f"✅ Received AI response")
            
            ai_analysis = json.loads(response_text)
            
            # Add metadata
            ai_analysis["analyzed_at"] = datetime.now().isoformat()
            ai_analysis["model_used"] = self.model
            ai_analysis["total_apps_analyzed"] = len(raw_apps)
            
            return ai_analysis
            
        except json.JSONDecodeError as e:
            logger.error(f"❌ Failed to parse AI response: {str(e)}")
            return {
                "error": "Failed to parse AI response",
                "productivity_score": 0,
                "summary": "Analysis failed due to invalid JSON response"
            }
        
        except Exception as e:
            logger.error(f"❌ Groq API error: {str(e)}")
            return {
                "error": str(e),
                "productivity_score": 0,
                "summary": "Analysis failed due to API error"
            }

ai_productivity_service = AIProductivityService()