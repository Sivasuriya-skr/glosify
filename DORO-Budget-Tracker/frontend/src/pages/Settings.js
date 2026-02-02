import React, { useState, useEffect, useContext } from 'react';
import axios from '../api/axios';
import { useTheme } from '../context/ThemeContext';
import { TransactionContext } from '../context/TransactionContext';
import '../styles/Settings.css';

// Helper function to get user-friendly error messages
const getErrorMessage = (error, defaultMessage) => {
  const backendMessage = error.response?.data?.message;
  
  // Map technical errors to user-friendly messages
  const errorMap = {
    'No EntityManager': 'Something went wrong. Please try again.',
    'EntityManager': 'Something went wrong. Please try again.',
    'transaction': 'Something went wrong. Please try again.',
    'Connection refused': 'Unable to connect to server. Please check your internet connection.',
    'Network Error': 'Unable to connect to server. Please check your internet connection.',
    'timeout': 'Request timed out. Please try again.',
    '401': 'Your session has expired. Please log in again.',
    '403': 'You don\'t have permission to perform this action.',
    '500': 'Server error. Please try again later.',
  };
  
  // Check if the message contains any technical terms
  if (backendMessage) {
    for (const [key, value] of Object.entries(errorMap)) {
      if (backendMessage.toLowerCase().includes(key.toLowerCase())) {
        return value;
      }
    }
    return backendMessage;
  }
  
  return defaultMessage;
};

