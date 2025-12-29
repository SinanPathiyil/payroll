import { useContext, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  DollarSign,
  Calendar,
  FileText,
  CheckSquare,
  BarChart3,
  Settings,
  UserCog,
  FolderKanban,
  MessageSquare,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X
} from 'lucide-react';

export default function Sidebar() {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Define menu items based on role
  const getMenuItems = () => {
    switch (user?.role) {
      case 'business_analyst':
        return [
          { path: '/ba-dashboard', icon: LayoutDashboard, label: 'Dashboard' },
          { path: '/ba/clients', icon: Users, label: 'Clients' },
          { path: '/ba/projects', icon: Briefcase, label: 'Projects' },
          { path: '/ba/payments', icon: DollarSign, label: 'Payments' },
          { path: '/ba/meetings', icon: Calendar, label: 'Meetings' },
          { path: '/ba/analytics', icon: BarChart3, label: 'Analytics' },
        ];
      
      case 'team_lead':
        return [
          { path: '/tl-dashboard', icon: LayoutDashboard, label: 'Dashboard' },
          { path: '/tl/projects', icon: FolderKanban, label: 'Projects' },
          { path: '/tl/requirements', icon: CheckSquare, label: 'Requirements' },
          { path: '/tl/team', icon: Users, label: 'My Team' },
          { path: '/tl/tasks', icon: FileText, label: 'Tasks' },
          { path: '/tl/messages', icon: MessageSquare, label: 'Messages' },
        ];
      
      case 'hr':
        return [
          { path: '/hr-dashboard', icon: LayoutDashboard, label: 'Dashboard' },
          { path: '/hr/employees', icon: Users, label: 'Employees' },
          { path: '/hr/tasks', icon: CheckSquare, label: 'Tasks' },
          { path: '/hr/attendance', icon: Calendar, label: 'Attendance' },
          { path: '/hr/messages', icon: MessageSquare, label: 'Messages' },
          { path: '/hr/reports', icon: BarChart3, label: 'Reports' },
        ];
      
      case 'employee':
        return [
          { path: '/employee-dashboard', icon: LayoutDashboard, label: 'Dashboard' },
          { path: '/employee/time-tracking', icon: Calendar, label: 'Time Tracking' },
          { path: '/employee/tasks', icon: CheckSquare, label: 'My Tasks' },
          { path: '/employee/messages', icon: MessageSquare, label: 'Messages' },
          { path: '/employee/notes', icon: FileText, label: 'My Notes' },
        ];

      case 'super_admin':
        return [
          { path: '/super-admin-dashboard', icon: LayoutDashboard, label: 'Dashboard' },
          { path: '/super-admin/users', icon: Users, label: 'User Management' },
          { path: '/super-admin/override-requests', icon: CheckSquare, label: 'Override Requests' },
          { path: '/super-admin/audit-logs', icon: FileText, label: 'Audit Logs' },
          { path: '/super-admin/system-stats', icon: BarChart3, label: 'System Stats' }
        ];
      
      default:
        return [];
    }
  };

  const menuItems = getMenuItems();

  const getRoleLabel = () => {
    const roleLabels = {
      business_analyst: 'Business Analyst',
      team_lead: 'Team Lead',
      hr: 'HR Manager',
      employee: 'Employee',
      super_admin: 'Super Admin'
    };
    return roleLabels[user?.role] || 'User';
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button 
        className="sidebar-mobile-toggle"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        {isMobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="sidebar-mobile-overlay"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''} ${isMobileOpen ? 'mobile-open' : ''}`}>
        {/* Collapse Toggle Button - Desktop */}
        <button 
          className="sidebar-collapse-btn"
          onClick={() => setIsCollapsed(!isCollapsed)}
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
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
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path || 
                             (item.path !== '/' && location.pathname.startsWith(item.path));
              
              return (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    className={`sidebar-menu-item ${isActive ? 'active' : ''}`}
                    title={isCollapsed ? item.label : ''}
                    onClick={() => setIsMobileOpen(false)}
                  >
                    <Icon className="sidebar-menu-icon" />
                    {!isCollapsed && <span className="sidebar-menu-label">{item.label}</span>}
                    {isActive && !isCollapsed && <div className="sidebar-menu-indicator" />}
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
            title={isCollapsed ? 'Settings' : ''}
          >
            <Settings className="w-5 h-5" />
            {!isCollapsed && <span>Settings</span>}
          </button>
          <button 
            onClick={logout} 
            className="sidebar-footer-item sidebar-logout"
            title={isCollapsed ? 'Logout' : ''}
          >
            <LogOut className="w-5 h-5" />
            {!isCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
}