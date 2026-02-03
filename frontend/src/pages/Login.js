import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from '../api/axios';
import '../styles/Login.css';

export default function Login() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const res = await login(identifier, password);
    setLoading(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    navigate('/home');
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError('');
    setResetSuccess('');
    setLoading(true);
    
    if (!resetEmail) {
      setError('Please enter your email address');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post('/api/auth/forgot-password', { email: resetEmail });
      
      if (response.data.success) {
        setResetSuccess(`Password reset link sent to ${resetEmail}. Please check your email.`);
        setResetEmail('');
        setTimeout(() => {
          setShowForgotModal(false);
          setResetSuccess('');
        }, 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-modern-wrapper">
      {/* Animated Background */}
      <div className="login-animated-bg">
        <div className="login-blob blob-1"></div>
        <div className="login-blob blob-2"></div>
        <div className="login-blob blob-3"></div>
      </div>

      {/* Main Container */}
      <div className="login-modern-container">
        {/* Login Form - Centered */}
        <div className="login-center-panel">
          <div className="login-form-wrapper">
            <div className="login-form-header">
              <h2>Welcome Back</h2>
              <p>Sign in to your account to continue</p>
            </div>

            {error && (
              <div className="login-error-banner">
                <span className="login-error-icon">⚠️</span>
                <div>
                  <strong>Login Error</strong>
                  <p>{error}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="login-form-modern">
              {/* Username or Email */}
              <div className="login-input-group">
                <label htmlFor="identifier" className="login-label">
                  <span className="login-label-icon">👤</span>
                  Username or Email
                </label>
                <input
                  id="identifier"
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Enter your username or email"
                  required
                  className="login-input-field"
                  disabled={loading}
                />
              </div>

              {/* Password */}
              <div className="login-input-group">
                <label htmlFor="password" className="login-label">
                  <span className="login-label-icon">🔐</span>
                  Password
                </label>
                <div className="login-password-wrapper">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    className="login-input-field"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="login-toggle-password"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                  >
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>

              {/* Remember & Forgot */}
              <div className="login-form-options">
                <label className="login-remember-me">
                  <input type="checkbox" />
                  <span>Remember me</span>
                </label>
                <a 
                  href="#" 
                  className="login-forgot-password"
                  onClick={(e) => {
                    e.preventDefault();
                    setShowForgotModal(true);
                  }}
                >
                  Forgot password?
                </a>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                className={`login-submit-btn ${loading ? 'loading' : ''}`}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="login-spinner"></span>
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <span className="login-btn-arrow">→</span>
                  </>
                )}
              </button>

              {/* Register Link */}
              <div className="login-register-prompt">
                <p>Don't have an account? <Link to="/register" className="login-register-link">Create one</Link></p>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="login-modal-overlay" onClick={() => setShowForgotModal(false)}>
          <div className="login-modal" onClick={(e) => e.stopPropagation()}>
            <div className="login-modal-header">
              <h3>Reset Password</h3>
              <button 
                className="login-modal-close"
                onClick={() => setShowForgotModal(false)}
              >
                ✕
              </button>
            </div>
            
            {resetSuccess ? (
              <div className="login-success-message">
                <span className="login-success-icon">✅</span>
                <p>{resetSuccess}</p>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="login-modal-form">
                <p className="login-modal-description">
                  Enter your email address and we'll send you a link to reset your password.
                </p>
                
                {error && (
                  <div className="login-error-banner">
                    <span className="login-error-icon">⚠️</span>
                    <p>{error}</p>
                  </div>
                )}
                
                <div className="login-input-group">
                  <label htmlFor="reset-email" className="login-label">
                    <span className="login-label-icon">📧</span>
                    Email Address
                  </label>
                  <input
                    id="reset-email"
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                    className="login-input-field"
                  />
                </div>
                
                <div className="login-modal-actions">
                  <button
                    type="button"
                    className="login-modal-btn login-modal-btn-cancel"
                    onClick={() => setShowForgotModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="login-modal-btn login-modal-btn-submit"
                  >
                    Send Reset Link
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

