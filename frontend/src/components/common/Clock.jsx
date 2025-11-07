import { useState, useEffect } from 'react';
import { Clock as ClockIcon } from 'lucide-react';

export default function Clock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center gap-3 mb-4">
        <ClockIcon className="w-6 h-6 text-blue-600" />
        <h3 className="text-lg font-semibold">Company Time</h3>
      </div>
      <div className="text-4xl font-bold text-gray-800">
        {time.toLocaleTimeString()}
      </div>
      <div className="text-sm text-gray-500 mt-2">
        {time.toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })}
      </div>
    </div>
  );
}