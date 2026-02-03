import React, { useState } from 'react';
import axios from '../api/axios';
import { useTheme } from '../context/ThemeContext';
import '../styles/Export.css';

// Helper function to convert error responses into user-friendly messages
const getErrorMessage = (error) => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.response?.status === 400) {
    return 'Invalid file format. Please use CSV, JSON, or PDF files.';
  }
  if (error.response?.status === 401) {
    return 'Your session has expired. Please log in again.';
  }
  if (error.response?.status === 403) {
    return 'You do not have permission to perform this action.';
  }
  if (error.response?.status === 500) {
    return 'Something went wrong on our end. Please try again later.';
  }
  if (error.message === 'Network Error') {
    return 'Unable to connect. Please check your internet connection.';
  }
  return 'An unexpected error occurred. Please try again.';
};

export default function Export() {
  const { isDarkMode } = useTheme();
  const [loading, setLoading] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportType, setExportType] = useState('');
  const [selectedSections, setSelectedSections] = useState([]);
  const [importLoading, setImportLoading] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importSections, setImportSections] = useState({
    transactions: true,
    budgets: true,
    goals: true
  });
  const [message, setMessage] = useState({ type: '', text: '' });
  const fileInputRef = React.useRef(null);
  
  // Theme colors
  const textColor = isDarkMode ? '#e0e7ff' : '#1f2937';
  const secondaryTextColor = isDarkMode ? '#a0aec0' : '#6b7280';
  const bgColor = isDarkMode ? '#1e1b4b' : 'transparent';
  const cardBg = isDarkMode ? '#2d2a45' : 'rgba(255, 255, 255, 0.4)';

  const exportSections = [
    { id: 'dashboard', name: 'Dashboard Summary', icon: '📊' },
    { id: 'transactions', name: 'Transactions', icon: '💳' },
    { id: 'budgets', name: 'Budgets', icon: '💰' },
    { id: 'goals', name: 'Goals', icon: '🎯' },
    { id: 'ai-insights', name: 'AI Financial Insights', icon: '🤖' },
    { id: 'all', name: 'Complete Report', icon: '📋' }
  ];

  const handleExportPDF = () => {
    setExportType('pdf');
    setShowExportModal(true);
  };

  const handleExportCSV = () => {
    setExportType('csv');
    setShowExportModal(true);
  };

  const handleSectionToggle = (sectionId) => {
    if (sectionId === 'all') {
      setSelectedSections(['all']);
    } else {
      setSelectedSections(prev => {
        const filtered = prev.filter(id => id !== 'all');
        if (filtered.includes(sectionId)) {
          return filtered.filter(id => id !== sectionId);
        } else {
          return [...filtered, sectionId];
        }
      });
    }
  };

  const handleGoogleDriveBackup = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/export/pdf?sections=all', {
        responseType: 'blob'
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const fileName = `budgetwise-backup-${new Date().toISOString().split('T')[0]}.pdf`;
      const driveUrl = 'https://drive.google.com/drive/my-drive';
      window.open(driveUrl, '_blank');
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      setMessage({ type: 'success', text: 'Backup file downloaded! Please upload it to your Google Drive manually.' });
    } catch (error) {
      console.error('Error creating backup:', error);
      setMessage({ type: 'error', text: getErrorMessage(error) });
    } finally {
      setLoading(false);
    }
  };

  const handleDropboxBackup = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/export/pdf?sections=all', {
        responseType: 'blob'
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const fileName = `budgetwise-backup-${new Date().toISOString().split('T')[0]}.pdf`;
      const dropboxUrl = 'https://www.dropbox.com/home';
      window.open(dropboxUrl, '_blank');
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      setMessage({ type: 'success', text: 'Backup file downloaded! Please upload it to your Dropbox manually.' });
    } catch (error) {
      console.error('Error creating backup:', error);
      setMessage({ type: 'error', text: getErrorMessage(error) });
    } finally {
      setLoading(false);
    }
  };

  const executeExport = async () => {
    if (selectedSections.length === 0) {
      setMessage({ type: 'error', text: 'Please select at least one section to export' });
      return;
    }
    try {
      setMessage({ type: '', text: '' });
      setLoading(true);
      const sections = selectedSections.join(',');
      if (exportType === 'pdf') {
        const response = await axios.get(`/api/export/pdf?sections=${sections}`, {
          responseType: 'blob'
        });
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `financial-report-${sections}-${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        const response = await axios.get(`/api/export/csv?sections=${sections}`);
        const blob = new Blob([response.data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `financial-data-${sections}-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }
      setShowExportModal(false);
      setSelectedSections([]);
      setMessage({ type: 'success', text: 'Data exported successfully!' });
    } catch (error) {
      console.error('Error exporting:', error);
      setMessage({ type: 'error', text: getErrorMessage(error) });
    } finally {
      setLoading(false);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportFile(file);
    setShowImportModal(true);
  };

  const handleImportSectionToggle = (section) => {
    setImportSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const executeImport = async () => {
    if (!importFile) {
      setMessage({ type: 'error', text: 'Please select a file to import' });
      return;
    }

    const hasSelectedSection = Object.values(importSections).some(val => val);
    if (!hasSelectedSection) {
      setMessage({ type: 'error', text: 'Please select at least one data type to import' });
      return;
    }

    try {
      setImportLoading(true);
      setMessage({ type: '', text: '' });
      const formData = new FormData();
      formData.append('file', importFile);
      formData.append('options', JSON.stringify(importSections));

      const response = await axios.post('/api/export/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setMessage({ type: 'success', text: 'Import successful! Your data has been imported.' });
      setShowImportModal(false);
      setImportFile(null);
      setImportSections({
        transactions: true,
        budgets: true,
        goals: true
      });
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error importing:', error);
      setMessage({ type: 'error', text: getErrorMessage(error) });
    } finally {
      setImportLoading(false);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1600px', margin: '0 auto' }}>
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
            }}>Export Data</span>
            <span style={{ WebkitTextFillColor: 'initial' }}>📊</span>
          </h1>
          <p style={{ color: isDarkMode ? 'rgba(255,255,255,0.85)' : 'rgba(88, 28, 135, 0.8)', fontSize: '15px', margin: 0, fontWeight: '500' }}>Download your financial data in various formats</p>
        </div>
      </div>
      <div style={{ display: 'grid', gap: '24px', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
        {/* PDF Export */}
        <div className="insight-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ fontSize: '32px' }}>📄</div>
            <h3 style={{ color: textColor, margin: 0 }}>PDF Report</h3>
          </div>
          <p style={{ color: secondaryTextColor, marginBottom: '20px', lineHeight: '1.6' }}>
            Export your complete financial summary as a professional PDF report with charts and analysis.
          </p>
          <button
            onClick={handleExportPDF}
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px 24px',
              background: loading ? '#6b7280' : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: '600',
              fontSize: '14px'
            }}
          >
            {loading ? 'Generating...' : '📄 Download PDF'}
          </button>
        </div>
        {/* CSV Export */}
        <div className="insight-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ fontSize: '32px' }}>📊</div>
            <h3 style={{ color: textColor, margin: 0 }}>CSV Data</h3>
          </div>
          <p style={{ color: secondaryTextColor, marginBottom: '20px', lineHeight: '1.6' }}>
            Export raw transaction data in CSV format for use in Excel, Google Sheets, or other tools.
          </p>
          <button
            onClick={handleExportCSV}
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px 24px',
              background: loading ? '#6b7280' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: '600',
              fontSize: '14px'
            }}
          >
            {loading ? 'Generating...' : '📊 Download CSV'}
          </button>
        </div>
      </div>
      {/* Backup Section */}
      <div className="insight-card" style={{ padding: '24px', marginTop: '24px' }}>
        <h3 style={{ color: textColor, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          ☁️ Cloud Backup
        </h3>
        <p style={{ color: secondaryTextColor, marginBottom: '20px' }}>
          Backup your financial data to cloud storage services.
        </p>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button
            style={{
              padding: '10px 20px',
              background: '#4285f4',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '14px'
            }}
            onClick={handleGoogleDriveBackup}
          >
            📁 Google Drive
          </button>
          <button
            style={{
              padding: '10px 20px',
              background: '#0061ff',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '14px'
            }}
            onClick={handleDropboxBackup}
          >
            📦 Dropbox
          </button>
        </div>
      </div>

      {/* Import Data Section */}
      <div className="insight-card" style={{ padding: '24px', marginTop: '24px' }}>
        <h3 style={{ color: textColor, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          📥 Import Data
        </h3>
        <p style={{ color: secondaryTextColor, marginBottom: '20px' }}>
          Import your financial data from previously exported files.
        </p>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.json,.pdf"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
          <button
            onClick={handleImportClick}
            disabled={importLoading}
            style={{
              padding: '12px 24px',
              background: importLoading ? '#6b7280' : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: importLoading ? 'not-allowed' : 'pointer',
              fontWeight: '600',
              fontSize: '14px'
            }}
          >
            {importLoading ? '⏳ Importing...' : '📤 Choose File to Import'}
          </button>
          <span style={{ color: secondaryTextColor, fontSize: '14px' }}>
            Supported formats: CSV, JSON, PDF
          </span>
        </div>
      </div>

      {/* Export Selection Modal */}
      {showExportModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: isDarkMode ? '#2d2a45' : 'rgba(255, 255, 255, 0.95)',
            padding: '32px',
            borderRadius: '12px',
            width: '90%',
            maxWidth: '500px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{ color: textColor, marginBottom: '20px', fontSize: '20px' }}>
              📊 Select Sections to Export ({exportType.toUpperCase()})
            </h3>
            <div style={{ marginBottom: '24px' }}>
              {exportSections.map(section => (
                <div key={section.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px',
                  borderRadius: '8px',
                  border: `1px solid ${isDarkMode ? '#4d4a6f' : '#e5e7eb'}`,
                  marginBottom: '8px',
                  cursor: 'pointer',
                  background: selectedSections.includes(section.id) ? (isDarkMode ? '#3d3a5f' : '#eff6ff') : (isDarkMode ? '#2d2a45' : 'white')
                }} onClick={() => handleSectionToggle(section.id)}>
                  <input
                    type="checkbox"
                    checked={selectedSections.includes(section.id)}
                    onChange={() => handleSectionToggle(section.id)}
                    style={{ cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '20px' }}>{section.icon}</span>
                  <span style={{ color: textColor, fontWeight: '500' }}>{section.name}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowExportModal(false);
                  setSelectedSections([]);
                }}
                style={{
                  padding: '10px 20px',
                  background: isDarkMode ? '#4d4a6f' : '#e5e7eb',
                  color: isDarkMode ? '#e0e7ff' : '#374151',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                Cancel
              </button>
              <button
                onClick={executeExport}
                disabled={loading || selectedSections.length === 0}
                style={{
                  padding: '10px 20px',
                  background: selectedSections.length === 0 ? '#9ca3af' : '#2563eb',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: selectedSections.length === 0 ? 'not-allowed' : 'pointer',
                  fontWeight: '600'
                }}
              >
                {loading ? 'Exporting...' : `Export ${exportType.toUpperCase()}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Selection Modal */}
      {showImportModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: isDarkMode ? '#2d2a45' : 'rgba(255, 255, 255, 0.95)',
            padding: '32px',
            borderRadius: '12px',
            width: '90%',
            maxWidth: '500px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{ color: textColor, marginBottom: '12px', fontSize: '20px' }}>
              📥 Import Data
            </h3>
            {importFile && (
              <p style={{ color: secondaryTextColor, marginBottom: '20px', fontSize: '14px' }}>
                File: <strong style={{ color: textColor }}>{importFile.name}</strong>
              </p>
            )}
            <p style={{ color: secondaryTextColor, marginBottom: '24px', fontSize: '14px' }}>
              Select which data types you want to import:
            </p>
            <div style={{ marginBottom: '24px' }}>
              {[
                { id: 'transactions', icon: '💳', name: 'Transactions' },
                { id: 'budgets', icon: '📋', name: 'Budgets' },
                { id: 'goals', icon: '🎯', name: 'Financial Goals' }
              ].map(section => (
                <div key={section.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px',
                  borderRadius: '8px',
                  border: `1px solid ${isDarkMode ? '#4d4a6f' : '#e5e7eb'}`,
                  marginBottom: '8px',
                  cursor: 'pointer',
                  background: importSections[section.id] ? (isDarkMode ? '#3d3a5f' : '#eff6ff') : (isDarkMode ? '#2d2a45' : 'white')
                }} onClick={() => handleImportSectionToggle(section.id)}>
                  <input
                    type="checkbox"
                    checked={importSections[section.id]}
                    onChange={() => handleImportSectionToggle(section.id)}
                    style={{ cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '20px' }}>{section.icon}</span>
                  <span style={{ color: textColor, fontWeight: '500' }}>{section.name}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setImportFile(null);
                  setImportSections({
                    transactions: true,
                    budgets: true,
                    goals: true
                  });
                }}
                style={{
                  padding: '10px 20px',
                  background: isDarkMode ? '#4d4a6f' : '#e5e7eb',
                  color: isDarkMode ? '#e0e7ff' : '#374151',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                Cancel
              </button>
              <button
                onClick={executeImport}
                disabled={importLoading || !Object.values(importSections).some(val => val)}
                style={{
                  padding: '10px 20px',
                  background: !Object.values(importSections).some(val => val) ? '#9ca3af' : '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: !Object.values(importSections).some(val => val) ? 'not-allowed' : 'pointer',
                  fontWeight: '600'
                }}
              >
                {importLoading ? 'Importing...' : 'Import Data'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
