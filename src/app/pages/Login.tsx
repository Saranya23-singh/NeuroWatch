import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Activity, AlertCircle } from 'lucide-react';
import { useAuth } from '@/app/context/AuthContext';

const FIREBASE_URL =
  "https://neurowatch-b3b08-default-rtdb.firebaseio.com/users.json";

export function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch(FIREBASE_URL);
      const data = await res.json();

      if (!data) {
        setError("No users found");
        return;
      }

      const users = Object.entries(data);

      const matchedUser = users.find(([_, value]: any) => {
        return (
          (value.username === username || value.email === username) &&
          value.password === password
        );
      });

      if (matchedUser) {
        navigate('/dashboard');
      } else {
        setError('Invalid username or password');
      }

    } catch (err) {
      setError("Something went wrong. Try again.");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">
            <Activity className="w-8 h-8 text-white" />
          </div>
          <h1>NeuroWatch</h1>
          <p>AI-Powered Neurodegenerative Monitoring</p>
        </div>

        <form onSubmit={handleLogin} className="auth-form">
          <div className="form-group">
            <label htmlFor="username" className="form-label">
              Username or Email
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setError('');
              }}
              className="form-input"
              placeholder="Enter your username or email"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              className="form-input"
              placeholder="Enter your password"
              required
            />
          </div>

          <div className="forgot-password">
            <button
              type="button"
              onClick={() => navigate('/forgot-password')}
              className="forgot-password-link"
            >
              Forgot password?
            </button>
          </div>

          {error && (
            <div className="form-error-box">
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary btn-lg"
          >
            Login
          </button>
        </form>

        <div className="auth-signup">
          <p>
            Don't have an account?{' '}
            <button
              onClick={() => navigate('/signup')}
              className="auth-signup-link"
            >
              Sign up
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

