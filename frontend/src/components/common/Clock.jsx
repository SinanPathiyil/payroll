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
      <div className="clock-time">
        {time.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          second: '2-digit',
          hour12: true 
        })}
      </div>
      <div className="clock-date">
        <Calendar className="w-3.5 h-3.5" />
        <span>
          {time.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </span>
      </div>
    </div>
  );
}