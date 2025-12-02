import { useState, useRef, useEffect } from "react";
import { updateTask } from "../../services/api";
import {
  CheckCircle,
  Clock,
  AlertCircle,
  Play,
  Calendar,
  CalendarCheck,
  User,
} from "lucide-react";
import { formatDateTime } from "../../utils/helpers";

export default function TaskList({ tasks, onTaskUpdate, highlightTaskId }) {
  const [updatingTask, setUpdatingTask] = useState(null);
  const taskRefs = useRef({});

  useEffect(() => {
    if (highlightTaskId && taskRefs.current[highlightTaskId]) {
      taskRefs.current[highlightTaskId].scrollIntoView({
        behavior: "smooth",
        block: "center",
      });

      taskRefs.current[highlightTaskId].classList.add("highlight-task");

      setTimeout(() => {
        taskRefs.current[highlightTaskId]?.classList.remove("highlight-task");
      }, 3000);
    }
  }, [highlightTaskId, tasks]);

  const handleStatusChange = async (taskId, newStatus) => {
    setUpdatingTask(taskId);
    try {
      await updateTask(taskId, { status: newStatus });
      onTaskUpdate();
    } catch (error) {
      console.error("Failed to update task:", error);
    } finally {
      setUpdatingTask(null);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-5 h-5" />;
      case "in_progress":
        return <Clock className="w-5 h-5" />;
      default:
        return <AlertCircle className="w-5 h-5" />;
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "completed":
        return "task-status-completed";
      case "in_progress":
        return "task-status-progress";
      default:
        return "task-status-pending";
    }
  };

  return (
    <div className="task-list-card">
      <div className="task-list-header">
        <h2 className="task-list-title">My Tasks</h2>
      </div>
      <div className="task-list-body">
        {tasks.length === 0 ? (
          <div className="task-list-empty">
            <AlertCircle className="task-list-empty-icon" />
            <p className="task-list-empty-text">No tasks assigned yet</p>
          </div>
        ) : (
          <div className="task-list-content">
            {tasks.map((task) => (
              <div
                key={task.id}
                ref={(el) => (taskRefs.current[task.id] = el)}
                className={`task-item ${getStatusClass(task.status)}`}
              >
                <div className="task-item-content">
                  <div className="task-item-main">
                    <div className="task-item-header">
                      <div className="task-item-icon">
                        {getStatusIcon(task.status)}
                      </div>
                      <h3 className="task-item-title">{task.title}</h3>
                    </div>
                    <p className="task-item-description">{task.description}</p>
                    <div className="task-item-meta">
                      <span className="task-meta-item">
                        <Calendar className="w-4 h-4" />
                        <span>Created: {formatDateTime(task.created_at)}</span>
                      </span>
                      {task.due_date && (
                        <span className="task-meta-item">
                          <Clock className="w-4 h-4" />
                          <span>Due: {formatDateTime(task.due_date)}</span>
                        </span>
                      )}
                      {task.completed_at && (
                        <span className="task-meta-item">
                          <CalendarCheck className="w-4 h-4" />
                          <span>
                            Completed: {formatDateTime(task.completed_at)}
                          </span>
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="task-item-badge">
                    <span
                      className={`status-chip ${
                        task.status === "completed"
                          ? "success"
                          : task.status === "in_progress"
                            ? "info"
                            : "warning"
                      }`}
                    >
                      {task.status.replace("_", " ")}
                    </span>
                  </div>
                </div>

                {task.status !== "completed" && (
                  <div className="task-item-actions">
                    {task.status === "pending" && (
                      <button
                        onClick={() =>
                          handleStatusChange(task.id, "in_progress")
                        }
                        disabled={updatingTask === task.id}
                        className="btn btn-primary btn-sm"
                      >
                        <Play className="w-4 h-4" />
                        Start Task
                      </button>
                    )}
                    {task.status === "in_progress" && (
                      <button
                        onClick={() => handleStatusChange(task.id, "completed")}
                        disabled={updatingTask === task.id}
                        className="btn btn-success btn-sm"
                      >
                        <CheckCircle className="w-4 h-4" />
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
