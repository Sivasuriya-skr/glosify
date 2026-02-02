import React, { useEffect, useState, useMemo, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { TransactionContext } from '../context/TransactionContext';
import axios from '../api/axios';
import '../styles/Home.css';

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  const transactionContext = useContext(TransactionContext);
  
  const [currentTime, setCurrentTime] = useState(new Date());
  const [budgets, setBudgets] = useState([]);
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [dailyCheckIn, setDailyCheckIn] = useState({
    checkedIn: false,
    streak: 0,
    totalPoints: 0,
    lastCheckIn: null
  });
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [earnedPoints, setEarnedPoints] = useState(0);

  // Load check-in data from localStorage
  useEffect(() => {
    const savedCheckIn = localStorage.getItem('bw_daily_checkin');
    if (savedCheckIn) {
      const data = JSON.parse(savedCheckIn);
      const lastDate = new Date(data.lastCheckIn);
      const today = new Date();
      
      // Check if already checked in today
      const isToday = lastDate.toDateString() === today.toDateString();
      
      // Check if streak should reset (missed a day)
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const isYesterday = lastDate.toDateString() === yesterday.toDateString();
      
      setDailyCheckIn({
        checkedIn: isToday,
        streak: isToday || isYesterday ? data.streak : 0,
        totalPoints: data.totalPoints || 0,
        lastCheckIn: data.lastCheckIn
      });
    }
  }, []);

  // Load budgets and goals
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [budgetsRes, goalsRes] = await Promise.all([
          axios.get('/api/budgets').catch(() => ({ data: [] })),
          axios.get('/api/goals').catch(() => ({ data: [] }))
        ]);
        setBudgets(budgetsRes.data || []);
        setGoals(goalsRes.data || []);
      } catch (err) {
        console.error('Error loading data:', err);
      } finally {
        setLoading(false);
      }
    };
    
    // Also load transactions if context is available
    if (transactionContext?.loadTransactions) {
      transactionContext.loadTransactions();
    }
    
    loadData();
  }, [transactionContext]);

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Handle daily check-in
  const handleCheckIn = () => {
    if (dailyCheckIn.checkedIn) return;
    
    const newStreak = dailyCheckIn.streak + 1;
    // Bonus points for streaks: base 10 + streak bonus
    const basePoints = 10;
    const streakBonus = Math.min(newStreak * 5, 50); // Max 50 bonus points
    const points = basePoints + streakBonus;
    
    setEarnedPoints(points);
    setShowConfetti(true);
    setShowCheckInModal(true);
    
    const newCheckIn = {
      checkedIn: true,
      streak: newStreak,
      totalPoints: dailyCheckIn.totalPoints + points,
      lastCheckIn: new Date().toISOString()
    };
    
    setDailyCheckIn(newCheckIn);
    localStorage.setItem('bw_daily_checkin', JSON.stringify(newCheckIn));
    
    setTimeout(() => {
      setShowConfetti(false);
    }, 4000);
  };

  // Get greeting based on time
  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return '🌅 Good Morning';
    if (hour < 17) return '☀️ Good Afternoon';
    if (hour < 21) return '🌆 Good Evening';
    return '🌙 Good Night';
  };

  // Get streak emoji
  const getStreakEmoji = (streak) => {
    if (streak >= 30) return '👑';
    if (streak >= 14) return '💎';
    if (streak >= 7) return '🔥';
    if (streak >= 3) return '⭐';
    return '✨';
  };

  // Get rank based on total points
  const getRank = (points) => {
    if (points >= 1000) return { name: 'Diamond Saver', emoji: '💎', color: '#a78bfa' };
    if (points >= 500) return { name: 'Gold Budgeter', emoji: '🥇', color: '#f59e0b' };
    if (points >= 200) return { name: 'Silver Tracker', emoji: '🥈', color: '#94a3b8' };
    if (points >= 50) return { name: 'Bronze Starter', emoji: '🥉', color: '#cd7f32' };
    return { name: 'Newcomer', emoji: '🌱', color: '#10b981' };
  };

  const rank = getRank(dailyCheckIn.totalPoints);

  // Get transactions from context (use empty array if not available)
  const transactions = transactionContext?.transactions || [];

  // Calculate financial summary
  const financialSummary = useMemo(() => {
    const totalIncome = transactions
      .filter(t => t.type?.toLowerCase() === 'income')
      .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
    
    const totalExpenses = transactions
      .filter(t => t.type?.toLowerCase() === 'expense')
      .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
    
    const balance = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? ((balance / totalIncome) * 100).toFixed(1) : 0;
    
    // This month's data
    const now = new Date();
    const thisMonth = transactions.filter(t => {
      const txDate = new Date(t.date);
      return txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
    });
    
    const monthlyIncome = thisMonth
      .filter(t => t.type?.toLowerCase() === 'income')
      .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
    
    const monthlyExpenses = thisMonth
      .filter(t => t.type?.toLowerCase() === 'expense')
      .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

    return {
      totalIncome,
      totalExpenses,
      balance,
      savingsRate,
      monthlyIncome,
      monthlyExpenses,
      transactionCount: transactions.length
    };
  }, [transactions]);

  // Calculate budget status for health score
  const budgetStatus = useMemo(() => {
    return budgets.map(b => {
      const spent = transactions
        .filter(t => t.type?.toLowerCase() === 'expense' && t.category?.toLowerCase() === b.category?.toLowerCase())
        .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
      const percentage = b.amount > 0 ? (spent / b.amount) * 100 : 0;
      return { ...b, spent, percentage };
    });
  }, [budgets, transactions]);

  // Calculate goals progress for health score
  const goalsProgress = useMemo(() => {
    return goals.map(g => ({
      ...g,
      progress: g.targetAmount > 0 ? ((g.currentAmount / g.targetAmount) * 100) : 0
    }));
  }, [goals]);

  // Get financial health score
  const getHealthScore = () => {
    let score = 50; // Base score
    
    // Savings rate contribution (max 25 points)
    score += Math.min(parseFloat(financialSummary.savingsRate) * 0.5, 25);
    
    // Budget adherence (max 15 points)
    if (budgetStatus.length > 0) {
      const budgetAdherence = budgetStatus.filter(b => b.percentage <= 100).length / budgetStatus.length;
      score += budgetAdherence * 15;
    }
    
    // Goals progress (max 10 points)
    if (goalsProgress.length > 0) {
      const avgGoalProgress = goalsProgress.reduce((sum, g) => sum + g.progress, 0) / goalsProgress.length;
      score += (avgGoalProgress / 100) * 10;
    }
    
    return Math.min(Math.round(score), 100);
  };

  const healthScore = getHealthScore();

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const features = [
    {
      icon: '📊',
      title: 'Dashboard',
      description: 'View your complete financial overview',
      route: '/dashboard',
      color: '#8b5cf6'
    },
    {
      icon: '💳',
      title: 'Transactions',
      description: 'Track income & expenses',
      route: '/transactions',
      color: '#10b981'
    },
    {
      icon: '💰',
      title: 'Budgets',
      description: 'Set & manage budgets',
      route: '/budgets',
      color: '#f59e0b'
    },
    {
      icon: '🎯',
      title: 'Goals',
      description: 'Achieve financial goals',
      route: '/goals',
      color: '#ef4444'
    },
    {
      icon: '🤖',
      title: 'AI Insights',
      description: 'Get smart advice',
      route: '/ai-insights',
      color: '#6366f1'
    },
    {
      icon: '📈',
      title: 'Analytics',
      description: 'Detailed reports',
      route: '/analytics',
      color: '#ec4899'
    }
  ];

  const quickTips = [
    "💡 Track every expense, no matter how small!",
    "🎯 Set realistic financial goals and review them weekly",
    "💰 Try the 50/30/20 rule: Needs/Wants/Savings",
    "📊 Review your spending patterns monthly",
    "🏦 Build an emergency fund of 3-6 months expenses",
    "🤖 Ask our AI advisor for personalized tips!"
  ];

  const randomTip = quickTips[Math.floor(currentTime.getMinutes() / 10) % quickTips.length];

  return (
    <div className={`home-wrapper ${isDarkMode ? 'dark' : ''}`}>
      {/* Confetti Effect */}
      {showConfetti && (
        <div className="confetti-container">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="confetti"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                backgroundColor: ['#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'][Math.floor(Math.random() * 5)]
              }}
            />
          ))}
        </div>
      )}

      {/* Check-in Success Modal */}
      {showCheckInModal && (
        <div className="checkin-modal-overlay" onClick={() => setShowCheckInModal(false)}>
          <div className="checkin-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-celebration">🎉</div>
            <h2>Daily Check-in Complete!</h2>
            <div className="points-earned">
              <span className="points-number">+{earnedPoints}</span>
              <span className="points-label">Points Earned</span>
            </div>
            <div className="streak-info">
              <span className="streak-emoji">{getStreakEmoji(dailyCheckIn.streak)}</span>
              <span className="streak-count">{dailyCheckIn.streak} Day Streak!</span>
            </div>
            <p className="modal-message">
              {dailyCheckIn.streak >= 7 
                ? "Amazing! You're on fire! 🔥" 
                : "Keep it up! Come back tomorrow for bonus points!"}
            </p>
            <button className="modal-close-btn" onClick={() => setShowCheckInModal(false)}>
              Awesome! 👍
            </button>
          </div>
        </div>
      )}



      {/* Main Content */}
      <div className="home-content">
        {/* Hero Section */}
        <section className="home-hero">
          <div className="home-hero-content">
            <div className="home-welcome-badge">
              <span className="badge-icon">{getGreeting().split(' ')[0]}</span>
              <span>{getGreeting().split(' ').slice(1).join(' ')}, {user?.username || user?.name || 'User'}!</span>
            </div>
            
            <h1 className="home-title">
              <span className="title-line">Welcome to</span>
              <span className="title-highlight">BudgetWise</span>
            </h1>
            
            <p className="home-subtitle">
              Your AI-powered financial companion for smarter money management
            </p>

            <p className="home-date">
              {currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>

            <div className="home-cta-buttons">
              <button className="cta-primary" onClick={() => navigate('/dashboard')}>
                <span className="cta-icon">📊</span>
                Go to Dashboard
              </button>
              <button className="cta-secondary" onClick={() => navigate('/ai-insights')}>
                <span className="cta-icon">🤖</span>
                Ask AI Advisor
              </button>
            </div>
          </div>

          {/* Daily Check-in Card */}
          <div className="home-hero-visual">
            {/* Health Score Card */}
            <div className="health-score-card">
              <div className="health-card-header">
                <span className="health-card-icon">💚</span>
                <span>Health Score</span>
              </div>
              <div className="health-card-content">
                <div className="health-score-circle">
                  <svg className="health-circle-svg" viewBox="0 0 100 100">
                    <circle
                      className="health-circle-bg"
                      cx="50"
                      cy="50"
                      r="42"
                      fill="none"
                      strokeWidth="10"
                    />
                    <circle
                      className="health-circle-progress"
                      cx="50"
                      cy="50"
                      r="42"
                      fill="none"
                      strokeWidth="10"
                      strokeDasharray={`${healthScore * 2.64} 264`}
                      strokeLinecap="round"
                      style={{
                        stroke: healthScore >= 70 ? '#10b981' : healthScore >= 40 ? '#f59e0b' : '#ef4444'
                      }}
                    />
                  </svg>
                  <div className="health-score-number">
                    <span className="score-value">{healthScore}</span>
                    <span className="score-max">/100</span>
                  </div>
                </div>
                <div className="health-status-text">
                  {healthScore >= 70 ? (
                    <span className="status-excellent">🌟 Excellent!</span>
                  ) : healthScore >= 40 ? (
                    <span className="status-good">💪 Good</span>
                  ) : (
                    <span className="status-attention">⚠️ Needs Work</span>
                  )}
                </div>
              </div>
              <button className="health-view-btn" onClick={() => navigate('/dashboard')}>
                View Details →
              </button>
            </div>

            <div className="checkin-card">
              <div className="checkin-header">
                <span className="checkin-icon">🌟</span>
                <span>Daily Check-in</span>
              </div>
              
              <div className="checkin-content">
                {!dailyCheckIn.checkedIn ? (
                  <>
                    <p className="checkin-prompt">Claim your daily points!</p>
                    <button className="checkin-btn" onClick={handleCheckIn}>
                      <span>✨</span> Check In Now
                    </button>
                  </>
                ) : (
                  <div className="checked-in-state">
                    <span className="checked-emoji">✅</span>
                    <p>You've checked in today!</p>
                    <p className="comeback-text">Come back tomorrow for more points</p>
                  </div>
                )}
              </div>

              <div className="checkin-stats">
                <div className="checkin-stat">
                  <span className="stat-emoji">{getStreakEmoji(dailyCheckIn.streak)}</span>
                  <span className="stat-value">{dailyCheckIn.streak}</span>
                  <span className="stat-label">Day Streak</span>
                </div>
                <div className="checkin-stat">
                  <span className="stat-emoji">🏆</span>
                  <span className="stat-value">{dailyCheckIn.totalPoints}</span>
                  <span className="stat-label">Total Points</span>
                </div>
              </div>

              <div className="rank-badge" style={{ borderColor: rank.color }}>
                <span className="rank-emoji">{rank.emoji}</span>
                <span className="rank-name" style={{ color: rank.color }}>{rank.name}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Tip Banner */}
        <section className="tip-banner">
          <div className="tip-icon">💡</div>
          <p className="tip-text">{randomTip}</p>
        </section>

        {/* What is BudgetWise Section */}
        <section className="about-section">
          <h2 className="section-title">
            <span className="title-icon">💎</span>
            What is BudgetWise?
          </h2>
          <p className="about-description">
            BudgetWise is your personal AI-powered financial assistant that helps you take control of your money. 
            Track your income and expenses, set budgets, achieve savings goals, and get intelligent insights 
            to make smarter financial decisions. Start your journey to financial freedom today!
          </p>
          <div className="about-highlights">
            <div className="highlight-item">
              <span className="highlight-icon">🔒</span>
              <span>Secure & Private</span>
            </div>
            <div className="highlight-item">
              <span className="highlight-icon">🤖</span>
              <span>AI-Powered</span>
            </div>
            <div className="highlight-item">
              <span className="highlight-icon">📱</span>
              <span>Easy to Use</span>
            </div>
            <div className="highlight-item">
              <span className="highlight-icon">💯</span>
              <span>100% Free</span>
            </div>
          </div>
        </section>

        {/* Live Financial Stats */}
        <section className="home-live-stats">
          <h2 className="stats-title">
            <span className="title-icon">📊</span>
            Live Financial Stats
          </h2>
          <div className="stats-grid">
            <div className="stat-card income-stat">
              <div className="stat-icon">📈</div>
              <div className="stat-info">
                <span className="stat-label">Total Income</span>
                <span className="stat-value positive">{formatCurrency(financialSummary.totalIncome)}</span>
              </div>
              <div className="stat-trend">
                <span>This Month: {formatCurrency(financialSummary.monthlyIncome)}</span>
              </div>
            </div>
            
            <div className="stat-card expense-stat">
              <div className="stat-icon">📉</div>
              <div className="stat-info">
                <span className="stat-label">Total Expenses</span>
                <span className="stat-value negative">{formatCurrency(financialSummary.totalExpenses)}</span>
              </div>
              <div className="stat-trend">
                <span>This Month: {formatCurrency(financialSummary.monthlyExpenses)}</span>
              </div>
            </div>
            
            <div className="stat-card balance-stat">
              <div className="stat-icon">💰</div>
              <div className="stat-info">
                <span className="stat-label">Net Balance</span>
                <span className={`stat-value ${financialSummary.balance >= 0 ? 'positive' : 'negative'}`}>
                  {formatCurrency(financialSummary.balance)}
                </span>
              </div>
              <div className="stat-trend">
                <span>{financialSummary.transactionCount} transactions</span>
              </div>
            </div>
            
            <div className="stat-card savings-stat">
              <div className="stat-icon">🏦</div>
              <div className="stat-info">
                <span className="stat-label">Savings Rate</span>
                <span className="stat-value">{financialSummary.savingsRate}%</span>
              </div>
              <div className="savings-bar">
                <div 
                  className="savings-progress" 
                  style={{ width: `${Math.min(financialSummary.savingsRate, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="home-features">
          <h2 className="features-title">
            <span className="title-icon">🚀</span>
            Explore Features
          </h2>

          <div className="features-grid">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className="feature-card"
                onClick={() => navigate(feature.route)}
                style={{ '--feature-color': feature.color }}
              >
                <div className="feature-icon-wrapper" style={{ backgroundColor: `${feature.color}20` }}>
                  <span className="feature-icon">{feature.icon}</span>
                </div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
                <span className="feature-arrow">→</span>
              </div>
            ))}
          </div>
        </section>

        {/* Quick Actions */}
        <section className="home-quick-actions">
          <h2 className="actions-title">⚡ Quick Actions</h2>
          <div className="actions-grid">
            <button className="action-card" onClick={() => navigate('/transactions')}>
              <span className="action-icon">➕</span>
              <span className="action-text">Add Transaction</span>
            </button>
            <button className="action-card" onClick={() => navigate('/budgets')}>
              <span className="action-icon">📊</span>
              <span className="action-text">New Budget</span>
            </button>
            <button className="action-card" onClick={() => navigate('/goals')}>
              <span className="action-icon">🎯</span>
              <span className="action-text">Set Goal</span>
            </button>
            <button className="action-card" onClick={() => navigate('/ai-insights')}>
              <span className="action-icon">🤖</span>
              <span className="action-text">Ask AI</span>
            </button>
            <button className="action-card" onClick={() => navigate('/export')}>
              <span className="action-icon">📤</span>
              <span className="action-text">Export Data</span>
            </button>
            <button className="action-card" onClick={() => navigate('/profile')}>
              <span className="action-icon">👤</span>
              <span className="action-text">Profile</span>
            </button>
          </div>
        </section>

        {/* Footer */}
        <footer className="home-footer">
          <div className="footer-content">
            <div className="footer-brand">
              <span className="footer-logo">💎</span>
              <span className="footer-name">BudgetWise</span>
              <span className="footer-tagline">Your AI Financial Companion</span>
            </div>
            <p className="footer-copyright">
              © {new Date().getFullYear()} BudgetWise. Smart money management powered by AI.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
