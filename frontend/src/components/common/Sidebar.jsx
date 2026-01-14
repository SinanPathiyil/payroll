import { useContext, useState } from "react";
import { NavLink, Link, useLocation } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  DollarSign,
  Calendar,
  FileText,
  Shield,
  CheckSquare,
  BarChart3,
  Settings,
  UserCog,
  FolderKanban,
  MessageSquare,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Menu,
  X,
  Clock,
  History,
} from "lucide-react";

export default function Sidebar() {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [openSubmenus, setOpenSubmenus] = useState({});

  // Toggle submenu
  const toggleSubmenu = (label) => {
    setOpenSubmenus((prev) => ({
      ...prev,
      [label]: !prev[label],
    }));
  };

  // Check if any submenu item is active
  const isSubmenuActive = (subItems) => {
    return subItems.some(
      (subItem) =>
        location.pathname === subItem.path ||
        location.pathname.startsWith(subItem.path + "/")
    );
  };

  // Define menu items based on role
  const getMenuItems = () => {
    switch (user?.role) {
      case "business_analyst":
        return [
          { path: "/ba-dashboard", icon: LayoutDashboard, label: "Dashboard" },
          { path: "/ba/clients", icon: Users, label: "Clients" },
          { path: "/ba/projects", icon: Briefcase, label: "Projects" },
          { path: "/ba/payments", icon: DollarSign, label: "Payments" },
          { path: "/ba/meetings", icon: Calendar, label: "Meetings" },
        ];

      case "team_lead":
        return [
          { path: "/tl-dashboard", icon: LayoutDashboard, label: "Dashboard" },
          { path: "/tl/projects", icon: FolderKanban, label: "Projects" },
          {
            path: "/tl/requirements",
            icon: CheckSquare,
            label: "Requirements",
          },
          { path: "/tl/team", icon: Users, label: "My Team" },
          { path: "/tl/tasks", icon: FileText, label: "Tasks" },
          {
            icon: Clock,
            label: "Leave Management",
            subItems: [
              { path: "/tl/leave/my-leave", label: "Leave Balance" },    
              { path: "/tl/leave/my-history", label: "Leave History" },
              { path: "/tl/leave/team-requests", label: "Team Requests" },
              { path: "/tl/leave/team-calendar", label: "Team Calendar" },
            ],
          },
          { path: "/tl/messages", icon: MessageSquare, label: "Messages" },
        ];

      case "hr":
        return [
          { path: "/hr-dashboard", icon: LayoutDashboard, label: "Dashboard" },
          { path: "/hr/employees", icon: Users, label: "Employees" },
          { path: "/hr/attendance", icon: Calendar, label: "Attendance" },
          {
            icon: Calendar,
            label: "Leave Management",
            subItems: [
              { path: "/hr/leave", label: "Leave Dashboard" },
              { path: "/hr/leave/approvals", label: "Pending Approvals" },
              { path: "/hr/leave/all-requests", label: "All Requests" },
              { path: "/hr/leave/calendar", label: "Company Calendar" },
              { path: "/hr/leave/allocation", label: "Allocate Leaves" },
            ],
          },
          {
            path: "/hr/override-requests",
            icon: Shield,
            label: "Override Requests",
          },
          { path: "/hr/messages", icon: MessageSquare, label: "Messages" },
        ];

      case "employee":
        return [
          {
            path: "/employee-dashboard",
            icon: LayoutDashboard,
            label: "Dashboard",
          },
          {
            path: "/employee/time-tracking",
            icon: Clock,
            label: "Time Tracking",
          },
          {
            icon: Calendar,
            label: "My Leaves",
            subItems: [
              { path: "/employee/leave/balance", label: "Leave Balance" },
              { path: "/employee/leave/history", label: "Leave History" },
              { path: "/employee/leave/calendar", label: "Leave Calendar" },
            ],
          },
          { path: "/employee/tasks", icon: CheckSquare, label: "My Tasks" },
          {
            path: "/employee/messages",
            icon: MessageSquare,
            label: "Messages",
          },
          { path: "/employee/notes", icon: FileText, label: "My Notes" },
        ];

      case 'super_admin':
        return [
          { path: '/super-admin-dashboard', icon: LayoutDashboard, label: 'Dashboard' },
          { path: '/admin/users', icon: Users, label: 'User Management' },
          { path: '/admin/teams', icon: Users, label: 'Team Management' },
          { 
            icon: Calendar, 
            label: 'Leave Management',
            subItems: [
              { path: '/admin/leave/types', label: 'Leave Types' },
              { path: '/admin/leave/holidays', label: 'Public Holidays' },
              { path: '/admin/leave/policies', label: 'Leave Policies' }
            ]
          },
          { path: '/admin/override-requests', icon: CheckSquare, label: 'Override Requests' },
          { path: '/admin/audit-logs', icon: FileText, label: 'Audit Logs' },
        ];

      default:
        return [];
    }
  };

  const menuItems = getMenuItems();

  const getRoleLabel = () => {
    const roleLabels = {
      business_analyst: "Business Analyst",
      team_lead: "Team Lead",
      hr: "HR Manager",
      employee: "Employee",
      super_admin: "Super Admin",
    };
    return roleLabels[user?.role] || "User";
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        className="sidebar-mobile-toggle"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        {isMobileOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <Menu className="w-6 h-6" />
        )}
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="sidebar-mobile-overlay"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`sidebar ${isCollapsed ? "collapsed" : ""} ${isMobileOpen ? "mobile-open" : ""}`}
      >
        {/* Collapse Toggle Button - Desktop */}
        <button
          className="sidebar-collapse-btn"
          onClick={() => setIsCollapsed(!isCollapsed)}
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isCollapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <ChevronLeft className="w-5 h-5" />
          )}
        </button>

        {/* Logo Section */}
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="sidebar-logo-icon">
              <Briefcase className="w-7 h-7" />
            </div>
            {!isCollapsed && (
              <div className="sidebar-logo-text">
                <h1 className="sidebar-logo-title">Payroll</h1>
                <p className="sidebar-logo-subtitle">Management</p>
              </div>
            )}
          </div>
        </div>

        {/* User Profile Section */}
        <div className="sidebar-profile">
          <div className="sidebar-profile-avatar">
            <UserCog className="w-5 h-5" />
          </div>
          {!isCollapsed && (
            <div className="sidebar-profile-info">
              <p className="sidebar-profile-name">{user?.full_name}</p>
              <p className="sidebar-profile-role">{getRoleLabel()}</p>
            </div>
          )}
        </div>

        {/* Navigation Menu */}
        <nav className="sidebar-nav">
          <ul className="sidebar-menu">
            {menuItems.map((item, index) => {
              const Icon = item.icon;

              // Menu item with submenu
              if (item.subItems) {
                const hasActiveSubitem = isSubmenuActive(item.subItems);
                const isOpen = openSubmenus[item.label] || hasActiveSubitem;

                return (
                  <li key={index}>
                    <button
                      className={`sidebar-menu-item ${hasActiveSubitem ? "active" : ""}`}
                      onClick={() => toggleSubmenu(item.label)}
                      title={isCollapsed ? item.label : ""}
                    >
                      <Icon className="sidebar-menu-icon" />
                      {!isCollapsed && (
                        <>
                          <span className="sidebar-menu-label">
                            {item.label}
                          </span>
                          {isOpen ? (
                            <ChevronUp className="sidebar-menu-chevron" />
                          ) : (
                            <ChevronDown className="sidebar-menu-chevron" />
                          )}
                        </>
                      )}
                    </button>

                    {/* Submenu */}
                    {!isCollapsed && isOpen && (
                      <ul className="sidebar-submenu">
                        {item.subItems.map((subItem, subIndex) => {
                          // Only match exact path for submenu items
                          const isActive = location.pathname === subItem.path;

                          return (
                            <li key={subIndex}>
                              <Link
                                to={subItem.path}
                                className={`sidebar-submenu-item ${isActive ? "active" : ""}`}
                                onClick={() => setIsMobileOpen(false)}
                              >
                                <span className="sidebar-submenu-dot"></span>
                                {subItem.label}
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </li>
                );
              }

              // Regular menu item
              const isActive =
                location.pathname === item.path ||
                (item.path !== "/" && location.pathname.startsWith(item.path));

              return (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    className={`sidebar-menu-item ${isActive ? "active" : ""}`}
                    title={isCollapsed ? item.label : ""}
                    onClick={() => setIsMobileOpen(false)}
                  >
                    <Icon className="sidebar-menu-icon" />
                    {!isCollapsed && (
                      <span className="sidebar-menu-label">{item.label}</span>
                    )}
                    {isActive && !isCollapsed && (
                      <div className="sidebar-menu-indicator" />
                    )}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Settings & Logout */}
        <div className="sidebar-footer">
          <button
            className="sidebar-footer-item"
            title={isCollapsed ? "Settings" : ""}
          >
            <Settings className="w-5 h-5" />
            {!isCollapsed && <span>Settings</span>}
          </button>
          <button
            onClick={logout}
            className="sidebar-footer-item sidebar-logout"
            title={isCollapsed ? "Logout" : ""}
          >
            <LogOut className="w-5 h-5" />
            {!isCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
