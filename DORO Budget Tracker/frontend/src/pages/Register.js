import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Register.css';

export default function Register() {
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    captchaInput: '',
    otp: '',
  });

  const [captcha, setCaptcha] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  const { register, sendOtp } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    generateCaptcha();
  }, []);

  // Generate random captcha
  const generateCaptcha = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptcha(result);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSendOtp = async () => {
    if (!form.email) {
      setError('Please enter your email first.');
      return;
    }

    setIsSendingOtp(true);
    setError('');
    const res = await sendOtp(form.email);
    setIsSendingOtp(false);

    if (res.success) {
      setOtpSent(true);
      setSuccessMsg('Verification code sent to your email!');
    } else {
      setError(res.error);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    // --- Validations ---
    if (!form.username || !form.email || !form.password || !form.otp) {
      setError('All fields including verification code are required.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (form.captchaInput !== captcha) {
      setError('Invalid captcha');
      generateCaptcha();
      setForm({ ...form, captchaInput: '' });
      return;
    }

    // --- Send request ---
    const res = await register({
      username: form.username,
      email: form.email,
      password: form.password,
      confirmPassword: form.confirmPassword,
      captchaValue: form.captchaInput,
      otp: form.otp,
    });

    if (!res.success) {
      setError(res.error);
      generateCaptcha();
      setForm({ ...form, captchaInput: '' });
      return;
    }

    // ✅ Registration Success
    setSuccessMsg(res.data?.message || 'Registration successful!');
    setTimeout(() => navigate('/login'), 1500);
  };

  const togglePasswordVisibility = (field) => {
    if (field === 'password') setShowPassword(!showPassword);
    else setShowConfirmPassword(!showConfirmPassword);
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <h2>Create Your Account</h2>
        <p>Sign up to get started with BudgetWise</p>

        {/* Error message */}
        {error && (
          <div className="auth-error">
            <span>⚠️</span>
            <div>
              <strong>Registration Error</strong>
              <p>{error}</p>
            </div>
          </div>
        )}

        {/* Success message */}
        {successMsg && (
          <div className="auth-success">
            <span>✓</span>
            <div>
              <strong>Success!</strong>
              <p>{successMsg}</p>
            </div>
          </div>
        )}

        <form onSubmit={submit} className="auth-form">
          {/* Username */}
          <div className="form-row">
            <label htmlFor="username">
              <span>👤</span> Username
            </label>
            <input
              id="username"
              type="text"
              name="username"
              value={form.username}
              onChange={handleChange}
              placeholder="Enter your username"
              required
            />
          </div>

          {/* Email */}
          <div className="form-row">
            <label htmlFor="email">
              <span>📧</span> Email
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                id="email"
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Enter your email"
                required
                style={{ flex: 1 }}
              />
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={isSendingOtp}
                className="otp-btn"
                style={{
                  padding: '0 15px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '600',
                  opacity: isSendingOtp ? 0.7 : 1,
                  whiteSpace: 'nowrap'
                }}
              >
                {isSendingOtp ? 'Sending...' : (otpSent ? 'Resend' : 'Send Code')}
              </button>
            </div>
          </div>

          {/* OTP */}
          <div className="form-row">
            <label htmlFor="otp">
              <span>🛡️</span> Verification Code
            </label>
            <input
              id="otp"
              type="text"
              name="otp"
              value={form.otp}
              onChange={handleChange}
              placeholder="Enter 6-digit code"
              required
              maxLength="6"
            />
          </div>

          {/* Password */}
          <div className="form-row">
            <label htmlFor="password">
              <span>🔐</span> Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Enter your password (min 8 characters)"
                required
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('password')}
                style={{
                  position: 'absolute',
                  right: 14,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  border: 'none',
                  background: 'none',
                  font: 'inherit',
                  cursor: 'pointer',
                  padding: '8px',
                  opacity: '0.6',
                  transition: 'opacity 0.2s',
                }}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="form-row">
            <label htmlFor="confirmPassword">
              <span>🔐</span> Confirm Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm your password"
                required
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('confirm')}
                style={{
                  position: 'absolute',
                  right: 14,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  border: 'none',
                  background: 'none',
                  font: 'inherit',
                  cursor: 'pointer',
                  padding: '8px',
                  opacity: '0.6',
                  transition: 'opacity 0.2s',
                }}
              >
                {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          {/* Captcha */}
          <div className="form-row">
            <label htmlFor="captcha">
              <span>🛡️</span> Captcha
            </label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '10px' }}>
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  padding: '10px 16px',
                  borderRadius: '8px',
                  fontFamily: 'monospace',
                  letterSpacing: '3px',
                  userSelect: 'none',
                  color: '#f1f5f9',
                  fontWeight: 'bold',
                  minWidth: '120px',
                  textAlign: 'center',
                }}
              >
                {captcha}
              </div>
              <button
                type="button"
                onClick={generateCaptcha}
                title="Refresh captcha"
                style={{
                  border: 'none',
                  background: 'rgba(102, 126, 234, 0.2)',
                  color: '#667eea',
                  cursor: 'pointer',
                  fontSize: '18px',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  transition: 'all 0.2s',
                }}
              >
                ↺
              </button>
            </div>
            <input
              id="captcha"
              type="text"
              name="captchaInput"
              value={form.captchaInput}
              onChange={handleChange}
              placeholder="Enter the captcha code"
              required
            />
          </div>

          {/* Register Button */}
          <button
            type="submit"
            className="auth-submit"
          >
            Register
            <span style={{ fontSize: '18px' }}>→</span>
          </button>

          <div className="auth-link">
            <p>Already have an account? <Link to="/login">Sign In</Link></p>
          </div>
        </form>
      </div>
    </div>
  );
}