export default function Settings(){
  const { isDarkMode, toggleTheme } = useTheme();
  const { transactions } = useContext(TransactionContext);
  
  const [settings, setSettings] = useState({
    language: 'us English',
    currency: 'INR (₹) - Indian Rupee',
    monthlyIncome: '100000',
    riskTolerance: 'Moderate - Balanced approach to risk and return'
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  const handleCloudBackup = async (service) => {
    try {
      setLoading(true);
      const response = await axios.post(`/api/backup/${service}`, {
        transactions,
        settings,
        timestamp: new Date().toISOString()
      });
      
      if (response.data.authUrl) {
        // Open auth window for OAuth
        window.open(response.data.authUrl, '_blank', 'width=600,height=600');
        setMessage({ type: 'info', text: `Please authorize ${service} access in the popup window` });
      } else {
        setMessage({ type: 'success', text: `Backup to ${service} completed successfully!` });
      }
    } catch (error) {
      console.error('Backup error:', error);
      setMessage({ type: 'error', text: getErrorMessage(error, `Unable to backup to ${service}. Please try again.`) });
    } finally {
      setLoading(false);
    }
  };

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/settings');
      const data = response.data;
      setSettings({
        language: data.language || 'us English',
        currency: data.currency || 'INR (₹) - Indian Rupee',
        monthlyIncome: data.monthlyIncome || '100000',
        riskTolerance: data.riskTolerance || 'Moderate - Balanced approach to risk and return'
      });
    } catch (error) {
      console.error('Error loading settings:', error);
      // Use default values on error
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const saveChanges = async () => {
    try {
      setLoading(true);
      setMessage({ type: '', text: '' });
      // Save to backend API
      await axios.put('/api/settings', {
        language: settings.language,
        currency: settings.currency,
        monthlyIncome: settings.monthlyIncome,
        riskTolerance: settings.riskTolerance
      });
      setMessage({ type: 'success', text: 'Settings saved successfully!' });
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage({ type: 'error', text: getErrorMessage(error, 'Unable to save settings. Please try again.') });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setLoading(true);
      const confirmed = window.confirm(
        'Are you sure you want to delete your account? This will permanently remove all your data and cannot be undone.'
      );
      
      if (!confirmed) {
        setLoading(false);
        return;
      }
      
      const finalConfirm = window.confirm(
        'This is your final warning. Delete account permanently? You will be logged out immediately.'
      );
      
      if (!finalConfirm) {
        setLoading(false);
        return;
      }
      
      // Call delete endpoint
      const response = await axios.delete('/api/profile/account');
      
      if (response.status === 200) {
        setMessage({ type: 'success', text: 'Account deleted successfully. You will be logged out now.' });
        // Clear local storage and redirect to login
        setTimeout(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('bw_token');
          window.location.href = '/login';
        }, 1500);
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      setMessage({ type: 'error', text: getErrorMessage(error, 'Unable to delete your account. Please try again later.') });
    } finally {
      setLoading(false);
    }
  };

  const handleResetAccount = async () => {
    try {
      setLoading(true);
      const confirmed = window.confirm(
        'Are you sure you want to reset all your data? This will delete all transactions, budgets, and goals but keep your account. This action cannot be undone.'
      );
      
      if (!confirmed) {
        setLoading(false);
        return;
      }
      
      const finalConfirm = window.confirm(
        'Final confirmation: Reset all account data? This cannot be undone.'
      );
      
      if (!finalConfirm) {
        setLoading(false);
        return;
      }
      
      // Call reset endpoint
      const response = await axios.post('/api/profile/reset-data');
      
      if (response.status === 200) {
        setMessage({ type: 'success', text: 'Account data reset successfully. All your data has been cleared.' });
        // Optionally refresh the page or redirect
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 1500);
      }
    } catch (error) {
      console.error('Error resetting account:', error);
      setMessage({ type: 'error', text: getErrorMessage(error, 'Unable to reset your account data. Please try again later.') });
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = isDarkMode ? {
    width: '100%', 
    padding:'10px 12px', 
    border:'1px solid #334155', 
    borderRadius:'6px',
    background: '#1e293b',
    color: '#f1f5f9'
  } : {
    width: '100%', 
    padding:'10px 12px', 
    border:'1px solid #e5e7eb', 
    borderRadius:'6px'
  };

  return (
    <div>
      {/* Message notification */}
      {message.text && (
        <div style={{
          padding: '16px 20px',
          marginBottom: '20px',
          borderRadius: '12px',
          background: message.type === 'success' 
            ? (isDarkMode ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.1)')
            : message.type === 'info'
            ? (isDarkMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)')
            : (isDarkMode ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)'),
          border: `1px solid ${message.type === 'success' ? '#10b981' : message.type === 'info' ? '#3b82f6' : '#ef4444'}`,
          color: message.type === 'success' ? '#10b981' : message.type === 'info' ? '#3b82f6' : '#ef4444',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          animation: 'fadeIn 0.3s ease-out'
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {message.type === 'success' ? '✅' : message.type === 'info' ? 'ℹ️' : '⚠️'} {message.text}
          </span>
          <button
            onClick={() => setMessage({ type: '', text: '' })}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'inherit',
              cursor: 'pointer',
              fontSize: '18px',
              padding: '0 4px'
            }}
          >
            ×
          </button>
        </div>
      )}
      {/* Enhanced Header */}
      <div className="page-title-card" style={{
        background: isDarkMode 
          ? 'linear-gradient(135deg, #2e1065 0%, #3b0764 25%, #4c1d95 50%, #5b21b6 75%, #6d28d9 100%)'
          : 'linear-gradient(135deg, #e9d5ff 0%, #d8b4fe 25%, #c4b5fd 50%, #a78bfa 75%, #8b5cf6 100%)',
        boxShadow: isDarkMode 
          ? '0 10px 40px rgba(91, 33, 182, 0.3), 0 0 60px rgba(139, 92, 246, 0.1)'
          : '0 8px 32px rgba(139, 92, 246, 0.2), 0 0 60px rgba(167, 139, 250, 0.15)'
      }}>
        {/* Animated Glowing Orbs */}
        <div style={{
          position: 'absolute',
          top: '-60px',
          right: '-60px',
          width: '200px',
          height: '200px',
          background: isDarkMode 
            ? 'radial-gradient(circle, rgba(139, 92, 246, 0.4) 0%, rgba(109, 40, 217, 0.2) 40%, transparent 70%)'
            : 'radial-gradient(circle, rgba(192, 132, 252, 0.5) 0%, rgba(167, 139, 250, 0.3) 40%, transparent 70%)',
          borderRadius: '50%',
          animation: 'pulse 3s ease-in-out infinite',
          filter: 'blur(20px)'
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-40px',
          left: '10%',
          width: '150px',
          height: '150px',
          background: isDarkMode 
            ? 'radial-gradient(circle, rgba(124, 58, 237, 0.3) 0%, rgba(139, 92, 246, 0.15) 50%, transparent 70%)'
            : 'radial-gradient(circle, rgba(216, 180, 254, 0.6) 0%, rgba(196, 181, 253, 0.3) 50%, transparent 70%)',
          borderRadius: '50%',
          animation: 'pulse 4s ease-in-out infinite 1s',
          filter: 'blur(15px)'
        }} />
        <div style={{
          position: 'absolute',
          top: '20%',
          left: '60%',
          width: '100px',
          height: '100px',
          background: isDarkMode 
            ? 'radial-gradient(circle, rgba(167, 139, 250, 0.25) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(233, 213, 255, 0.7) 0%, transparent 70%)',
          borderRadius: '50%',
          animation: 'pulse 5s ease-in-out infinite 0.5s',
          filter: 'blur(10px)'
        }} />
        {/* Sparkle effects */}
        <div style={{
          position: 'absolute',
          top: '15%',
          right: '20%',
          width: '8px',
          height: '8px',
          background: 'white',
          borderRadius: '50%',
          boxShadow: '0 0 10px 2px rgba(255,255,255,0.8)',
          animation: 'pulse 2s ease-in-out infinite'
        }} />
        <div style={{
          position: 'absolute',
          bottom: '25%',
          right: '35%',
          width: '6px',
          height: '6px',
          background: 'white',
          borderRadius: '50%',
          boxShadow: '0 0 8px 2px rgba(255,255,255,0.6)',
          animation: 'pulse 2.5s ease-in-out infinite 0.3s'
        }} />
        
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1 style={{
            fontSize: '28px',
            fontWeight: '700',
            marginBottom: '6px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{
              background: isDarkMode 
                ? 'linear-gradient(135deg, #ffffff 0%, #e9d5ff 50%, #d8b4fe 100%)'
                : 'linear-gradient(135deg, #581c87 0%, #6b21a8 50%, #7c3aed 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>Settings</span>
            <span style={{ WebkitTextFillColor: 'initial' }}>⚙️</span>
          </h1>
          <p style={{ color: isDarkMode ? 'rgba(255,255,255,0.85)' : 'rgba(88, 28, 135, 0.8)', fontSize: '15px', margin: 0, fontWeight: '500' }}>Manage your app preferences</p>
        </div>
      </div>

      {/* Appearance */}
      <div className="card" style={{marginBottom:24, background: isDarkMode ? '#1e293b' : '#ffffff'}}>
        <div style={{display:'flex', gap:12, alignItems:'center', marginBottom:16}}>
          <div style={{
            width:40, 
            height:40, 
            background: isDarkMode ? '#334155' : '#f3f4f6', 
            borderRadius:8,
            display:'flex',
            alignItems:'center',
            justifyContent:'center',
            fontSize:20
          }}>
            ☼
          </div>
          <div>
            <div style={{fontWeight:600, fontSize:16, color: isDarkMode ? '#f1f5f9' : '#111827'}}>Appearance</div>
            <div style={{color: isDarkMode ? '#94a3b8' : '#6b7280', fontSize:14}}>Customize how BudgetWise looks</div>
          </div>
        </div>

        <div className="form-row">
          <label style={{color: isDarkMode ? '#cbd5e1' : '#374151'}}>Dark Mode</label>
          <div style={{display:'flex', alignItems:'center', gap:12}}>
            <div 
              onClick={toggleTheme}
              style={{display:'flex', alignItems:'center', gap:8, cursor:'pointer'}}
            >
              <div style={{
                width:44,
                height:24,
                background: isDarkMode ? '#2563eb' : '#e5e7eb',
                borderRadius:12,
                position:'relative',
                transition:'background-color 0.2s',
                cursor: 'pointer'
              }}>
                <div style={{
                  width:20,
                  height:20,
                  background:'white',
                  borderRadius:'50%',
                  position:'absolute',
                  top:2,
                  left: isDarkMode ? 22 : 2,
                  transition:'left 0.2s'
                }} />
              </div>
              <span style={{color: isDarkMode ? '#cbd5e1' : '#374151', userSelect: 'none'}}>Switch between light and dark theme</span>
            </div>
          </div>
        </div>
      </div>

      {/* Language */}
      <div className="card" style={{marginBottom:24, background: isDarkMode ? '#1e293b' : '#ffffff'}}>
        <div style={{display:'flex', gap:12, alignItems:'center', marginBottom:16}}>
          <div style={{
            width:40, 
            height:40, 
            background: isDarkMode ? '#334155' : '#f3f4f6', 
            borderRadius:8,
            display:'flex',
            alignItems:'center',
            justifyContent:'center',
            fontSize:20
          }}>
            🌐
          </div>
          <div>
            <div style={{fontWeight:600, fontSize:16, color: isDarkMode ? '#f1f5f9' : '#111827'}}>Language</div>
            <div style={{color: isDarkMode ? '#94a3b8' : '#6b7280', fontSize:14}}>Choose your preferred language</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: 8,
            background: isDarkMode ? '#0e7490' : '#dbeafe',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 20,
            color: isDarkMode ? '#06b6d4' : '#0284c7',
            flexShrink: 0
          }}>
            🗣️
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 6, color: isDarkMode ? '#cbd5e1' : '#111827' }}>Select Language</label>
            <select 
              value={settings.language}
              onChange={e => handleChange('language', e.target.value)}
              style={inputStyle}
            >
              <option value="us English">US English</option>
              <option value="uk English">UK English</option>
              <option value="spanish">Spanish</option>
              <option value="french">French</option>
            </select>
          </div>
        </div>
      </div>

      {/* Financial Preferences */}
      <div className="card" style={{marginBottom:24, background: isDarkMode ? '#1e293b' : '#ffffff'}}>
        <div style={{display:'flex', gap:12, alignItems:'center', marginBottom:16}}>
          <div style={{
            width:40, 
            height:40, 
            background: isDarkMode ? '#334155' : '#f3f4f6', 
            borderRadius:8,
            display:'flex',
            alignItems:'center',
            justifyContent:'center',
            fontSize:20
          }}>
            💰
          </div>
          <div>
            <div style={{fontWeight:600, fontSize:16, color: isDarkMode ? '#f1f5f9' : '#111827'}}>Financial Preferences</div>
            <div style={{color: isDarkMode ? '#94a3b8' : '#6b7280', fontSize:14}}>Set your currency and financial settings</div>
          </div>
        </div>

        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:20}}>
          {/* Currency */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 8,
              background: isDarkMode ? '#713f12' : '#fef3c7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20,
              color: isDarkMode ? '#fbbf24' : '#d97706',
              flexShrink: 0
            }}>
              💵
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 6, color: isDarkMode ? '#cbd5e1' : '#111827' }}>Preferred Currency</label>
              <select 
                value={settings.currency}
                onChange={e => handleChange('currency', e.target.value)}
                style={inputStyle}
              >
                <option>INR (₹) - Indian Rupee</option>
                <option>USD ($) - US Dollar</option>
                <option>EUR (€) - Euro</option>
                <option>GBP (£) - British Pound</option>
              </select>
            </div>
          </div>

          {/* Monthly Income */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 8,
              background: isDarkMode ? '#14532d' : '#dcfce7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20,
              color: isDarkMode ? '#86efac' : '#16a34a',
              flexShrink: 0
            }}>
              💳
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 6, color: isDarkMode ? '#cbd5e1' : '#111827' }}>Average Monthly Income</label>
              <input 
                type="text"
                value={settings.monthlyIncome}
                onChange={e => handleChange('monthlyIncome', e.target.value)}
                style={inputStyle}
              />
            </div>
          </div>

          {/* Risk Tolerance - Full Width */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', gridColumn: '1 / -1' }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 8,
              background: isDarkMode ? '#7f1d1d' : '#fee2e2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20,
              color: isDarkMode ? '#fca5a5' : '#dc2626',
              flexShrink: 0
            }}>
              ⚖️
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 6, color: isDarkMode ? '#cbd5e1' : '#111827' }}>Risk Tolerance</label>
              <select 
                value={settings.riskTolerance}
                onChange={e => handleChange('riskTolerance', e.target.value)}
                style={inputStyle}
              >
                <option>Conservative - Low risk, stable returns</option>
                <option>Moderate - Balanced approach to risk and return</option>
                <option>Aggressive - Higher risk, potential higher returns</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Account Management */}
      <div className="card" style={{marginBottom:24, background: isDarkMode ? '#1e293b' : '#ffffff'}}>
        <div style={{display:'flex', gap:12, alignItems:'center', marginBottom:16}}>
          <div style={{
            width:40, 
            height:40, 
            background: isDarkMode ? '#7f1d1d' : '#fee2e2', 
            borderRadius:8,
            display:'flex',
            alignItems:'center',
            justifyContent:'center',
            fontSize:20
          }}>
            ⚠️
          </div>
          <div>
            <div style={{fontWeight:600, fontSize:16, color: isDarkMode ? '#f1f5f9' : '#111827'}}>Account Management</div>
            <div style={{color: isDarkMode ? '#94a3b8' : '#6b7280', fontSize:14}}>Reset or delete your account data</div>
          </div>
        </div>

        <div style={{display:'flex', gap:12}}>
          <button 
            onClick={handleResetAccount}
            disabled={loading}
            className="btn secondary"
            style={{padding:'10px 20px', fontSize:14, color: '#f59e0b', borderColor: '#f59e0b', opacity: loading ? 0.6 : 1, cursor: loading ? 'not-allowed' : 'pointer'}}
          >
            🔄 {loading ? 'Processing...' : 'Reset Account'}
          </button>
          <button 
            onClick={handleDeleteAccount}
            disabled={loading}
            className="btn"
            style={{padding:'10px 20px', fontSize:14, background: '#dc2626', borderColor: '#dc2626', opacity: loading ? 0.6 : 1, cursor: loading ? 'not-allowed' : 'pointer'}}
          >
            🗑️ {loading ? 'Processing...' : 'Delete Account'}
          </button>
        </div>
      </div>

      {/* Save Button */}
      <button 
        onClick={saveChanges}
        className="btn"
        style={{padding:'12px 24px', fontSize:15}}
        disabled={loading}
      >
        {loading ? 'Saving...' : 'Save Changes'}
      </button>
    </div>
  );
}
