import { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { LogOut, User, Shield } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-content">
          <div className="navbar-brand">
            <h1 className="navbar-title">Payroll System</h1>
            <span className="navbar-badge">
              {user?.role === 'hr' ? (
                <>
                  <Shield className="w-3.5 h-3.5" />
                  <span>HR Portal</span>
                </>
              ) : (
                <>
                  <User className="w-3.5 h-3.5" />
                  <span>Employee Portal</span>
                </>
              )}
            </span>
          </div>
          
          <div className="navbar-actions">
            <div className="navbar-user">
              <div className="navbar-user-avatar">
                <User className="w-4 h-4" />
              </div>
              <span className="navbar-user-name">{user?.full_name}</span>
            </div>
            <button
              onClick={logout}
              className="navbar-logout"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}