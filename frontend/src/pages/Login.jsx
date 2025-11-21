import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { LogIn, Loader2, User, Lock } from 'lucide-react';
import logoImage from '../assets/boehm-logo.png';

export default function Login() {
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(credentials);

    if (!result.success) {
      setError(result.error);
    }

    setLoading(false);
  };

  return (
    <div className="login-container">
      {/* Background with gradient overlay */}
      <div className="login-background"></div>
      
      {/* Logo Watermark */}
      <div className="login-watermark"></div>

      {/* Top Right Logo */}
      <div className="login-logo-corner">
        <img src={logoImage} alt="Company Logo" />
      </div>

      {/* Main Content */}
      <div className="login-content">
        <div className="login-card">
          {/* Header */}
          <div className="login-header">
            <div className="login-icon-wrapper">
              <LogIn className="login-icon" />
            </div>
            <h1 className="login-title">Payroll Management</h1>
            <p className="login-subtitle">Sign in to access your dashboard</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="login-form">
            {/* Error Message */}
            {error && (
              <div className="login-error">
                <span>{error}</span>
              </div>
            )}

            {/* Email Input */}
            <div className="login-input-group">
              <label className="login-label">
                Email Address
              </label>
              <div className="login-input-wrapper">
                <User className="login-input-icon" />
                <input
                  type="email"
                  required
                  value={credentials.email}
                  onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
                  className="login-input"
                  placeholder="john.doe@company.com"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="login-input-group">
              <label className="login-label">
                Password
              </label>
              <div className="login-input-wrapper">
                <Lock className="login-input-icon" />
                <input
                  type="password"
                  required
                  value={credentials.password}
                  onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                  className="login-input"
                  placeholder="Enter your password"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="login-button"
            >
              {loading ? (
                <>
                  <Loader2 className="login-button-icon animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <LogIn className="login-button-icon" />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>

          {/* Demo Credentials */}
          <div className="login-demo">
            <p className="login-demo-title">Demo Credentials</p>
            <div className="login-demo-cards">
              <div className="login-demo-card">
                <span className="login-demo-role">HR</span>
                <code className="login-demo-email">hr@company.com</code>
                <code className="login-demo-pass">password123</code>
              </div>
              <div className="login-demo-card">
                <span className="login-demo-role">Employee</span>
                <code className="login-demo-email">employee@company.com</code>
                <code className="login-demo-pass">password123</code>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="login-footer">
          <p>© 2024 Payroll Management System. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}