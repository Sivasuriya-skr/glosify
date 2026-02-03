import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import axios from '../api/axios';
import '../styles/Profile.css';

// Helper function to get user-friendly error messages
const getErrorMessage = (error, defaultMessage) => {
  const backendMessage = error.response?.data?.message;
  
  const errorMap = {
    'Connection refused': 'Unable to connect to server. Please check your internet connection.',
    'Network Error': 'Unable to connect to server. Please check your internet connection.',
    'timeout': 'Request timed out. Please try again.',
    '401': 'Your session has expired. Please log in again.',
    '403': 'You don\'t have permission to perform this action.',
    '500': 'Server error. Please try again later.',
  };
  
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

export default function Profile(){
  const { user, logout } = useAuth();
  const { isDarkMode } = useTheme();
  const [profile, setProfile] = useState({
    fullName: '',
    email: user?.email || '',
    occupation: '',
    address: '',
    phoneNumber: '',
    dateOfBirth: '',
    bio: '',
    profileImageUrl: '',
    createdAt: null
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [showUploader, setShowUploader] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if(user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      console.log('Loading profile...');
      const response = await axios.get('/api/profile');
      console.log('Profile response:', response.data);
      const data = response.data;
      setProfile({
        fullName: data.fullName || '',
        email: data.email || user?.email || '',
        occupation: data.occupation || '',
        address: data.address || '',
        phoneNumber: data.phoneNumber || '',
        dateOfBirth: data.dateOfBirth || '',
        bio: data.bio || '',
        profileImageUrl: data.profileImageUrl || '',
        createdAt: data.createdAt || null
      });
    } catch (error) {
      console.error('Error loading profile:', error);
      // Use default values if API fails
      setProfile(prev => ({
        ...prev,
        email: user?.email || prev.email
      }));
    } finally {
      setLoading(false);
    }
  };

  const getInitial = (name) => {
    return name.charAt(0).toUpperCase();
  };

  const calculateAge = (birthDate) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const formatMemberSince = (dateString) => {
    if (!dateString) return 'Legacy Member';
    const date = new Date(dateString);
    const options = { month: 'short', year: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  const handleChange = (field, value) => {
    setProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setMessage({ type: '', text: '' });
      // Prepare data with only non-empty values
      const updateData = {
        fullName: profile.fullName.trim() || undefined,
        occupation: profile.occupation.trim() || undefined,
        address: profile.address.trim() || undefined,
        phoneNumber: profile.phoneNumber.trim() || undefined,
        dateOfBirth: profile.dateOfBirth || undefined,
        bio: profile.bio.trim() || undefined
      };
      
      console.log('Saving profile with data:', updateData);
      
      // Update profile via backend API
      const response = await axios.put('/api/profile', updateData);
      
      console.log('Save response:', response.data);
      
      const updatedData = response.data;
      // Update state with response data to ensure data persists
      setProfile({
        fullName: updatedData.fullName || '',
        email: updatedData.email || user?.email || '',
        occupation: updatedData.occupation || '',
        address: updatedData.address || '',
        phoneNumber: updatedData.phoneNumber || '',
        dateOfBirth: updatedData.dateOfBirth || '',
        bio: updatedData.bio || '',
        profileImageUrl: updatedData.profileImageUrl || ''
      });
      
      setMessage({ type: 'success', text: 'Profile saved successfully!' });
      // Reload profile to confirm persistence
      await loadProfile();
    } catch (error) {
      console.error('Error saving profile:', error);
      setMessage({ type: 'error', text: getErrorMessage(error, 'Unable to save your profile. Please try again.') });
    } finally {
      setLoading(false);
    }
  };

  if(!profile) return <div>Loading...</div>;

  const age = calculateAge(profile.dateOfBirth);
  const memberSince = formatMemberSince(profile.createdAt);

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
            : (isDarkMode ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)'),
          border: `1px solid ${message.type === 'success' ? '#10b981' : '#ef4444'}`,
          color: message.type === 'success' ? '#10b981' : '#ef4444',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          animation: 'fadeIn 0.3s ease-out'
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {message.type === 'success' ? '✅' : '⚠️'} {message.text}
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
            }}>Profile</span>
            <span style={{ WebkitTextFillColor: 'initial' }}>👤</span>
          </h1>
          <p style={{ color: isDarkMode ? 'rgba(255,255,255,0.85)' : 'rgba(88, 28, 135, 0.8)', fontSize: '15px', margin: 0, fontWeight: '500' }}>Manage your personal information</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 24, marginBottom: 24 }}>
        {/* Profile Picture and Name */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px' }}>
          <div>
            {previewUrl ? (
              <img src={previewUrl} alt="avatar" style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', marginBottom: 16 }} />
            ) : profile.profileImageUrl ? (
              <img src={profile.profileImageUrl} alt="avatar" style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', marginBottom: 16 }} />
            ) : (
              <div style={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                background: '#6366f1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 32,
                color: 'white',
                marginBottom: 16
              }}>{getInitial(profile.fullName)}</div>
            )}
          </div>
          <div style={{ marginBottom: 12 }}>
            <div onClick={() => setShowUploader(s => !s)} style={{ cursor: 'pointer', color: '#2563eb', marginBottom: 8 }}>
              {showUploader ? 'Cancel' : (profile.profileImageUrl || previewUrl) ? 'Change profile picture' : 'Add profile picture'}
            </div>
            {showUploader && (
              <div>
                {/* hidden native input - will be triggered by Choose button */}
                <input
                  id="avatar-input"
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={e => {
                    const file = e.target.files[0];
                    setSelectedFile(file);
                    if (file) {
                      const url = URL.createObjectURL(file);
                      setPreviewUrl(url);
                    }
                  }}
                />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    className="btn"
                    onClick={() => document.getElementById('avatar-input').click()}
                  >
                    Choose File
                  </button>
                  <button
                    className="btn"
                    onClick={async () => {
                      if (!selectedFile) {
                        setMessage({ type: 'error', text: 'Please select an image first' });
                        return;
                      }
                      const fd = new FormData();
                      fd.append('file', selectedFile);
                      try {
                        setLoading(true);
                        const res = await axios.post('/api/profile/avatar', fd, {
                          headers: {
                            'Content-Type': 'multipart/form-data'
                          }
                        });
                        const data = res.data;
                        // update local profile
                        const updated = { ...profile };
                        if (data.profileImageUrl) updated.profileImageUrl = data.profileImageUrl;
                        setProfile(updated);
                        setShowUploader(false);
                        setSelectedFile(null);
                        setPreviewUrl(null);
                        setMessage({ type: 'success', text: 'Profile picture uploaded successfully!' });
                      } catch (err) {
                        console.error(err);
                        const msg = err?.response?.data?.message || err?.response?.data?.error || err.message || 'Upload failed';
                        setMessage({ type: 'error', text: `Upload failed: ${msg}` });
                      } finally {
                        setLoading(false);
                      }
                    }}
                  >
                    Upload
                  </button>
                </div>
              </div>
            )}
          </div>
          <div style={{ fontSize: 20, fontWeight: 600, marginBottom: 4 }}>{profile.fullName}</div>
          <div style={{ color: '#6b7280', marginBottom: 8 }}>{profile.email}</div>
          <div style={{ color: '#6b7280' }}>{profile.occupation}</div>
        </div>

        {/* Member Since */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px' }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: '#eef2ff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 24,
            color: '#6366f1',
            marginBottom: 16
          }}>
            📅
          </div>
          <div style={{ color: '#6b7280', marginBottom: 4 }}>Member Since</div>
          <div style={{ fontSize: 18, fontWeight: 600, color: '#6366f1' }}>{memberSince}</div>
        </div>

        {/* Age */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px' }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: '#faf5ff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 24,
            color: '#9333ea',
            marginBottom: 16
          }}>
            🎂
          </div>
          <div style={{ color: '#6b7280', marginBottom: 4 }}>Age</div>
          <div style={{ fontSize: 18, fontWeight: 600, color: '#9333ea' }}>
            {calculateAge(profile.dateOfBirth)} years
          </div>
        </div>
      </div>

      {/* Personal Information */}
      <div className="card">
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 24 }}>Personal Information</h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
          {/* Full Name */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 8,
              background: '#eef2ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20,
              color: '#6366f1',
              flexShrink: 0
            }}>
              👤
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 6, color: '#111827' }}>Full Name</label>
              <input
                type="text"
                value={profile.fullName}
                onChange={e => handleChange('fullName', e.target.value)}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: '6px' }}
              />
              <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>Contact support to change your name</div>
            </div>
          </div>

          {/* Email */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 8,
              background: '#fee2e2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20,
              color: '#dc2626',
              flexShrink: 0
            }}>
              ✉️
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 6, color: '#111827' }}>Email</label>
              <input
                type="email"
                value={profile.email}
                onChange={e => handleChange('email', e.target.value)}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: '6px' }}
                disabled
              />
              <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>Contact support to change your email</div>
            </div>
          </div>

          {/* Occupation */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 8,
              background: '#dbeafe',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20,
              color: '#0284c7',
              flexShrink: 0
            }}>
              💼
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 6, color: '#111827' }}>Occupation</label>
              <input
                type="text"
                value={profile.occupation}
                onChange={e => handleChange('occupation', e.target.value)}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: '6px' }}
              />
            </div>
          </div>

          {/* Phone Number */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 8,
              background: '#dcfce7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20,
              color: '#16a34a',
              flexShrink: 0
            }}>
              📱
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 6, color: '#111827' }}>Phone Number</label>
              <input
                type="tel"
                value={profile.phoneNumber}
                onChange={e => handleChange('phoneNumber', e.target.value)}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: '6px' }}
              />
            </div>
          </div>

          {/* Address */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', gridColumn: '1 / -1' }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 8,
              background: '#fef3c7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20,
              color: '#d97706',
              flexShrink: 0
            }}>
              📍
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 6, color: '#111827' }}>Address</label>
              <input
                type="text"
                value={profile.address}
                onChange={e => handleChange('address', e.target.value)}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: '6px' }}
              />
            </div>
          </div>

          {/* Date of Birth */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 8,
              background: '#f3e8ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20,
              color: '#9333ea',
              flexShrink: 0
            }}>
              📅
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 6, color: '#111827' }}>Date of Birth</label>
              <input
                type="date"
                value={profile.dateOfBirth}
                onChange={e => handleChange('dateOfBirth', e.target.value)}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: '6px' }}
              />
              <div style={{ fontSize: 14, color: '#6366f1', marginTop: 4 }}>
                You are {calculateAge(profile.dateOfBirth)} years old
              </div>
            </div>
          </div>

          {/* Bio */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', gridColumn: '1 / -1' }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 8,
              background: '#f5f3ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20,
              color: '#7c3aed',
              flexShrink: 0,
              marginTop: 0
            }}>
              ✍️
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 6, color: '#111827' }}>Bio</label>
              <textarea
                value={profile.bio}
                onChange={e => handleChange('bio', e.target.value)}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: '6px', minHeight: 100 }}
              />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button 
            onClick={handleSave}
            className="btn"
            style={{ padding: '12px 24px', fontSize: 15 }}
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
          <button 
            onClick={logout}
            className="btn-secondary"
            style={{ padding: '12px 24px', fontSize: 15 }}
            disabled={loading}
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
