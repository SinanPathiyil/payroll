import { useState, useEffect } from 'react';
import { Clock as ClockIcon, Calendar } from 'lucide-react';

export default function Clock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="clock-widget">
      <div className="clock-header">
        <ClockIcon className="clock-icon" />
        <h3 className="clock-title">Live Time</h3>
      </div>
      
      {/* Time Display */}
      <div className="clock-time">
        {time.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          second: '2-digit',
          hour12: true 
        })}
      </div>
      
      {/* Date Section - Card Style */}
      <div className="clock-date-section">
        <div className="clock-date-icon-wrapper">
          <Calendar className="clock-date-icon" />
        </div>
        <div className="clock-date-content">
          <p className="clock-date-label">Today's Date</p>
          <p className="clock-date-value">
            {time.toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
      </div>
    </div>
  );
}