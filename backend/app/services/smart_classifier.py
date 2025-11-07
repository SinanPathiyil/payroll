# backend/app/services/smart_classifier.py

import os
from typing import Dict, Optional
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

class SmartProductivityClassifier:
    """
    Smart classifier for productivity tracking
    Uses rule-based classification (AI optional)
    """
    
    def __init__(self):
        self.categories = {
            'development': {
                'apps': ['code', 'pycharm', 'visual studio', 'sublime', 'atom', 
                        'vim', 'eclipse', 'intellij', 'webstorm'],
                'keywords': ['github', 'gitlab', 'stackoverflow', 'localhost'],
                'weight': 1.0
            },
            'communication': {
                'apps': ['slack', 'teams', 'zoom', 'discord', 'skype'],
                'keywords': ['meeting', 'email'],
                'weight': 0.7
            },
            'documentation': {
                'apps': ['word', 'notion', 'docs', 'onenote'],
                'keywords': ['documentation', 'notes'],
                'weight': 0.85
            },
            'research': {
                'apps': ['chrome', 'firefox', 'safari', 'edge'],
                'keywords': ['stackoverflow', 'github', 'documentation'],
                'weight': 0.8
            },
            'background_music': {
                'apps': ['spotify', 'apple music'],
                'keywords': ['music', 'playlist', 'lofi'],
                'weight': 0.75
            },
            'entertainment': {
                'apps': ['netflix', 'youtube'],
                'keywords': ['facebook', 'instagram', 'twitter'],
                'weight': 0.1
            },
            'system': {
                'apps': ['explorer', 'finder', 'terminal'],
                'keywords': ['settings'],
                'weight': 0.6
            }
        }
    
    async def classify(
        self,
        app_name: str,
        window_title: str = "",
        url: Optional[str] = None,
        duration: int = 0,
        keyboard_events: int = 0,
        mouse_events: int = 0,
        idle_time: int = 0,
        db = None
    ) -> Dict:
        """
        Classify activity using rule-based approach
        """
        app_lower = app_name.lower()
        title_lower = window_title.lower()
        url_lower = (url or '').lower()
        
        # Special handling for YouTube
        if 'youtube' in app_lower or 'youtube.com' in url_lower:
            return self._classify_youtube(title_lower, url_lower)
        
        # Check each category
        for category, config in self.categories.items():
            # Check app name
            if any(app in app_lower for app in config['apps']):
                return {
                    'category': category,
                    'subcategory': 'general',
                    'productivity_weight': config['weight'],
                    'confidence': 0.9,
                    'method': 'rule_based',
                    'reasoning': f'Matched {category} app pattern'
                }
            
            # Check keywords
            if any(kw in title_lower or kw in url_lower for kw in config['keywords']):
                return {
                    'category': category,
                    'subcategory': 'general',
                    'productivity_weight': config['weight'],
                    'confidence': 0.75,
                    'method': 'rule_based',
                    'reasoning': f'Matched {category} keyword'
                }
        
        # Default: unknown
        return {
            'category': 'other',
            'subcategory': 'unknown',
            'productivity_weight': 0.5,
            'confidence': 0.5,
            'method': 'rule_based',
            'reasoning': 'No pattern matched'
        }
    
    def _classify_youtube(self, title: str, url: str) -> Dict:
        """Special YouTube classification"""
        music_keywords = ['music', 'song', 'playlist', 'lofi', 'mix']
        
        if any(kw in title or kw in url for kw in music_keywords):
            return {
                'category': 'background_music',
                'subcategory': 'youtube_music',
                'productivity_weight': 0.75,
                'confidence': 0.85,
                'method': 'rule_based',
                'reasoning': 'YouTube music detected'
            }
        
        learning_keywords = ['tutorial', 'course', 'learn', 'how to', 'programming']
        
        if any(kw in title for kw in learning_keywords):
            return {
                'category': 'learning',
                'subcategory': 'youtube_tutorial',
                'productivity_weight': 0.9,
                'confidence': 0.8,
                'method': 'rule_based',
                'reasoning': 'YouTube educational content'
            }
        
        return {
            'category': 'entertainment',
            'subcategory': 'youtube_video',
            'productivity_weight': 0.2,
            'confidence': 0.6,
            'method': 'rule_based',
            'reasoning': 'YouTube entertainment'
        }
    
    def calculate_productivity_score(
        self,
        classification: Dict,
        duration: int,
        idle_time: int,
        keyboard_events: int,
        mouse_events: int
    ) -> float:
        """Calculate productivity score"""
        if duration == 0:
            return 0.0
        
        active_time = duration - idle_time
        
        # Time utilization (0-30 points)
        time_score = (active_time / duration) * 30 if duration > 0 else 0
        
        # Category weight (0-40 points)
        category_score = classification['productivity_weight'] * 40
        
        # Activity intensity (0-30 points)
        events_per_minute = (keyboard_events + mouse_events) / (duration / 60) if duration > 0 else 0
        intensity_score = min(events_per_minute / 10, 1.0) * 30
        
        total_score = time_score + category_score + intensity_score
        
        return round(min(total_score, 100), 2)
    
    async def train_models(self, db, min_samples: int = 100):
        """Placeholder for ML training (not implemented yet)"""
        logger.info("ML training not implemented yet. Using rule-based classification only.")
        return False

# Global instance
smart_classifier = SmartProductivityClassifier()