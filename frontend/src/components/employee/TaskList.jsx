import { useState, useRef, useEffect } from 'react';
import { updateTask } from '../../services/api';
import { CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { formatDateTime, getStatusColor } from '../../utils/helpers';

export default function TaskList({ tasks, onTaskUpdate, highlightTaskId }) {
  const [updatingTask, setUpdatingTask] = useState(null);
  const taskRefs = useRef({});

  // Scroll to and highlight task when highlightTaskId changes
  useEffect(() => {
    console.log('🔍 TaskList - highlightTaskId changed:', highlightTaskId);
    console.log('🔍 Available task refs:', Object.keys(taskRefs.current));
    console.log('🔍 All tasks:', tasks.map(t => t.id));
    
    if (highlightTaskId && taskRefs.current[highlightTaskId]) {
      console.log('✅ Found task ref, scrolling to:', highlightTaskId);
      
      // Scroll to the task
      taskRefs.current[highlightTaskId].scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });

      // Add highlight animation
      taskRefs.current[highlightTaskId].classList.add('highlight-task');
      
      // Remove highlight after animation
      setTimeout(() => {
        taskRefs.current[highlightTaskId]?.classList.remove('highlight-task');
      }, 3000);
    } else {
      console.log('❌ Task ref not found for:', highlightTaskId);
    }
  }, [highlightTaskId, tasks]);

  const handleStatusChange = async (taskId, newStatus) => {
    setUpdatingTask(taskId);
    try {
      await updateTask(taskId, { status: newStatus });
      onTaskUpdate();
    } catch (error) {
      console.error('Failed to update task:', error);
    } finally {
      setUpdatingTask(null);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'in_progress':
        return <Clock className="w-5 h-5 text-blue-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-orange-600" />;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b">
        <h2 className="text-xl font-semibold">My Tasks</h2>
      </div>
      <div className="p-6">
        {tasks.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p>No tasks assigned yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {tasks.map((task) => (
              <div
                key={task.id}
                ref={(el) => (taskRefs.current[task.id] = el)}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition task-item"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {getStatusIcon(task.status)}
                      <h3 className="font-semibold text-gray-900">{task.title}</h3>
                    </div>
                    <p className="text-gray-600 text-sm mb-3">{task.description}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>Created: {formatDateTime(task.created_at)}</span>
                      {task.due_date && (
                        <span>Due: {formatDateTime(task.due_date)}</span>
                      )}
                      {task.completed_at && (
                        <span>Completed: {formatDateTime(task.completed_at)}</span>
                      )}
                    </div>
                  </div>
                  <div className="ml-4">
                    <span className={`px-3 py-1 text-xs rounded-full ${getStatusColor(task.status)}`}>
                      {task.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                {task.status !== 'completed' && (
                  <div className="mt-4 flex gap-2">
                    {task.status === 'pending' && (
                      <button
                        onClick={() => handleStatusChange(task.id, 'in_progress')}
                        disabled={updatingTask === task.id}
                        className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
                      >
                        Start Task
                      </button>
                    )}
                    {task.status === 'in_progress' && (
                      <button
                        onClick={() => handleStatusChange(task.id, 'completed')}
                        disabled={updatingTask === task.id}
                        className="px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50"
                      >
                        Mark Complete
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}