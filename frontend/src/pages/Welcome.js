import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Welcome.css';

export default function Welcome() {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    // Generate random particles for background animation
    const newParticles = Array.from({ length: 15 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      duration: Math.random() * 3 + 2,
      delay: Math.random() * 1
    }));
    setParticles(newParticles);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => handleNext(), 500);
          return 100;
        }
        return prev + 8;
      });
    }, 800);

    return () => clearInterval(interval);
  }, []);

  const handleNext = () => {
    sessionStorage.setItem('welcomed', 'true');
    navigate('/login');
  };

  const features = [
    { icon: '📊', title: 'Track Expenses', desc: 'Real-time tracking' },
    { icon: '🎯', title: 'Set Goals', desc: 'Achieve targets' },
    { icon: '📈', title: 'AI Insights', desc: 'Smart analysis' },
    { icon: '💡', title: 'Smart Tips', desc: 'Save smarter' }
  ];

  return (
    <div className="welcome-new-wrapper">
      {/* Animated Background */}
      <div className="welcome-animated-bg">
        <div className="welcome-blob blob-1"></div>
        <div className="welcome-blob blob-2"></div>
        <div className="welcome-blob blob-3"></div>
        
        {/* Floating Particles */}
        {particles.map(particle => (
          <div
            key={particle.id}
            className="welcome-particle"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              animationDuration: `${particle.duration}s`,
              animationDelay: `${particle.delay}s`
            }}
          />
        ))}
      </div>

      {/* Main Container */}
      <div className="welcome-new-container">
        {/* Left Side - Content */}
        <div className="welcome-content-section">
          <div className="welcome-logo-container">
            <div className="welcome-logo-badge">💰</div>
            <div className="welcome-brand-icon">B</div>
          </div>

          <h1 className="welcome-main-title">
            Welcome to <span className="welcome-highlight">BudgetWise</span>
          </h1>

          <p className="welcome-subtitle">
            Your AI-Powered Expense Tracker
          </p>

          <p className="welcome-description">
            Take control of your finances with intelligent tracking, smart insights, and personalized recommendations. Make every rupee count!
          </p>

          {/* Features Grid */}
          <div className="welcome-features-grid">
            {features.map((feature, idx) => (
              <div key={idx} className="welcome-feature-card">
                <div className="feature-icon">{feature.icon}</div>
                <div className="feature-content">
                  <h3>{feature.title}</h3>
                  <p>{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Loading Section */}
          <div className="welcome-progress-section">
            <div className="welcome-progress-bar">
              <div className="progress-fill" style={{ width: `${progress}%` }} />
              <div className="progress-glow" style={{ width: `${progress}%` }} />
            </div>
            <p className="loading-text">
              {progress < 100 ? `Loading in ${Math.max(0, 13 - Math.ceil(progress / 10))} seconds...` : 'Ready to go!'}
            </p>
          </div>

          {/* CTA Button */}
          <button className="welcome-cta-btn" onClick={handleNext}>
            <span className="btn-content">
              Get Started
              <span className="btn-arrow">→</span>
            </span>
            <span className="btn-shimmer"></span>
          </button>
        </div>

        {/* Right Side - Illustration */}
        <div className="welcome-visual-section">
          <div className="welcome-card-showcase">
            <div className="showcase-card card-income">
              <div className="card-label">Income</div>
              <div className="card-amount">₹45,000</div>
              <div className="card-icon">📈</div>
            </div>
            <div className="showcase-card card-expense">
              <div className="card-label">Expenses</div>
              <div className="card-amount">₹12,500</div>
              <div className="card-icon">💸</div>
            </div>
            <div className="showcase-card card-savings">
              <div className="card-label">Savings</div>
              <div className="card-amount">₹32,500</div>
              <div className="card-icon">💎</div>
            </div>
          </div>

          <div className="welcome-chart">
            <div className="chart-bar" style={{ height: '60%' }}></div>
            <div className="chart-bar" style={{ height: '35%' }}></div>
            <div className="chart-bar" style={{ height: '80%' }}></div>
            <div className="chart-bar" style={{ height: '45%' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
}