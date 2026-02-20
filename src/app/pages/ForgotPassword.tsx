import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Activity, Mail, ArrowLeft } from 'lucide-react';

export function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would send a password reset email
    setSubmitted(true);
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        {/* Logo and App Name */}
        <div className="auth-logo">
          <div className="auth-logo-icon">
            <Activity className="w-8 h-8 text-white" />
          </div>
          <h1>Reset Password</h1>
          <p>
            {submitted 
              ? "Check your email for reset instructions" 
              : "Enter your email to receive password reset instructions"}
          </p>
        </div>

        {!submitted ? (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email" className="form-label">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#64748B]" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-input"
                  style={{ paddingLeft: '44px' }}
                  placeholder="your@email.com"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              style={{ width: '100%', marginTop: '8px' }}
            >
              Send Reset Link
            </button>
          </form>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ padding: '16px', backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '8px' }}>
              <p style={{ color: '#22C55E', textAlign: 'center' }}>
                We've sent password reset instructions to <strong>{email}</strong>
              </p>
            </div>
            <p style={{ color: '#64748B', fontSize: '14px', textAlign: 'center' }}>
              Didn't receive the email? Check your spam folder or try again.
            </p>
          </div>
        )}

        {/* Back to Login Link */}
        <div style={{ marginTop: '24px' }}>
          <button
            onClick={() => navigate('/')}
            className="btn btn-ghost"
            style={{ width: '100%', gap: '8px' }}
          >
            <ArrowLeft size={18} />
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}

