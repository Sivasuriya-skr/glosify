import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

const AIFloatingButton = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDarkMode } = useTheme();

  // Don't show on AI Insights page itself
  if (location.pathname === '/ai-insights') {
    return null;
  }

  const handleClick = () => {
    navigate('/ai-insights');
  };

  const buttonStyle = {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    background: isDarkMode 
      ? 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)' 
      : 'linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%)',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: isDarkMode 
      ? '0 4px 20px rgba(139, 92, 246, 0.4), 0 0 0 4px rgba(139, 92, 246, 0.1)' 
      : '0 4px 20px rgba(139, 92, 246, 0.3), 0 0 0 4px rgba(139, 92, 246, 0.1)',
    transition: 'all 0.3s ease',
    zIndex: 1000,
    animation: 'pulse 2s infinite',
  };

  const iconStyle = {
    fontSize: '28px',
    lineHeight: 1,
  };

  return (
    <>
      <style>
        {`
          @keyframes pulse {
            0% {
              box-shadow: 0 4px 20px rgba(139, 92, 246, 0.4), 0 0 0 0 rgba(139, 92, 246, 0.4);
            }
            70% {
              box-shadow: 0 4px 20px rgba(139, 92, 246, 0.4), 0 0 0 10px rgba(139, 92, 246, 0);
            }
            100% {
              box-shadow: 0 4px 20px rgba(139, 92, 246, 0.4), 0 0 0 0 rgba(139, 92, 246, 0);
            }
          }
          
          .ai-floating-btn:hover {
            transform: scale(1.1) !important;
            box-shadow: 0 6px 25px rgba(139, 92, 246, 0.5), 0 0 0 6px rgba(139, 92, 246, 0.15) !important;
          }
          
          .ai-floating-btn:active {
            transform: scale(0.95) !important;
          }
        `}
      </style>
      <button
        className="ai-floating-btn"
        style={buttonStyle}
        onClick={handleClick}
        title="AI Insights"
        aria-label="Go to AI Insights"
      >
        <span style={iconStyle}>🤖</span>
      </button>
    </>
  );
};

export default AIFloatingButton;
