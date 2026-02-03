import React, { useState, useEffect, useContext } from 'react';
import axios from '../api/axios';
import { TransactionContext } from '../context/TransactionContext';
import { useTheme } from '../context/ThemeContext';
import '../styles/Goals.css';

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

export default function Goals() {
  const { isDarkMode } = useTheme();
  const { transactions: globalTransactions } = useContext(TransactionContext);
  
  const [goals, setGoals] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [form, setForm] = useState({
    goalName: '',
    category: 'Home Purchase',
    targetAmount: '',
    currentAmount: '0',
    deadline: '',
    priority: 'Medium'
  });

  // Load goals from backend on mount
  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/goals');
      setGoals(response.data);
    } catch (error) {
      console.error('Error loading goals:', error);
      setMessage({ type: 'error', text: getErrorMessage(error, 'Unable to load your goals. Please refresh the page.') });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleAddGoal = () => {
    setForm({
      goalName: '',
      category: 'Home Purchase',
      targetAmount: '',
      currentAmount: '0',
      deadline: '',
      priority: 'Medium'
    });
    setEditingGoal(null);
    setShowModal(true);
  };

  const handleEditGoal = (goal) => {
    setForm({
      goalName: goal.goalName,
      category: goal.category,
      targetAmount: goal.targetAmount.toString(),
      currentAmount: goal.currentAmount.toString(),
      deadline: goal.deadline,
      priority: goal.priority
    });
    setEditingGoal(goal.id);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      if (!form.goalName.trim()) {
        setMessage({ type: 'error', text: 'Please enter a goal name' });
        setLoading(false);
        return;
      }

      if (!form.targetAmount || parseFloat(form.targetAmount) <= 0) {
        setMessage({ type: 'error', text: 'Please enter a valid target amount' });
        setLoading(false);
        return;
      }

      if (!form.deadline) {
        setMessage({ type: 'error', text: 'Please select a deadline' });
        setLoading(false);
        return;
      }

      const goalData = {
        goalName: form.goalName,
        category: form.category,
        targetAmount: parseFloat(form.targetAmount),
        currentAmount: parseFloat(form.currentAmount) || 0,
        deadline: form.deadline,
        priority: form.priority
      };

      if (editingGoal) {
        // Update existing goal
        const response = await axios.put(`/api/goals/${editingGoal}`, goalData);
        setGoals(prev => prev.map(g => g.id === editingGoal ? response.data : g));
        setMessage({ type: 'success', text: 'Goal updated successfully!' });
      } else {
        // Create new goal
        const response = await axios.post('/api/goals', goalData);
        setGoals(prev => [...prev, response.data]);
        setMessage({ type: 'success', text: 'Goal created successfully!' });
      }

      closeModal();
    } catch (err) {
      console.error('Error saving goal:', err);
      setMessage({ type: 'error', text: getErrorMessage(err, 'Unable to save goal. Please try again.') });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGoal = async (id) => {
    if (window.confirm('Delete this goal?')) {
      try {
        await axios.delete(`/api/goals/${id}`);
        setGoals(prev => prev.filter(g => g.id !== id));
        setMessage({ type: 'success', text: 'Goal deleted successfully!' });
      } catch (err) {
        console.error('Error deleting goal:', err);
        setMessage({ type: 'error', text: getErrorMessage(err, 'Unable to delete goal. Please try again.') });
      }
    }
  };

  const handleUpdateProgress = async (id, newAmount) => {
    try {
      const goal = goals.find(g => g.id === id);
      const response = await axios.put(`/api/goals/${id}`, {
        ...goal,
        currentAmount: newAmount
      });
      setGoals(prev => prev.map(g => g.id === id ? response.data : g));
    } catch (err) {
      console.error('Error updating progress:', err);
      setMessage({ type: 'error', text: getErrorMessage(err, 'Unable to update progress. Please try again.') });
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingGoal(null);
  };

  const calculateProgress = (goal) => {
    const progress = (goal.currentAmount / goal.targetAmount) * 100;
    return Math.min(progress, 100);
  };

  const calculateDaysRemaining = (deadline) => {
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const calculateAmountNeeded = (goal) => {
    return Math.max(goal.targetAmount - goal.currentAmount, 0);
  };

  const calculateMonthlyAmount = (goal) => {
    const daysRemaining = calculateDaysRemaining(goal.deadline);
    const monthsRemaining = Math.max(daysRemaining / 30, 1);
    return (calculateAmountNeeded(goal) / monthsRemaining).toFixed(2);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High':
        return { bg: '#fee2e2', text: '#dc2626' };
      case 'Medium':
        return { bg: '#fef3c7', text: '#d97706' };
      case 'Low':
        return { bg: '#dbeafe', text: '#0284c7' };
      default:
        return { bg: '#f3f4f6', text: '#6b7280' };
    }
  };

  const cardStyle = {
    background: isDarkMode ? '#1e293b' : '#ffffff',
    borderRadius: '8px',
    padding: '20px',
    boxShadow: isDarkMode ? '0 2px 6px rgba(0, 0, 0, 0.3)' : '0 2px 6px rgba(15, 23, 42, 0.06)',
    transition: 'background 0.3s'
  };

  const textColor = isDarkMode ? '#f1f5f9' : '#111827';
  const mutedColor = isDarkMode ? '#d3d7dcff' : '#0e0e0fff';
  const inputBg = isDarkMode ? '#0f172a' : '#ffffff';
  const inputBorder = isDarkMode ? '#334155' : '#e5e7eb';

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
              }}>Savings Goals</span>
              <span style={{ WebkitTextFillColor: 'initial' }}>🎯</span>
            </h1>
            <p
              style={{
                color: isDarkMode ? 'rgba(255,255,255,0.85)' : 'rgba(88, 28, 135, 0.8)',
                margin: 0,
                fontSize: '15px',
                fontWeight: '500'
              }}
            >
              Track your progress towards financial goals
            </p>
          </div>
          <button 
            onClick={handleAddGoal}
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
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <span>+</span> New Goal
          </button>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.1); }
        }
      `}</style>

      {/* Goals List or Empty State */}
      {goals.length === 0 ? (
        <div className="card" style={{ ...cardStyle, textAlign: 'center', padding: '48px 24px', maxWidth: 900, margin: '0 auto' }}>
          <div style={{
            width: 80,
            height: 80,
            margin: '0 auto 24px auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <svg viewBox="0 0 24 24" width="48" height="48" stroke={mutedColor} strokeWidth="1.5" fill="none">
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="4" />
              <line x1="12" y1="2" x2="12" y2="4" />
              <line x1="12" y1="20" x2="12" y2="22" />
              <line x1="22" y1="12" x2="20" y2="12" />
              <line x1="4" y1="12" x2="2" y2="12" />
            </svg>
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 500, marginBottom: 8, color: textColor }}>
            No savings goals yet
          </h2>
          <p style={{ color: mutedColor, marginBottom: 24 }}>
            Create your first goal to start saving!
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 20, maxWidth: 900, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 20, borderLeft: '4px solid', borderImage: 'linear-gradient(180deg, #8b5cf6, #ec4899) 1', paddingLeft: 24, background: isDarkMode ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(236, 72, 153, 0.08) 100%)' : 'linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, rgba(236, 72, 153, 0.05) 100%)', borderRadius: 12, padding: '20px', paddingLeft: 24 }}>
          {goals.map(goal => {
            const progress = calculateProgress(goal);
            const daysRemaining = calculateDaysRemaining(goal.deadline);
            const amountNeeded = calculateAmountNeeded(goal);
            const monthlyAmount = calculateMonthlyAmount(goal);
            const priorityColor = getPriorityColor(goal.priority);

            return (
              <div key={goal.id} style={{...cardStyle, cursor: 'pointer', transition: 'all 0.3s ease', transform: 'translateY(0)', boxShadow: isDarkMode ? '0 2px 6px rgba(0, 0, 0, 0.3)' : '0 2px 6px rgba(15, 23, 42, 0.06)'}} 
                   onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = isDarkMode ? '0 12px 24px rgba(139, 92, 246, 0.2)' : '0 12px 24px rgba(139, 92, 246, 0.15)'; }} 
                   onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = isDarkMode ? '0 2px 6px rgba(0, 0, 0, 0.3)' : '0 2px 6px rgba(15, 23, 42, 0.06)'; }}>
                {/* Goal Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 16 }}>
                  <div>
                    <h3 style={{ fontSize: 18, fontWeight: 600, margin: 0, color: textColor }}>{goal.goalName}</h3>
                    <div style={{ display: 'flex', gap: 12, marginTop: 8, alignItems: 'center' }}>
                      <span style={{ color: mutedColor, fontSize: 14 }}>{goal.category}</span>
                      <span 
                        style={{ 
                          background: priorityColor.bg, 
                          color: priorityColor.text, 
                          padding: '4px 12px', 
                          borderRadius: '4px',
                          fontSize: 12,
                          fontWeight: 500
                        }}
                      >
                        {goal.priority}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button 
                      onClick={() => handleEditGoal(goal)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: 18,
                        color: textColor
                      }}
                    >
                      ✏️
                    </button>
                    <button 
                      onClick={() => handleDeleteGoal(goal.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: 18,
                        color: '#dc2626'
                      }}
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ color: mutedColor, fontSize: 14 }}>Progress</span>
                    <span style={{ color: textColor, fontWeight: 600 }}>{progress.toFixed(1)}%</span>
                  </div>
                  <div style={{
                    width: '100%',
                    height: 8,
                    background: isDarkMode ? '#334155' : '#e5e7eb',
                    borderRadius: 4,
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${progress}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, #3b82f6, #2563eb)',
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                </div>

                {/* Goal Details Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                  <div>
                    <div style={{ color: mutedColor, fontSize: 12, marginBottom: 4 }}>Current Amount</div>
                    <div style={{ color: '#10b981', fontSize: 20, fontWeight: 600 }}>
                      ${parseFloat(goal.currentAmount).toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: mutedColor, fontSize: 12, marginBottom: 4 }}>Target Amount</div>
                    <div style={{ color: textColor, fontSize: 20, fontWeight: 600 }}>
                      ${parseFloat(goal.targetAmount).toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: mutedColor, fontSize: 12, marginBottom: 4 }}>Deadline</div>
                    <div style={{ color: textColor, fontSize: 14, fontWeight: 500 }}>
                      {new Date(goal.deadline).toLocaleDateString()}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: mutedColor, fontSize: 12, marginBottom: 4 }}>Days Remaining</div>
                    <div style={{ color: daysRemaining > 0 ? '#3b82f6' : '#dc2626', fontSize: 14, fontWeight: 500 }}>
                      {daysRemaining > 0 ? daysRemaining : 'Overdue'} days
                    </div>
                  </div>
                </div>

                {/* Recommendation */}
                {amountNeeded > 0 && daysRemaining > 0 && (
                  <div style={{
                    background: isDarkMode ? '#1e3a8a' : '#dbeafe',
                    color: isDarkMode ? '#93c5fd' : '#0284c7',
                    padding: 12,
                    borderRadius: 6,
                    fontSize: 14,
                    marginBottom: 16,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8
                  }}>
                    <span>💡</span>
                    <span>Save <strong>${monthlyAmount}/month</strong> to reach your goal</span>
                  </div>
                )}

                {/* Update Progress */}
                <div style={{ display: 'flex', gap: 12 }}>
                  <input 
                    type="number"
                    placeholder="Add amount"
                    min="0"
                    step="0.01"
                    id={`progress-${goal.id}`}
                    style={{
                      flex: 1,
                      padding: '10px 12px',
                      border: `1px solid ${inputBorder}`,
                      borderRadius: '6px',
                      background: inputBg,
                      color: textColor
                    }}
                  />
                  <button 
                    onClick={() => {
                      const input = document.getElementById(`progress-${goal.id}`);
                      const amount = parseFloat(input.value);
                      if (amount > 0) {
                        handleUpdateProgress(goal.id, goal.currentAmount + amount);
                        input.value = '';
                      }
                    }}
                    style={{
                      padding: '10px 20px',
                      background: '#2563eb',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: 500
                    }}
                  >
                    Update Progress
                  </button>
                </div>
              </div>
            );
          })}
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }} onClick={closeModal}>
          <div style={{
            background: isDarkMode ? '#1e293b' : '#ffffff',
            borderRadius: '8px',
            padding: '24px',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto'
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ margin: 0, color: textColor }}>
                {editingGoal ? 'Edit Goal' : 'Create New Goal'}
              </h2>
              <button 
                onClick={closeModal}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: 20,
                  cursor: 'pointer',
                  color: textColor
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 6, color: textColor }}>
                  Goal Name
                </label>
                <input 
                  type="text"
                  name="goalName"
                  value={form.goalName}
                  onChange={handleChange}
                  placeholder="e.g., Emergency Fund"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: `1px solid ${inputBorder}`,
                    borderRadius: '6px',
                    background: inputBg,
                    color: textColor
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 6, color: textColor }}>
                    Category
                  </label>
                  <select 
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: `1px solid ${inputBorder}`,
                      borderRadius: '6px',
                      background: inputBg,
                      color: textColor
                    }}
                  >
                    <option>Home Purchase</option>
                    <option>Emergency Fund</option>
                    <option>Vacation</option>
                    <option>Education</option>
                    <option>Vehicle</option>
                    <option>Other</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 6, color: textColor }}>
                    Priority
                  </label>
                  <select 
                    name="priority"
                    value={form.priority}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: `1px solid ${inputBorder}`,
                      borderRadius: '6px',
                      background: inputBg,
                      color: textColor
                    }}
                  >
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 6, color: textColor }}>
                    Target Amount ($)
                  </label>
                  <input 
                    type="number"
                    name="targetAmount"
                    value={form.targetAmount}
                    onChange={handleChange}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: `1px solid ${inputBorder}`,
                      borderRadius: '6px',
                      background: inputBg,
                      color: textColor
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 6, color: textColor }}>
                    Current Amount ($)
                  </label>
                  <input 
                    type="number"
                    name="currentAmount"
                    value={form.currentAmount}
                    onChange={handleChange}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: `1px solid ${inputBorder}`,
                      borderRadius: '6px',
                      background: inputBg,
                      color: textColor
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 6, color: textColor }}>
                  Deadline
                </label>
                <input 
                  type="date"
                  name="deadline"
                  value={form.deadline}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: `1px solid ${inputBorder}`,
                    borderRadius: '6px',
                    background: inputBg,
                    color: textColor
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <button 
                  type="button"
                  onClick={closeModal}
                  style={{
                    flex: 1,
                    padding: '10px 16px',
                    background: isDarkMode ? '#334155' : '#e5e7eb',
                    color: textColor,
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 500
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={loading}
                  style={{
                    flex: 1,
                    padding: '10px 16px',
                    background: '#2563eb',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 500,
                    opacity: loading ? 0.6 : 1
                  }}
                >
                  {loading ? 'Saving...' : editingGoal ? 'Update Goal' : 'Create Goal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}