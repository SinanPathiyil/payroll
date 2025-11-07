import { useEffect, useRef, useState } from 'react';
import { logActivity } from '../services/api';

export const useActivityTracker = (isEnabled = false) => {
  const [stats, setStats] = useState({
    mouseEvents: 0,
    keyboardEvents: 0,
    activeTime: 0,
    idleTime: 0,
  });

  const statsRef = useRef(stats);
  const lastActivityRef = useRef(Date.now());
  const sessionIdRef = useRef(generateSessionId());
  const intervalRef = useRef(null);
  const sendIntervalRef = useRef(null);
  const idleThreshold = 60000; // 1 minute of inactivity = idle

  useEffect(() => {
    statsRef.current = stats;
  }, [stats]);

  useEffect(() => {
    if (!isEnabled) {
      // Clear intervals if tracking is disabled
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (sendIntervalRef.current) {
        clearInterval(sendIntervalRef.current);
      }
      return;
    }

    console.log('Activity tracking started');

    const handleMouseMove = () => {
      updateActivity();
      setStats(prev => ({ ...prev, mouseEvents: prev.mouseEvents + 1 }));
    };

    const handleKeyPress = () => {
      updateActivity();
      setStats(prev => ({ ...prev, keyboardEvents: prev.keyboardEvents + 1 }));
    };

    const handleClick = () => {
      updateActivity();
      setStats(prev => ({ ...prev, mouseEvents: prev.mouseEvents + 1 }));
    };

    const handleScroll = () => {
      updateActivity();
      setStats(prev => ({ ...prev, mouseEvents: prev.mouseEvents + 1 }));
    };

    const updateActivity = () => {
      lastActivityRef.current = Date.now();
    };

    // Track active/idle time every 5 seconds
    const trackTime = () => {
      const now = Date.now();
      const timeSinceLastActivity = now - lastActivityRef.current;

      if (timeSinceLastActivity < idleThreshold) {
        // Active
        setStats(prev => ({ ...prev, activeTime: prev.activeTime + 5 }));
      } else {
        // Idle
        setStats(prev => ({ ...prev, idleTime: prev.idleTime + 5 }));
      }
    };

    // Send activity data to server every 5 minutes
    const sendActivityData = async () => {
      const currentStats = statsRef.current;
      
      // Only send if there's actual activity
      if (currentStats.mouseEvents > 0 || currentStats.keyboardEvents > 0) {
        try {
          await logActivity({
            session_id: sessionIdRef.current,
            mouse_events: currentStats.mouseEvents,
            keyboard_events: currentStats.keyboardEvents,
            active_time: currentStats.activeTime,
            idle_time: currentStats.idleTime,
          });

          console.log('Activity logged:', currentStats);

          // Reset stats after sending
          setStats({
            mouseEvents: 0,
            keyboardEvents: 0,
            activeTime: 0,
            idleTime: 0,
          });

          // Generate new session ID for next batch
          sessionIdRef.current = generateSessionId();
        } catch (error) {
          console.error('Failed to log activity:', error);
        }
      }
    };

    // Add event listeners
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('keypress', handleKeyPress);
    window.addEventListener('keydown', handleKeyPress);
    window.addEventListener('click', handleClick);
    window.addEventListener('scroll', handleScroll);

    // Track time every 5 seconds
    intervalRef.current = setInterval(trackTime, 5000);

    // Send data every 5 minutes (300000ms)
    sendIntervalRef.current = setInterval(sendActivityData, 300000);

    // Cleanup function
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('keypress', handleKeyPress);
      window.removeEventListener('keydown', handleKeyPress);
      window.removeEventListener('click', handleClick);
      window.removeEventListener('scroll', handleScroll);
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      
      if (sendIntervalRef.current) {
        clearInterval(sendIntervalRef.current);
      }

      // Send final activity data on cleanup
      sendActivityData();
      
      console.log('Activity tracking stopped');
    };
  }, [isEnabled]);

  return stats;
};

function generateSessionId() {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}