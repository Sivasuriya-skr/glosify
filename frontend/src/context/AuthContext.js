import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';

const API_BASE_URL = '/api/auth';
const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem('bw_user');
      if (!raw || raw === 'undefined' || raw === 'null') return null;
      return JSON.parse(raw);
    } catch (err) {
      console.warn('Corrupted bw_user data detected. Clearing...', err);
      localStorage.removeItem('bw_user');
      localStorage.removeItem('bw_token');
      return null;
    }
  });

  useEffect(() => {
    const token = localStorage.getItem('bw_token');
    if (token && !user) {
      const raw = localStorage.getItem('bw_user');
      if (raw && raw !== 'undefined' && raw !== 'null') {
        try {
          setUser(JSON.parse(raw));
        } catch (err) {
          localStorage.removeItem('bw_user');
          localStorage.removeItem('bw_token');
        }
      }
    }
  }, [user]);

  // --- LOGIN ---
  const login = async (emailOrUsername, password) => {
    try {
      const res = await axios.post(`${API_BASE_URL}/login`, {
        emailOrUsername, // ✅ Must match backend DTO field
        password,
      });

      const { token, username, email, message } = res.data;

      if (token && username && email) {
        const loggedUser = {
          username,
          email,
          message,
          joinDate: new Date().toLocaleString('default', { month: 'short', year: 'numeric' }),
        };
        localStorage.setItem('bw_token', token);
        localStorage.setItem('bw_user', JSON.stringify(loggedUser));
        setUser(loggedUser);
      }

      return { success: true, token };
    } catch (err) {
      console.error('Login failed:', err.response?.data || err.message);
      return {
        success: false,
        error: err.response?.data?.message || 'Login failed',
      };
    }
  };

  // --- REGISTER ---
  const register = async (payload) => {
    try {
      const res = await axios.post(`${API_BASE_URL}/register`, {
        username: payload.username,
        email: payload.email,
        password: payload.password,
        confirmPassword: payload.confirmPassword,
        captchaValue: payload.captchaValue,
        otp: payload.otp,
      });

      const { token, username, email, message } = res.data;

      if (token && username && email) {
        const newUser = { username, email };
        localStorage.setItem('bw_token', token);
        localStorage.setItem('bw_user', JSON.stringify(newUser));
        setUser(newUser);
      }

      // Return success with message - let component handle the display
      return { success: true, data: res.data, message: message || 'Registration successful! Welcome to BudgetWise.' };
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || err.response?.data || 'Registration failed. Please try again.';
      console.error('Registration failed:', errorMsg);
      // Return error - let component handle the display
      return {
        success: false,
        error: errorMsg,
      };
    }
  };

  // --- LOGOUT ---
  const logout = async () => {
    try {
      const token = localStorage.getItem('bw_token');
      if (token) {
        await axios.post(`${API_BASE_URL}/logout`, {}, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch (err) {
      console.warn('Logout API failed:', err.message);
    } finally {
      localStorage.removeItem('bw_token');
      localStorage.removeItem('bw_user');
      setUser(null);
    }
  };

  // --- AUTO SET AUTH HEADER ---
  useEffect(() => {
    const token = localStorage.getItem('bw_token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [user]);

  // --- SEND OTP ---
  const sendOtp = async (email) => {
    try {
      await axios.post(`${API_BASE_URL}/send-otp`, { email });
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.message || 'Failed to send verification code',
      };
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, register, sendOtp }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
