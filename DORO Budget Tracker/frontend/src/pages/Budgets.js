import React, { useEffect, useState, useContext } from 'react';
import axios from '../api/axios';
import { TransactionContext } from '../context/TransactionContext';
import { useTheme } from '../context/ThemeContext';
import '../styles/Budgets.css';

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

export default function Budgets(){
  const { isDarkMode } = useTheme();
  const { transactions: globalTransactions } = useContext(TransactionContext);
  const [budgets, setBudgets] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [form, setForm] = useState({ category:'', amount:'' });
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  useEffect(()=>{ load(); },[]);
  
  // Auto-refresh budgets when global transactions change
  useEffect(() => {
    if (globalTransactions && globalTransactions.length > 0) {
      load();
    }
  }, [globalTransactions]);
  
  const load = async ()=>{ 
    try {
      setLoading(true);
      // Load budgets from backend API
      const budgetsResponse = await axios.get('/api/budgets');
      const budgetsList = budgetsResponse.data || [];
      
      // Load transactions from backend API
      let transactionsList = [];
      try {
        const response = await axios.get('/api/transactions');
        transactionsList = response.data || [];
      } catch (err) {
        console.error('Error loading transactions:', err);
      }
      
      // Calculate spent amount for each budget from ALL transactions
      const budgetsWithSpent = budgetsList.map(budget => {
        // Sum ALL transactions matching this budget category
        const budgetSpent = transactionsList
          .filter(t => {
            // Match transactions to budget by category (case-insensitive)
            const matchesCategory = t.category && t.category.toLowerCase() === budget.category.toLowerCase();
            // Only count expenses
            const isExpense = (t.type === 'expense' || t.type === 'Expense');
            return matchesCategory && isExpense;
          })
          .reduce((sum, t) => {
            const amount = parseFloat(t.amount) || 0;
            return sum + amount;
          }, 0);
        
        return {
          ...budget,
          spent: budgetSpent,
          // Map backend field names to UI field names
          name: budget.category,
          limit: budget.amount
        };
      });
      
      setBudgets(budgetsWithSpent);
      setTransactions(transactionsList);
    } catch (error) {
      console.error('Error loading budgets and transactions:', error);
      setMessage({ type: 'error', text: 'Failed to load budgets. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (budget = null) => {
    const today = new Date().toISOString().split('T')[0];
    const futureDate = new Date(new Date().getTime() + 30*24*60*60*1000).toISOString().split('T')[0];
    
    if (budget) {
      setEditing(budget.id);
      setForm({ 
        category: budget.name, 
        amount: budget.limit.toString(),
        startDate: today,
        endDate: futureDate
      });
    } else {
      setEditing(null);
      setForm({ 
        category: '', 
        amount: '',
        startDate: today,
        endDate: futureDate
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setForm({ category: '', amount: '', startDate: '', endDate: '' });
    setEditing(null);
  };

  const add = async (e)=>{ 
    e.preventDefault();
    if (!form.category.trim() || !form.amount) {
      setMessage({ type: 'error', text: 'Please fill all fields' });
      return;
    }
    setMessage({ type: '', text: '' });

    setLoading(true);
    try {
      if (editing) {
        // Update budget
        await axios.put(`/api/budgets/${editing}`, {
          category: form.category,
          amount: Number(form.amount),
          startDate: form.startDate,
          endDate: form.endDate
        });
        setMessage({ type: 'success', text: 'Budget updated successfully!' });
      } else {
        // Create new budget
        await axios.post('/api/budgets', {
          category: form.category,
          amount: Number(form.amount),
          startDate: form.startDate,
          endDate: form.endDate
        });
        setMessage({ type: 'success', text: 'Budget created successfully!' });
      }
      setForm({category:'', amount:'', startDate: '', endDate: ''}); 
      handleCloseModal();
      load();  // Reload to recalculate spent amounts from transactions
    } catch (error) {
      console.error('Error saving budget:', error);
      setMessage({ type: 'error', text: getErrorMessage(error, 'Unable to save budget. Please try again.') });
    } finally {
      setLoading(false);
    }
  };

  const remove = async (id) => {
    if (window.confirm('Are you sure you want to delete this budget?')) {
      try {
        await axios.delete(`/api/budgets/${id}`);
        setMessage({ type: 'success', text: 'Budget deleted successfully!' });
        load();
      } catch (error) {
        console.error('Error deleting budget:', error);
        setMessage({ type: 'error', text: getErrorMessage(error, 'Unable to delete budget. Please try again.') });
      }
    }
  };

  const getProgressColor = (spent, limit) => {
    const percentage = (spent/limit) * 100;
    if(percentage > 90) return '#ef4444';  // red
    if(percentage > 75) return '#f97316'; // orange
    return '#2563eb'; // blue
  };

  return (
    <div className="budgets-page">
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
      <div
        className="page-title-card"
        style={{
          background: isDarkMode 
            ? 'linear-gradient(135deg, #2e1065 0%, #3b0764 25%, #4c1d95 50%, #5b21b6 75%, #6d28d9 100%)'
            : 'linear-gradient(135deg, #e9d5ff 0%, #d8b4fe 25%, #c4b5fd 50%, #a78bfa 75%, #8b5cf6 100%)',
          boxShadow: isDarkMode 
            ? '0 10px 40px rgba(91, 33, 182, 0.3), 0 0 60px rgba(139, 92, 246, 0.1)'
            : '0 8px 32px rgba(139, 92, 246, 0.2), 0 0 60px rgba(167, 139, 250, 0.15)'
        }}
      >
        {/* Animated Glowing Orbs */}
        <div
          style={{
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
          }}
        />
        <div
          style={{
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
          }}
        />
        <div
          style={{
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
          }}
        />
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

        <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1
              style={{
                margin: '0 0 6px 0',
                fontSize: '28px',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span style={{
                background: isDarkMode 
                  ? 'linear-gradient(135deg, #ffffff 0%, #e9d5ff 50%, #d8b4fe 100%)'
                  : 'linear-gradient(135deg, #581c87 0%, #6b21a8 50%, #7c3aed 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>Budget Manager</span>
              <span style={{ WebkitTextFillColor: 'initial' }}>💰</span>
            </h1>
            <p
              style={{
                color: isDarkMode ? 'rgba(255,255,255,0.85)' : 'rgba(88, 28, 135, 0.8)',
                margin: 0,
                fontSize: '15px',
                fontWeight: '500'
              }}
            >
              Set spending limits and track your budget
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              onClick={() => load()}
              style={{
                background: isDarkMode ? '#334155' : '#ffffff',
                color: isDarkMode ? '#e2e8f0' : '#1e293b',
                border: isDarkMode ? '1px solid #475569' : '1px solid #e2e8f0',
                padding: '10px 20px',
                borderRadius: '10px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '14px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                transition: 'all 0.2s ease'
              }}
              title="Refresh all budget data from transactions"
            >
              ↻ Refresh
            </button>
            <button 
              onClick={() => handleOpenModal()}
              style={{
                background: isDarkMode ? '#334155' : '#ffffff',
                color: isDarkMode ? '#e2e8f0' : '#1e293b',
                border: isDarkMode ? '1px solid #475569' : '1px solid #e2e8f0',
                padding: '10px 20px',
                borderRadius: '10px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '14px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                transition: 'all 0.2s ease'
              }}
            >
              + Create Budget
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.1); }
        }
      `}</style>

      {/* Monthly Budget Overview */}
      {budgets.length > 0 && (
        <div className="budget-overview-card">
          <div className="budget-overview-header">
            <div>
              <h3 className="budget-title">Month budget</h3>
              <p className="budget-date">Nov 1 - Nov 30, 2025</p>
            </div>
            <div className="budget-amount">
              <div className="total-spent">
                <div className="label">Spent</div>
                <div className="amount">
                  ₹{budgets.reduce((sum, b) => sum + (b.spent || 0), 0).toFixed(2)}
                </div>
              </div>
              <div className="total-limit">
                <div className="label">Total Budget</div>
                <div className="amount">
                  ₹{budgets.reduce((sum, b) => sum + b.limit, 0).toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          <div className="progress-bar-container">
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{
                  width: `${Math.min(100, (budgets.reduce((sum, b) => sum + (b.spent || 0), 0) / budgets.reduce((sum, b) => sum + b.limit, 0)) * 100)}%`,
                  backgroundColor: getProgressColor(
                    budgets.reduce((sum, b) => sum + (b.spent || 0), 0),
                    budgets.reduce((sum, b) => sum + b.limit, 0)
                  )
                }}
              />
            </div>
            <div className="progress-text">
              {((budgets.reduce((sum, b) => sum + (b.spent || 0), 0) / budgets.reduce((sum, b) => sum + b.limit, 0)) * 100).toFixed(1)}% used
            </div>
          </div>
        </div>
      )}

      {/* Budget List */}
      <div className="budgets-list-container">
        {budgets.length > 0 ? (
          budgets.map(b => {
            const percentage = ((b.spent || 0) / (b.limit || 1)) * 100;
            const remaining = b.limit - (b.spent || 0);
            const progressColor = getProgressColor(b.spent || 0, b.limit);
            
            return (
              <div key={b.id} className="budget-card">
                <div className="budget-card-header">
                  <div className="budget-info">
                    <h4 className="budget-card-title">{b.name}</h4>
                    <p className="budget-card-period">November 2025</p>
                  </div>
                  <div className="budget-card-actions">
                    <button 
                      className="action-btn edit-btn"
                      onClick={() => handleOpenModal(b)}
                      title="Edit"
                    >
                      ✏️
                    </button>
                    <button 
                      className="action-btn delete-btn"
                      onClick={() => remove(b.id)}
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                <div className="budget-stats">
                  <div className="stat">
                    <span className="stat-label">Spent</span>
                    <span className="stat-value spent">₹{(b.spent || 0).toFixed(2)}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Remaining</span>
                    <span className="stat-value remaining" style={{color: remaining > 0 ? '#10b981' : '#ef4444'}}>
                      ₹{remaining.toFixed(2)}
                    </span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Total Limit</span>
                    <span className="stat-value limit">₹{b.limit.toFixed(2)}</span>
                  </div>
                </div>

                <div className="budget-progress">
                  <div className="progress-bar-small">
                    <div 
                      className="progress-fill-small"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: progressColor
                      }}
                    />
                  </div>
                  <div className="progress-label">
                    <span>{percentage.toFixed(1)}% used</span>
                    <span style={{color: percentage > 90 ? '#ef4444' : '#6b7280'}}>
                      {percentage > 90 ? '⚠️ Over limit!' : 'On track'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="empty-state">
            <div className="empty-icon">📊</div>
            <p className="empty-text">No budgets yet</p>
            <p className="empty-subtext">Create your first budget to start tracking expenses</p>
            <button className="empty-btn" onClick={() => handleOpenModal()}>
              Create Budget
            </button>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editing ? 'Edit Budget' : 'Create Budget'}</h2>
              <button className="close-btn" onClick={handleCloseModal}>✕</button>
            </div>

            <form onSubmit={add} className="budget-form">
              <div className="form-group">
                <label>Category</label>
                <input 
                  type="text"
                  placeholder="e.g., Groceries, Utilities, Entertainment"
                  value={form.category} 
                  onChange={e => setForm({...form, category: e.target.value})} 
                  required 
                />
              </div>

              <div className="form-group">
                <label>Monthly Budget Limit</label>
                <input 
                  type="number" 
                  placeholder="₹0.00"
                  value={form.amount} 
                  onChange={e => setForm({...form, amount: e.target.value})} 
                  step="0.01"
                  required 
                />
              </div>

              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={handleCloseModal}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Saving...' : (editing ? 'Update Budget' : 'Create Budget')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
