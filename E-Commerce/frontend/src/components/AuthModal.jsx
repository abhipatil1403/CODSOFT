import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { X, AlertTriangle } from 'lucide-react';

const AuthModal = ({ isOpen, onClose }) => {
  const { login, register } = useApp();
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Input states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const trimmedEmail = email.trim();
    let result;
    if (isLoginMode) {
      result = await login(trimmedEmail, password);
    } else {
      result = await register(name.trim(), trimmedEmail, password);
    }

    setLoading(false);
    if (result.success) {
      // Clear form and close modal
      setName('');
      setEmail('');
      setPassword('');
      onClose();
    } else {
      setError(result.message || 'Authentication failed. Please verify credentials.');
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content" style={{ maxWidth: '400px' }}>
        <button className="close-modal-btn" onClick={onClose}>
          <X size={18} />
        </button>

        <h2 className="form-title" style={{ marginBottom: '0.25rem' }}>
          {isLoginMode ? 'Welcome back' : 'Create account'}
        </h2>
        <p className="form-subtitle">
          {isLoginMode ? 'Sign in to access your curated catalog' : 'Join us to access exclusive features'}
        </p>

        {error && (
          <div style={{
            color: 'var(--error)',
            backgroundColor: 'rgba(217, 83, 79, 0.1)',
            padding: '0.75rem',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.85rem',
            marginBottom: '1.25rem',
            border: '1px solid rgba(217, 83, 79, 0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <AlertTriangle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {!isLoginMode && (
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                className="form-input"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Elena Rostova"
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-input"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="elena@studio.com"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <button type="submit" className="form-submit-btn" disabled={loading}>
            {loading ? 'Processing...' : isLoginMode ? 'Sign In' : 'Register'}
          </button>
        </form>

        <div className="form-footer-text">
          {isLoginMode ? (
            <>
              New to KAAR?{' '}
              <span className="form-toggle-link" onClick={() => { setIsLoginMode(false); setError(''); }}>
                Create an account
              </span>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <span className="form-toggle-link" onClick={() => { setIsLoginMode(true); setError(''); }}>
                Log in
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
