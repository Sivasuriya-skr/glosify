import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function Sidebar(){
  const { user, logout } = useAuth();
  const { isDarkMode } = useTheme();
  const nav = useNavigate();
  const [isExpanded, setIsExpanded] = useState(true);
  
  const doLogout = ()=>{
    logout();
    nav('/login');
  };

  const subtitleColor = isDarkMode ? '#94a3b8' : '#6b7280';
  const textColor = isDarkMode ? '#cbd5e1' : '#374151';
  const borderColor = isDarkMode ? '#334155' : '#e5e7eb';

  return (
    <aside className={`sidebar ${isExpanded ? 'expanded' : 'collapsed'}`}>
      <div>
        <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24}}>
          <div className="logo">
            <div className="app-icon">B</div>
            {isExpanded && (
              <div>
                <div style={{fontWeight:700, color: isDarkMode ? '#f1f5f9' : '#111827'}}>BudgetWise</div>
                <div style={{fontSize:12, color: subtitleColor}}>AI Financial Advisor</div>
              </div>
            )}
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '20px',
              cursor: 'pointer',
              padding: '4px 8px',
              color: isDarkMode ? '#cbd5e1' : '#374151',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              justifyContent: 'center',
              alignItems: 'center'
            }}
            title={isExpanded ? 'Collapse' : 'Expand'}
          >
            <span style={{width: '20px', height: '2px', background: 'currentColor', borderRadius: '1px'}}></span>
            <span style={{width: '20px', height: '2px', background: 'currentColor', borderRadius: '1px'}}></span>
            <span style={{width: '20px', height: '2px', background: 'currentColor', borderRadius: '1px'}}></span>
          </button>
        </div>
        
        <nav className="nav">
          <NavLink to="/home" className={({isActive})=>isActive? 'active':''}>
            <span style={{display:'flex', gap:8, alignItems:'center'}}>
              <span style={{width:20, display:'inline-flex'}}>🏠</span>
              {isExpanded && 'Home'}
            </span>
          </NavLink>
          <NavLink to="/dashboard" className={({isActive})=>isActive? 'active':''}>
            <span style={{display:'flex', gap:8, alignItems:'center'}}>
              <span style={{width:20, display:'inline-flex'}}>📊</span>
              {isExpanded && 'Dashboard'}
            </span>
          </NavLink>
          <NavLink to="/transactions" className={({isActive})=>isActive? 'active':''}>
            <span style={{display:'flex', gap:8, alignItems:'center'}}>
              <span style={{width:20, display:'inline-flex'}}>💳</span>
              {isExpanded && 'Transactions'}
            </span>
          </NavLink>
          <NavLink to="/budgets" className={({isActive})=>isActive? 'active':''}>
            <span style={{display:'flex', gap:8, alignItems:'center'}}>
              <span style={{width:20, display:'inline-flex'}}>💰</span>
              {isExpanded && 'Budgets'}
            </span>
          </NavLink>
          <NavLink to="/goals" className={({isActive})=>isActive? 'active':''}>
            <span style={{display:'flex', gap:8, alignItems:'center'}}>
              <span style={{width:20, display:'inline-flex'}}>🎯</span>
              {isExpanded && 'Goals'}
            </span>
          </NavLink>
          <NavLink to="/analytics" className={({isActive})=>isActive? 'active':''}>
            <span style={{display:'flex', gap:8, alignItems:'center'}}>
              <span style={{width:20, display:'inline-flex'}}>📈</span>
              {isExpanded && 'Analytics'}
            </span>
          </NavLink>
          <NavLink to="/ai-insights" className={({isActive})=>isActive? 'active':''}>
            <span style={{display:'flex', gap:8, alignItems:'center'}}>
              <span style={{width:20, display:'inline-flex'}}>🤖</span>
              {isExpanded && 'AI Insights'}
            </span>
          </NavLink>
          <NavLink to="/export" className={({isActive})=>isActive? 'active':''}>
            <span style={{display:'flex', gap:8, alignItems:'center'}}>
              <span style={{width:20, display:'inline-flex'}}>📤</span>
              {isExpanded && 'Export'}
            </span>
          </NavLink>
          <NavLink to="/community" className={({isActive})=>isActive? 'active':''}>
            <span style={{display:'flex', gap:8, alignItems:'center'}}>
              <span style={{width:20, display:'inline-flex'}}>💬</span>
              {isExpanded && 'Community'}
            </span>
          </NavLink>
          <NavLink to="/profile" className={({isActive})=>isActive? 'active':''}>
            <span style={{display:'flex', gap:8, alignItems:'center'}}>
              <span style={{width:20, display:'inline-flex'}}>👤</span>
              {isExpanded && 'Profile'}
            </span>
          </NavLink>
          <NavLink to="/settings" className={({isActive})=>isActive? 'active':''}>
            <span style={{display:'flex', gap:8, alignItems:'center'}}>
              <span style={{width:20, display:'inline-flex'}}>⚙️</span>
              {isExpanded && 'Settings'}
            </span>
          </NavLink>
        </nav>
      </div>

      <div>
        <button onClick={doLogout} className="btn secondary" style={{width:'100%', marginBottom:12}}>
          {isExpanded ? 'Logout' : '🚪'}
        </button>
        {isExpanded && (
          <div className="sidebar-bottom" style={{borderTopColor: borderColor}}>
            <div className="avatar">{user && user.username ? user.username[0].toUpperCase() : 'U'}</div>
            <div style={{fontSize:14, color: textColor}}>{user?.username}<div style={{fontSize:12, color: subtitleColor}}>{user?.email}</div></div>
          </div>
        )}
      </div>
    </aside>
  );
}
