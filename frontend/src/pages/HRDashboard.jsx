import { useState, useEffect, useContext, useRef } from "react";
import { AuthContext } from "../context/AuthContext";
import Navbar from "../components/common/Navbar";
import Clock from "../components/common/Clock";
import CreateUserModal from "../components/hr/CreateUserModal";
import CreateTaskModal from "../components/hr/CreateTaskModal";
import EmployeeStatsModal from "../components/hr/EmployeeStatsModal";
import HRMessageBoard from "../components/hr/HRMessageBoard";
import { getEmployees, getAllTasks, getMyMessages } from "../services/api";
import {
  Users,
  UserPlus,
  Clock as ClockIcon,
  CheckCircle,
  ListTodo,
  Plus,
  MessageSquare,
} from "lucide-react";
import { formatDateTime } from "../utils/helpers";

export default function HRDashboard() {
  const [messages, setMessages] = useState([]);
  const [highlightTaskId, setHighlightTaskId] = useState(null);
  const { user } = useContext(AuthContext);
  const [employees, setEmployees] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const taskRefs = useRef({});

  useEffect(() => {
    loadData();
  }, []);

  // Scroll to and highlight task when highlightTaskId changes
  useEffect(() => {
    console.log("🔍 HR - highlightTaskId changed:", highlightTaskId);
    console.log("🔍 Available task refs:", Object.keys(taskRefs.current));

    if (highlightTaskId && taskRefs.current[highlightTaskId]) {
      console.log("✅ Found task ref, scrolling to:", highlightTaskId);

      // Scroll to the task
      taskRefs.current[highlightTaskId].scrollIntoView({
        behavior: "smooth",
        block: "center",
      });

      // Add highlight animation
      taskRefs.current[highlightTaskId].classList.add("highlight-task");

      // Remove highlight after animation
      setTimeout(() => {
        taskRefs.current[highlightTaskId]?.classList.remove("highlight-task");
      }, 3000);
    } else {
      console.log("❌ Task ref not found for:", highlightTaskId);
    }
  }, [highlightTaskId, tasks]);

  const loadData = async () => {
    try {
      const [employeesRes, tasksRes, messagesRes] = await Promise.all([
        getEmployees(),
        getAllTasks(),
        getMyMessages(), // <<< ADD THIS
      ]);
      setEmployees(employeesRes.data);
      setTasks(tasksRes.data);
      setMessages(messagesRes.data || []); // <<< ADD THIS
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    totalEmployees: employees.length,
    activeToday: employees.filter((e) => e.today_status === "active").length,
    totalTasks: tasks.length,
    completedTasks: tasks.filter((t) => t.status === "completed").length,
    unreadMessages: messages.filter((m) => !m.is_read).length,
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-orange-100 text-orange-800";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">HR Dashboard</h1>
          <p className="text-gray-600">Welcome back, {user?.full_name}</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Employees</p>
                <p className="text-3xl font-bold text-gray-800">
                  {stats.totalEmployees}
                </p>
              </div>
              <Users className="w-12 h-12 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Active Today</p>
                <p className="text-3xl font-bold text-green-600">
                  {stats.activeToday}
                </p>
              </div>
              <CheckCircle className="w-12 h-12 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Tasks</p>
                <p className="text-3xl font-bold text-gray-800">
                  {stats.totalTasks}
                </p>
              </div>
              <ClockIcon className="w-12 h-12 text-orange-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Completed Tasks</p>
                <p className="text-3xl font-bold text-green-600">
                  {stats.completedTasks}
                </p>
              </div>
              <CheckCircle className="w-12 h-12 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">New Notifications</p>
                <p className="text-3xl font-bold text-purple-600">
                  {stats.unreadMessages}
                </p>
              </div>
              <MessageSquare className="w-12 h-12 text-purple-500" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Employee List */}
          <div className="lg:col-span-2 space-y-6">
            {/* Employees Table */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b flex justify-between items-center">
                <h2 className="text-xl font-semibold">Employees</h2>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  Add Employee
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Hours Today
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {employees.map((employee) => (
                      <tr key={employee.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">
                            {employee.full_name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {employee.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${
                              employee.today_status === "active"
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {employee.today_status === "active"
                              ? "Active"
                              : "Offline"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {employee.today_hours?.toFixed(2) || "0.00"} hrs
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button
                            onClick={() => setSelectedEmployee(employee)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            View Stats
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Tasks List */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b flex justify-between items-center">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <ListTodo className="w-5 h-5" />
                  All Tasks
                </h2>
                <button
                  onClick={() => setShowTaskModal(true)}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Assign Task
                </button>
              </div>
              <div className="p-6">
                {tasks.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <ListTodo className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p>No tasks assigned yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {tasks.map((task) => (
                      <div
                        key={task.id}
                        ref={(el) => (taskRefs.current[task.id] = el)}
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-gray-900">
                                {task.title}
                              </h3>
                              <span
                                className={`px-2 py-1 text-xs rounded-full ${getStatusColor(task.status)}`}
                              >
                                {task.status.replace("_", " ")}
                              </span>
                            </div>
                            <p className="text-gray-600 text-sm mb-2">
                              {task.description}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span>👤 {task.employee_name}</span>
                              <span>📅 {formatDateTime(task.created_at)}</span>
                              {task.due_date && (
                                <span>
                                  ⏰ Due: {formatDateTime(task.due_date)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Clock Widget */}
            <Clock />

            {/* Messages/Notifications */}
            <HRMessageBoard
              messages={messages}
              onMessageRead={loadData}
              onTaskMessageClick={setHighlightTaskId}
            />
          </div>
        </div>
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateUserModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadData();
          }}
        />
      )}

      {showTaskModal && (
        <CreateTaskModal
          employees={employees}
          onClose={() => setShowTaskModal(false)}
          onSuccess={() => {
            setShowTaskModal(false);
            loadData();
          }}
        />
      )}

      {selectedEmployee && (
        <EmployeeStatsModal
          employee={selectedEmployee}
          onClose={() => setSelectedEmployee(null)}
        />
      )}
    </div>
  );
}
