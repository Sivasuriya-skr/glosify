import React, { useState, useEffect, useContext } from 'react';
import { Pie, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { TransactionContext } from '../context/TransactionContext';
import { useTheme } from '../context/ThemeContext';
import '../styles/Analytics.css';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

export default function Analytics() {
  const { transactions, loadTransactions } = useContext(TransactionContext);
  const { isDarkMode } = useTheme();
  const [categoryData, setCategoryData] = useState({});
  const [totalSpent, setTotalSpent] = useState(0);
  const [incomeTotal, setIncomeTotal] = useState(0);

  const colors = [
    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
    '#FF9F40', '#FF6384', '#C9CBCF', '#4BC0C0', '#FF6384',
    '#00D4FF', '#FFB347', '#87CEEB', '#98FB98', '#FFB6C1'
  ];

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  useEffect(() => {
    if (transactions.length > 0) {
      const categoryTotals = {};
      let total = 0;
      let income = 0;

      transactions.forEach(transaction => {
        if (transaction.type === 'expense') {
          const category = transaction.category || 'Other';
          const amount = parseFloat(transaction.amount) || 0;
          categoryTotals[category] = (categoryTotals[category] || 0) + amount;
          total += amount;
        } else if (transaction.type === 'income') {
          income += parseFloat(transaction.amount) || 0;
        }
      });

      setCategoryData(categoryTotals);
      setTotalSpent(total);
      setIncomeTotal(income);
    }
  }, [transactions]);

  // Overall Pie Chart
  const overallChartData = {
    labels: Object.keys(categoryData),
    datasets: [
      {
        data: Object.values(categoryData),
        backgroundColor: colors.slice(0, Object.keys(categoryData).length),
        borderWidth: 2,
        borderColor: isDarkMode ? '#1e293b' : '#ffffff'
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          color: isDarkMode ? '#cbd5e1' : '#374151',
          padding: 15,
          usePointStyle: true,
          font: { size: 13 }
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const value = context.parsed;
            const percentage = totalSpent > 0 ? ((value / totalSpent) * 100).toFixed(1) : 0;
            return `${context.label}: ₹${value.toLocaleString()} (${percentage}%)`;
          }
        }
      }
    }
  };

  return (
    <div className="analytics-page">
      {/* Header */}
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
            }}>Analytics</span>
            <span style={{ WebkitTextFillColor: 'initial' }}>📊</span>
          </h1>
          <p style={{ color: isDarkMode ? 'rgba(255,255,255,0.85)' : 'rgba(88, 28, 135, 0.8)', fontSize: '15px', margin: 0, fontWeight: '500' }}>Comprehensive spending and income insights</p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="analytics-stats-grid">
        <div className={`stat-card ${isDarkMode ? 'dark' : 'light'}`}>
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <div className="stat-label">Total Spent</div>
            <div className="stat-value">₹{totalSpent.toLocaleString()}</div>
          </div>
        </div>
        <div className={`stat-card ${isDarkMode ? 'dark' : 'light'}`}>
          <div className="stat-icon">📈</div>
          <div className="stat-content">
            <div className="stat-label">Total Income</div>
            <div className="stat-value">₹{incomeTotal.toLocaleString()}</div>
          </div>
        </div>
        <div className={`stat-card ${isDarkMode ? 'dark' : 'light'}`}>
          <div className="stat-icon">🎯</div>
          <div className="stat-content">
            <div className="stat-label">Balance</div>
            <div className="stat-value" style={{color: (incomeTotal - totalSpent) >= 0 ? '#10b981' : '#ef4444'}}>
              ₹{(incomeTotal - totalSpent).toLocaleString()}
            </div>
          </div>
        </div>
        <div className={`stat-card ${isDarkMode ? 'dark' : 'light'}`}>
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <div className="stat-label">Categories</div>
            <div className="stat-value">{Object.keys(categoryData).length}</div>
          </div>
        </div>
      </div>

      {/* Overall Pie Chart */}
      <div className={`analytics-card ${isDarkMode ? 'dark' : 'light'}`}>
        <div className="card-header">
          <h3>Overall Spending Distribution</h3>
          <p className="card-subtitle">All categories combined</p>
        </div>
        
        {Object.keys(categoryData).length > 0 ? (
          <div style={{height: '450px', position: 'relative'}}>
            <Pie data={overallChartData} options={chartOptions} />
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">📊</div>
            <div>No expense data available</div>
          </div>
        )}
      </div>

      {/* Category-wise Pie Charts */}
      <div className="analytics-category-section">
        <h2 className="section-title">Category-wise Breakdown</h2>
        <p className="section-subtitle">Individual spending distribution for each category</p>
        
        <div className="category-charts-grid">
          {Object.entries(categoryData)
            .sort(([,a], [,b]) => b - a)
            .map(([category, amount], index) => {
              const percentage = totalSpent > 0 ? ((amount / totalSpent) * 100).toFixed(1) : 0;
              const colorIndex = index % colors.length;
              
              return (
                <div key={category} className={`category-chart-card ${isDarkMode ? 'dark' : 'light'}`}>
                  <div className="category-card-header">
                    <div className="category-title-row">
                      <div 
                        className="category-color-dot" 
                        style={{backgroundColor: colors[colorIndex]}}
                      />
                      <h4>{category}</h4>
                    </div>
                    <div className="category-stats">
                      <div className="category-amount">₹{amount.toLocaleString()}</div>
                      <div className="category-percentage">{percentage}%</div>
                    </div>
                  </div>
                  
                  <div className="category-mini-chart">
                    <div className="mini-pie-container">
                      <div className="mini-circle" style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '50%',
                        background: `conic-gradient(${colors[colorIndex]} 0deg ${(percentage / 100) * 360}deg, ${isDarkMode ? '#334155' : '#e5e7eb'} ${(percentage / 100) * 360}deg)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <div style={{
                          width: '70px',
                          height: '70px',
                          borderRadius: '50%',
                          background: isDarkMode ? '#1e293b' : '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <span style={{fontSize: '18px', fontWeight: '700', color: isDarkMode ? '#cbd5e1' : '#374151'}}>
                            {percentage}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Transaction Count */}
                  <div className="category-details">
                    <div className="detail-row">
                      <span className="detail-label">Transactions:</span>
                      <span className="detail-value">
                        {transactions.filter(t => t.category === category && t.type === 'expense').length}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Avg Amount:</span>
                      <span className="detail-value">
                        ₹{Math.round(amount / transactions.filter(t => t.category === category && t.type === 'expense').length)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Category Breakdown List */}
      <div className={`analytics-card ${isDarkMode ? 'dark' : 'light'}`}>
        <div className="card-header">
          <h3>Detailed Breakdown</h3>
          <p className="card-subtitle">Sorted by spending amount</p>
        </div>
        
        <div className="breakdown-list">
          {Object.entries(categoryData)
            .sort(([,a], [,b]) => b - a)
            .map(([category, amount], index) => {
              const percentage = totalSpent > 0 ? ((amount / totalSpent) * 100).toFixed(1) : 0;
              const colorIndex = index % colors.length;
              
              return (
                <div key={category} className={`breakdown-item ${isDarkMode ? 'dark' : 'light'}`}>
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8}}>
                    <div style={{display:'flex', alignItems:'center', gap:12}}>
                      <div 
                        style={{
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          backgroundColor: colors[colorIndex]
                        }}
                      />
                      <span style={{fontWeight:600, color: isDarkMode ? '#cbd5e1' : '#374151'}}>
                        {category}
                      </span>
                    </div>
                    <span style={{fontWeight:700, color: isDarkMode ? '#f1f5f9' : '#111827'}}>
                      ₹{amount.toLocaleString()}
                    </span>
                  </div>
                  
                  <div style={{display:'flex', alignItems:'center', gap:12}}>
                    <div style={{
                      height: '8px',
                      backgroundColor: isDarkMode ? '#334155' : '#e5e7eb',
                      borderRadius: '4px',
                      flex: 1,
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        height: '100%',
                        backgroundColor: colors[colorIndex],
                        width: `${percentage}%`,
                        borderRadius: '4px',
                        transition: 'width 0.3s ease'
                      }} />
                    </div>
                    <span style={{fontSize: '12px', fontWeight: '600', color: isDarkMode ? '#94a3b8' : '#6b7280', minWidth: '40px'}}>
                      {percentage}%
                    </span>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}