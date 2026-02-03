import React, { useEffect, useState, useContext } from 'react';
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Pie, Line } from 'react-chartjs-2';
import { useAuth } from '../context/AuthContext';
import { TransactionContext } from '../context/TransactionContext';
import { useTheme } from '../context/ThemeContext';
import '../styles/Dashboard.css';

ChartJS.register(ArcElement, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export default function Dashboard(){
  const { user } = useAuth();
  const { transactions, loading, loadTransactions } = useContext(TransactionContext);
  const { isDarkMode } = useTheme();
  const [summary, setSummary] = useState({ income: 0, expenses: 0, net: 0, savingsRate: 0 });
  const [categoryData, setCategoryData] = useState(null);
  const [last6MonthsData, setLast6MonthsData] = useState(null);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  useEffect(() => {
    // Calculate summary and visualizations from global transactions
    let totalIncome = 0;
    let totalExpenses = 0;
    const categoryMap = {};
    const monthlyData = {};

    // Initialize last 6 months
    const today = new Date();
    for (let i = 5; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthKey = date.toLocaleDateString('en-US', { month: 'short' });
      monthlyData[monthKey] = { income: 0, expenses: 0 };
    }

    transactions.forEach(txn => {
      const amount = parseFloat(txn.amount) || 0;
      const txnType = txn.type && txn.type.toLowerCase();
      const txnDate = new Date(txn.date);
      const monthKey = txnDate.toLocaleDateString('en-US', { month: 'short' });

      if (txnType === 'income') {
        totalIncome += amount;
        if (monthlyData[monthKey]) monthlyData[monthKey].income += amount;
      } else if (txnType === 'expense') {
        totalExpenses += amount;
        if (monthlyData[monthKey]) monthlyData[monthKey].expenses += amount;
        
        // Track expenses by category
        const category = txn.category || 'Other';
        categoryMap[category] = (categoryMap[category] || 0) + amount;
      }
    });

    const netSavings = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? ((netSavings / totalIncome) * 100).toFixed(1) : 0;

    setSummary({
      income: totalIncome,
      expenses: totalExpenses,
      net: netSavings,
      savingsRate: savingsRate
    });

    // Setup category pie chart data
    const categories = Object.keys(categoryMap);
    const categoryValues = Object.values(categoryMap);
    const chartColors = ['#10b981', '#ef4444', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];
    
    if (categories.length > 0) {
      setCategoryData({
        labels: categories,
        datasets: [{
          data: categoryValues,
          backgroundColor: chartColors.slice(0, categories.length),
          borderColor: 'white',
          borderWidth: 2
        }]
      });
    }

    // Setup 6-month line chart data
    const months = Object.keys(monthlyData);
    const incomeValues = months.map(m => monthlyData[m].income);
    const expenseValues = months.map(m => monthlyData[m].expenses);

    setLast6MonthsData({
      labels: months,
      datasets: [
        {
          label: 'Income',
          data: incomeValues,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointRadius: 5,
          pointBackgroundColor: '#10b981',
          pointBorderColor: 'white',
          pointBorderWidth: 2
        },
        {
          label: 'Expenses',
          data: expenseValues,
          borderColor: '#ef4444',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointRadius: 5,
          pointBackgroundColor: '#ef4444',
          pointBorderColor: 'white',
          pointBorderWidth: 2
        }
      ]
    });
  }, [transactions]);

  const recentTxns = transactions
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

  // Calculate active goals (assuming we have goals data)
  const activeGoals = 1; // Placeholder - can be updated with actual goals

  return (
    <div className="dashboard-page">
      {/* Welcome Header */}
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
            fontSize: '32px',
            fontWeight: '800',
            marginBottom: '8px',
            letterSpacing: '-0.5px',
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
              backgroundClip: 'text',
              textShadow: isDarkMode ? '0 2px 20px rgba(255,255,255,0.3)' : 'none'
            }}>
              Welcome, {user?.username || 'User'}!
            </span>
            <span style={{ WebkitTextFillColor: 'initial' }}>👋</span>
          </h1>
          <p style={{ 
            color: isDarkMode ? 'rgba(255,255,255,0.85)' : 'rgba(88, 28, 135, 0.8)', 
            fontSize: '16px', 
            margin: 0,
            fontWeight: '500',
            textShadow: isDarkMode ? '0 1px 10px rgba(0,0,0,0.2)' : 'none'
          }}>Here's your financial overview</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="dashboard-stats">
        <div className="card stat-card">
          <div className="stat-header">
            <span className="stat-label">TOTAL INCOME</span>
            <span className="stat-icon">📈</span>
          </div>
          <div className="stat-value">₹{summary.income.toFixed(2)}</div>
          <div className="stat-change income">📊 +12.5% vs last month</div>
        </div>

        <div className="card stat-card">
          <div className="stat-header">
            <span className="stat-label">TOTAL EXPENSES</span>
            <span className="stat-icon">💸</span>
          </div>
          <div className="stat-value" style={{color: '#ef4444'}}>₹{summary.expenses.toFixed(2)}</div>
          <div className="stat-change expense">📉 -5.2% vs last month</div>
        </div>

        <div className="card stat-card">
          <div className="stat-header">
            <span className="stat-label">NET SAVINGS</span>
            <span className="stat-icon">💰</span>
          </div>
          <div className="stat-value" style={{color: summary.net >= 0 ? '#10b981' : '#ef4444'}}>₹{summary.net.toFixed(2)}</div>
          <div className="stat-change income">📈 {summary.savingsRate}% vs last month</div>
        </div>

        <div className="card stat-card">
          <div className="stat-header">
            <span className="stat-label">ACTIVE GOALS</span>
            <span className="stat-icon">🎯</span>
          </div>
          <div className="stat-value">{activeGoals}</div>
          <div className="stat-change" style={{color: '#6b7280'}}>Managing your targets</div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="charts-section">
        {/* 6-Month Line Chart */}
        <div className="card chart-card">
          <h3 className="chart-title">Income vs Expenses (Last 6 Months)</h3>
          {last6MonthsData ? (
            <Line 
              data={last6MonthsData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: true,
                    position: 'bottom',
                    labels: {
                      font: { size: 13, weight: 500 },
                      color: '#6b7280',
                      padding: 15,
                      usePointStyle: true
                    }
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      color: '#9ca3af',
                      font: { size: 12 },
                      stepSize: 1000,
                      callback: function(value) {
                        return '₹' + value.toLocaleString();
                      }
                    },
                    grid: { color: 'rgba(0, 0, 0, 0.05)' }
                  },
                  x: {
                    grid: { display: false },
                    ticks: { color: '#9ca3af', font: { size: 12 } }
                  }
                }
              }}
              height={400}
            />
          ) : (
            <div style={{color: '#9ca3af', padding: '40px', textAlign: 'center'}}>No data available</div>
          )}
        </div>

        {/* Spending by Category Pie Chart */}
        <div className="card chart-card pie-card">
          <h3 className="chart-title">Spending by Category</h3>
          {categoryData && Object.keys(categoryData.labels || {}).length > 0 ? (
            <Pie 
              data={categoryData}
              options={{
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                  legend: {
                    display: true,
                    position: 'right',
                    labels: {
                      font: { size: 12, weight: 500 },
                      color: '#6b7280',
                      padding: 15,
                      usePointStyle: true
                    }
                  },
                  tooltip: {
                    callbacks: {
                      label: function(context) {
                        const total = context.dataset.data.reduce((a, b) => a + b, 0);
                        const percentage = ((context.parsed / total) * 100).toFixed(1);
                        return `${context.label}: ₹${context.parsed.toFixed(0)} (${percentage}%)`;
                      }
                    }
                  }
                }
              }}
              height={300}
            />
          ) : (
            <div style={{color: '#9ca3af', padding: '40px', textAlign: 'center'}}>No expense data available</div>
          )}
        </div>
      </div>

      {/* Recent Transactions & AI Insights */}
      <div className="bottom-section">
        <div className="card transactions-card">
          <div className="transactions-header">
            <h3>Recent Transactions</h3>
            <a href="/transactions" style={{color: '#2563eb', textDecoration: 'none', fontSize: '14px', fontWeight: 500}}>View All</a>
          </div>
          <div className="transactions-list">
            {loading && <div style={{color:'#6b7280'}}>Loading transactions...</div>}
            {!loading && recentTxns.length === 0 && <div style={{color:'#6b7280'}}>No transactions yet</div>}
            {!loading && recentTxns.map(txn=> (
              <div key={txn.id} className="txn">
                <div className="txn-left">
                  <div className="txn-icon" style={{
                    backgroundColor: txn.type && txn.type.toLowerCase() === 'income' ? '#d1fae5' : '#fee2e2',
                    color: txn.type && txn.type.toLowerCase() === 'income' ? '#10b981' : '#ef4444'
                  }}>
                    {txn.type && txn.type.toLowerCase() === 'income' ? '⊕' : '⊖'}
                  </div>
                  <div>
                    <div style={{fontWeight:600, color: '#1f2937'}}>{txn.description}</div>
                    <div style={{fontSize:12, color:'#9ca3af'}}>
                      {new Date(txn.date).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div style={{
                  fontWeight:700, 
                  color: txn.type && txn.type.toLowerCase() === 'income' ? '#10b981' : '#ef4444',
                  textAlign: 'right'
                }}>
                  <div>{txn.type && txn.type.toLowerCase() === 'income' ? '+' : '-'}₹{parseFloat(txn.amount).toFixed(2)}</div>
                  <div style={{fontSize: '12px', color: '#9ca3af', fontWeight: 500}}>{txn.category}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Financial Insights */}
        <div className="card insights-card">
          <div className="insights-header">
            <h3>✨ AI Financial Insights</h3>
          </div>
          <div className="insights-list">
            <div className="insight-item">
              <span className="insight-number">1</span>
              <p>Consider setting a budget for housing costs to reduce spending in this category, aiming to lower it below $25000, which could free up additional funds for savings or investment.</p>
            </div>
            <div className="insight-item">
              <span className="insight-number">2</span>
              <p>With a savings rate of {summary.savingsRate}%, look into diversifying savings by investing in stocks, bonds, or mutual funds to potentially increase returns.</p>
            </div>
            <div className="insight-item">
              <span className="insight-number">3</span>
              <p>Evaluate expenses regularly and seek opportunities to reduce discretionary spending, allowing for an increased ability to invest or save more aggressively for future goals.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}