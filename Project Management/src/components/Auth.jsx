import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Mail, Lock, User, FolderKanban, ArrowRight } from 'lucide-react';

export default function Auth({ onAuthSuccess }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const handleAuth = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
          },
        });
        if (error) throw error;
        setSuccessMsg('Sign up successful! Please check your email inbox to confirm registration.');
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        if (data?.session) {
          onAuthSuccess(data.session);
        }
      }
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper fade-in">
      <div className="auth-container glass-card">
        <div className="auth-header">
          <h2>{isSignUp ? 'Create your Account' : 'Welcome Back'}</h2>
          <p>{isSignUp ? 'Sign up to manage your tasks' : 'Sign in to access your dashboard'}</p>
        </div>

        {errorMsg && <div className="auth-error-alert">{errorMsg}</div>}
        {successMsg && <div className="auth-success-alert">{successMsg}</div>}

        <form onSubmit={handleAuth} className="auth-form">
          {isSignUp && (
            <div className="form-group">
              <label>Full Name</label>
              <div className="input-with-icon">
                <User size={16} />
                <input
                  type="text"
                  placeholder="Abhishek Patil"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label>Email Address</label>
            <div className="input-with-icon">
              <Mail size={16} />
              <input
                type="email"
                placeholder="abhishek.patil@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Password</label>
            <div className="input-with-icon">
              <Lock size={16} />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary auth-submit-btn">
            <span>{loading ? 'Processing...' : isSignUp ? 'Sign Up' : 'Sign In'}</span>
            <ArrowRight size={16} />
          </button>
        </form>

        <div className="auth-footer">
          <button onClick={() => setIsSignUp(!isSignUp)} className="btn-toggle-auth">
            {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
          </button>
        </div>
      </div>
    </div>
  );
}
