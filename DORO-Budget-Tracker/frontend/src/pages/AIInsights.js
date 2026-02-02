import React, { useState, useEffect, useRef } from 'react';
import axios from '../api/axios';
import { useTheme } from '../context/ThemeContext';
import '../styles/AIInsights.css';

export default function AIInsights() {
  const { isDarkMode } = useTheme();
  const [stats, setStats] = useState({
    income: 0,
    expenses: 0,
    transactions: 0,
    budgets: 0,
    goals: 0,
    balance: 0
  });
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [selectedQuickPrompt, setSelectedQuickPrompt] = useState(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const fetchStats = async () => {
    try {
      const [transactionsRes, budgetsRes, goalsRes] = await Promise.all([
        axios.get('/api/transactions'),
        axios.get('/api/budgets'),
        axios.get('/api/goals')
      ]);

      const transactions = transactionsRes.data;
      const budgets = budgetsRes.data;
      const goals = goalsRes.data;

      const income = transactions
        .filter(t => t.type?.toLowerCase() === 'income')
        .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

      const expenses = transactions
        .filter(t => t.type?.toLowerCase() === 'expense')
        .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

      setStats({
        income: Math.round(income),
        expenses: Math.round(expenses),
        transactions: transactions.length,
        budgets: budgets.length,
        goals: goals.length,
        balance: Math.round(income - expenses)
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  // Function to render formatted AI message with bold headings and numbered points
  const renderFormattedMessage = (content) => {
    if (!content) return null;
    
    // Clean the content - remove all ** markers and clean up
    let cleanContent = content
      .replace(/\*\*/g, '')  // Remove all ** markers
      .replace(/\*\s*$/gm, '') // Remove trailing * at end of lines
      .replace(/^\*\s*/gm, '• ') // Convert leading * to bullet
      .replace(/^\d+\.\s*$/gm, '') // Remove empty numbered lines like "1."
      .replace(/^\d+\.\s*[✅📊💡🎯📈💰🔍]\s*$/gm, '') // Remove numbered lines with just emoji
      .replace(/^[✅📊💡🎯📈💰🔍]\s*$/gm, '') // Remove lines with just emoji
      .replace(/\n\s*\n\s*\n/g, '\n\n'); // Collapse multiple empty lines
    
    // Split by lines
    const lines = cleanContent.split('\n');
    const elements = [];
    let lastWasEmpty = false;
    let currentNumber = 0; // Track numbering for each section
    
    // Helper function to check if a line is a section heading
    const isHeading = (line) => {
      const headingKeywords = ['financial analysis', 'recommendations', 'action steps', 'summary', 'analysis', 'tips', 'suggestions', 'budget', 'saving', 'savings', 'investment'];
      const lowerLine = line.toLowerCase().replace(/[📊💡✅🎯📈💰🔍:]/g, '').trim();
      return headingKeywords.some(keyword => lowerLine === keyword || lowerLine.endsWith(keyword));
    };
    
    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      
      // Skip completely empty lines but add spacing (avoid multiple consecutive spaces)
      if (!trimmedLine) {
        if (!lastWasEmpty) {
          elements.push(<div key={index} style={{ height: '8px' }} />);
          lastWasEmpty = true;
        }
        return;
      }
      lastWasEmpty = false;
      
      // Skip lines that are just numbers, emojis, or markers
      if (/^(\d+\.?\s*)?[✅📊💡🎯📈💰🔍\*]*\s*$/.test(trimmedLine)) {
        return;
      }
      
      // Determine heading color based on type
      const getHeadingStyle = (line) => {
        const lowerLine = line.toLowerCase();
        if (lowerLine.includes('analysis')) {
          return { gradient: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', bg: 'rgba(99, 102, 241, 0.1)', emoji: '📊' };
        } else if (lowerLine.includes('recommendation')) {
          return { gradient: 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)', bg: 'rgba(245, 158, 11, 0.1)', emoji: '💡' };
        } else if (lowerLine.includes('action')) {
          return { gradient: 'linear-gradient(135deg, #10b981 0%, #14b8a6 100%)', bg: 'rgba(16, 185, 129, 0.1)', emoji: '✅' };
        } else if (lowerLine.includes('tip')) {
          return { gradient: 'linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)', bg: 'rgba(236, 72, 153, 0.1)', emoji: '💡' };
        } else if (lowerLine.includes('saving')) {
          return { gradient: 'linear-gradient(135deg, #10b981 0%, #14b8a6 100%)', bg: 'rgba(16, 185, 129, 0.1)', emoji: '💰' };
        } else if (lowerLine.includes('budget')) {
          return { gradient: 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)', bg: 'rgba(245, 158, 11, 0.1)', emoji: '📈' };
        } else if (lowerLine.includes('investment')) {
          return { gradient: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', bg: 'rgba(99, 102, 241, 0.1)', emoji: '📈' };
        } else if (lowerLine.includes('summary')) {
          return { gradient: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', bg: 'rgba(99, 102, 241, 0.1)', emoji: '📋' };
        }
        return { gradient: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', bg: 'rgba(99, 102, 241, 0.1)', emoji: '📊' };
      };
      
      // Helper function to extract text without emojis
      const removeEmojis = (text) => {
        return text.replace(/[📊💡✅🎯📈💰🔍📋🏦💵💸🎉⚡🚀✨]/g, '').replace(/:$/, '').trim();
      };
      
      // Check for headings - more robust detection
      if (isHeading(trimmedLine)) {
        currentNumber = 0; // Reset numbering for new section
        const headingStyle = getHeadingStyle(trimmedLine);
        const headingText = removeEmojis(trimmedLine);
        elements.push(
          <div 
            key={index} 
            style={{ 
              fontWeight: '700', 
              fontSize: '14px',
              marginTop: index > 0 ? '20px' : '0',
              marginBottom: '12px',
              background: headingStyle.bg,
              padding: '10px 14px',
              borderRadius: '10px',
              borderLeft: '4px solid',
              borderImage: headingStyle.gradient,
              borderImageSlice: 1,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <span style={{ fontSize: '16px' }}>{headingStyle.emoji}</span>
            <span style={{
              background: headingStyle.gradient,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              {headingText}
            </span>
          </div>
        );
        return;
      }
      
      // Check for numbered points: 1. text or 1) text (must have actual text after number)
      const numberedMatch = trimmedLine.match(/^(\d+)[.)]\s+(.+)$/);
      if (numberedMatch) {
        // Clean the text of any remaining markers and emojis at start
        let cleanText = numberedMatch[2]
          .replace(/^\*+\s*/, '')
          .replace(/\*+$/, '')
          .replace(/^[✅📊💡🎯📈💰🔍]\s*/, '')
          .trim();
        
        // Only render if there's actual text content
        if (cleanText && cleanText.length > 1) {
          currentNumber++; // Increment the counter
          elements.push(
            <div 
              key={index} 
              style={{ 
                display: 'flex',
                gap: '12px',
                marginBottom: '10px',
                paddingLeft: '8px',
                alignItems: 'flex-start',
                background: isDarkMode ? 'rgba(99, 102, 241, 0.05)' : 'rgba(99, 102, 241, 0.03)',
                padding: '10px 12px',
                borderRadius: '8px',
                transition: 'all 0.2s ease'
              }}
            >
              <span style={{ 
                fontWeight: '700',
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                color: 'white',
                minWidth: '24px',
                height: '24px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                flexShrink: 0,
                boxShadow: '0 2px 8px rgba(99, 102, 241, 0.3)'
              }}>
                {currentNumber}
              </span>
              <span style={{ lineHeight: '1.6', paddingTop: '2px' }}>{cleanText}</span>
            </div>
          );
        }
        return;
      }
      
      // Check for bullet points: • text or - text
      const bulletMatch = trimmedLine.match(/^[•\-]\s+(.+)$/);
      if (bulletMatch) {
        const cleanText = bulletMatch[1].replace(/^\*+\s*/, '').replace(/\*+$/, '').trim();
        if (cleanText && cleanText.length > 1) {
          currentNumber++; // Also number bullet points
          elements.push(
            <div 
              key={index} 
              style={{ 
                display: 'flex',
                gap: '12px',
                marginBottom: '10px',
                paddingLeft: '8px',
                alignItems: 'flex-start',
                background: isDarkMode ? 'rgba(99, 102, 241, 0.05)' : 'rgba(99, 102, 241, 0.03)',
                padding: '10px 12px',
                borderRadius: '8px',
                transition: 'all 0.2s ease'
              }}
            >
              <span style={{ 
                fontWeight: '700',
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                color: 'white',
                minWidth: '24px',
                height: '24px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                flexShrink: 0,
                boxShadow: '0 2px 8px rgba(99, 102, 241, 0.3)'
              }}>
                {currentNumber}
              </span>
              <span style={{ lineHeight: '1.6', paddingTop: '2px' }}>{cleanText}</span>
            </div>
          );
        }
        return;
      }
      
      // Skip lines that are just ** or empty after cleaning
      if (trimmedLine === '**' || trimmedLine === '*' || !trimmedLine.replace(/[\*✅📊💡🎯📈💰🔍]/g, '').trim()) {
        return;
      }
      
      // Regular text - clean any remaining markers
      const cleanText = trimmedLine.replace(/^\*+\s*/, '').replace(/\*+$/, '').trim();
      if (cleanText && cleanText.length > 1) {
        elements.push(
          <div key={index} style={{ marginBottom: '4px', lineHeight: '1.5' }}>
            {cleanText}
          </div>
        );
      }
    });
    
    return <>{elements}</>;
  };

  const quickPrompts = [
    { emoji: '📊', text: 'Analyze Spending', query: 'Analyze my spending patterns and provide detailed insights' },
    { emoji: '💡', text: 'Budget Tips', query: 'Provide budget recommendations based on my financial situation' },
    { emoji: '💰', text: 'Save Money', query: 'Give me practical tips to save more money monthly' },
    { emoji: '📈', text: 'Investment Tips', query: 'What investment strategies would you recommend for me?' }
  ];

  const handleQuickPrompt = async (prompt) => {
    setSelectedQuickPrompt(prompt.text);
    setChatInput(prompt.query);
    await sendMessage(prompt.query);
  };

  const sendMessage = async (message = chatInput) => {
    if (!message.trim() && chatInput.trim()) return;

    const finalMessage = message || chatInput;
    if (!finalMessage.trim()) return;

    setChatMessages(prev => [...prev, { type: 'user', content: finalMessage }]);
    setChatInput('');
    setLoading(true);

    try {
      const response = await axios.post('/api/ai/insights', {
        query: finalMessage,
        context: ''
      });

      const aiResponse =
        response.data.insight || "I received your question but couldn't generate a response.";
      setChatMessages(prev => [
        ...prev,
        {
          type: 'ai',
          content: aiResponse,
          category: response.data.category
        }
      ]);
    } catch (error) {
      console.error('Error generating AI response:', error);
      setChatMessages(prev => [
        ...prev,
        {
          type: 'ai',
          content:
            "Sorry, I'm having trouble connecting to the AI service. Please make sure Ollama is running and try again."
        }
      ]);
    } finally {
      setLoading(false);
      setSelectedQuickPrompt(null);
    }
  };

  const textColor = isDarkMode ? '#e0e7ff' : '#1f2937';
  const secondaryTextColor = isDarkMode ? '#a0aec0' : '#6b7280';
  const cardBg = isDarkMode ? '#2d2a45' : '#ffffff';

  return (
    <div className="ai-insights-page">
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
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

          <div style={{ position: 'relative', zIndex: 1 }}>
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
              }}>AI Financial Assistant</span>
              <span style={{ WebkitTextFillColor: 'initial' }}>🤖</span>
            </h1>
            <p
              style={{
                color: isDarkMode ? 'rgba(255,255,255,0.85)' : 'rgba(88, 28, 135, 0.8)',
                margin: 0,
                fontSize: '15px',
                fontWeight: '500'
              }}
            >
              Get personalized financial insights powered by advanced AI
            </p>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '24px',
            marginBottom: '32px'
          }}
        >
          {/* Stats Cards */}
          <div>
            <div style={{ display: 'grid', gap: '16px' }}>
              {[
                { label: 'Income', value: stats.income, color: '#10b981', gradient: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)', bgGradient: isDarkMode ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(52, 211, 153, 0.1) 100%)' : 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(52, 211, 153, 0.05) 100%)', icon: '💰' },
                { label: 'Expenses', value: stats.expenses, color: '#ef4444', gradient: 'linear-gradient(135deg, #ef4444 0%, #f87171 100%)', bgGradient: isDarkMode ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(248, 113, 113, 0.1) 100%)' : 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(248, 113, 113, 0.05) 100%)', icon: '💸' },
                { label: 'Balance', value: stats.balance, color: '#6366f1', gradient: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)', bgGradient: isDarkMode ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(129, 140, 248, 0.1) 100%)' : 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(129, 140, 248, 0.05) 100%)', icon: '📊' }
              ].map((stat, idx) => (
                <div
                  key={idx}
                  style={{
                    background: stat.bgGradient,
                    padding: '20px',
                    borderRadius: '16px',
                    border: `2px solid ${stat.color}30`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    transition: 'all 0.3s ease',
                    cursor: 'default',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = `0 8px 24px ${stat.color}30`;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div 
                    style={{ 
                      fontSize: '28px',
                      background: stat.gradient,
                      borderRadius: '12px',
                      padding: '10px',
                      boxShadow: `0 4px 12px ${stat.color}40`
                    }}
                  >{stat.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        color: stat.color,
                        fontSize: '11px',
                        fontWeight: '700',
                        textTransform: 'uppercase',
                        letterSpacing: '1px'
                      }}
                    >
                      {stat.label}
                    </div>
                    <div
                      style={{
                        background: stat.gradient,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        fontSize: '26px',
                        fontWeight: '800',
                        marginTop: '4px'
                      }}
                    >
                      ₹{stat.value.toLocaleString()}
                    </div>
                  </div>
                  {/* Decorative element */}
                  <div style={{
                    position: 'absolute',
                    right: '-20px',
                    top: '-20px',
                    width: '80px',
                    height: '80px',
                    background: `${stat.color}10`,
                    borderRadius: '50%'
                  }}></div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Prompts */}
          <div
            style={{
              background: isDarkMode 
                ? 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)'
                : 'linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)',
              padding: '24px',
              borderRadius: '16px',
              border: `2px solid ${isDarkMode ? '#6366f1' : '#c4b5fd'}`,
              boxShadow: isDarkMode 
                ? '0 8px 32px rgba(99, 102, 241, 0.15)'
                : '0 8px 32px rgba(139, 92, 246, 0.1)'
            }}
          >
            <h3
              style={{
                background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                marginTop: 0,
                marginBottom: '16px',
                fontSize: '18px',
                fontWeight: '700'
              }}
            >
              ⚡ Quick Actions
            </h3>
            <div style={{ display: 'grid', gap: '12px' }}>
              {[
                { ...quickPrompts[0], gradient: isDarkMode ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.4) 0%, rgba(139, 92, 246, 0.3) 100%)' : 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(139, 92, 246, 0.1) 100%)', borderColor: '#6366f1', textColor: isDarkMode ? '#c7d2fe' : '#4f46e5', hoverShadow: 'rgba(99, 102, 241, 0.2)' },
                { ...quickPrompts[1], gradient: isDarkMode ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.35) 0%, rgba(249, 115, 22, 0.25) 100%)' : 'linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(249, 115, 22, 0.08) 100%)', borderColor: '#f59e0b', textColor: isDarkMode ? '#fde68a' : '#b45309', hoverShadow: 'rgba(245, 158, 11, 0.2)' },
                { ...quickPrompts[2], gradient: isDarkMode ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.35) 0%, rgba(20, 184, 166, 0.25) 100%)' : 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(20, 184, 166, 0.08) 100%)', borderColor: '#10b981', textColor: isDarkMode ? '#a7f3d0' : '#047857', hoverShadow: 'rgba(16, 185, 129, 0.2)' },
                { ...quickPrompts[3], gradient: isDarkMode ? 'linear-gradient(135deg, rgba(236, 72, 153, 0.35) 0%, rgba(244, 63, 94, 0.25) 100%)' : 'linear-gradient(135deg, rgba(236, 72, 153, 0.12) 0%, rgba(244, 63, 94, 0.08) 100%)', borderColor: '#ec4899', textColor: isDarkMode ? '#fbcfe8' : '#be185d', hoverShadow: 'rgba(236, 72, 153, 0.2)' }
              ].map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleQuickPrompt(prompt)}
                  disabled={loading}
                  style={{
                    background: prompt.gradient,
                    border: `2px solid ${prompt.borderColor}40`,
                    padding: '14px 18px',
                    borderRadius: '12px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    color: prompt.textColor,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    fontSize: '14px',
                    fontWeight: '600',
                    transition: 'all 0.3s ease',
                    opacity: loading ? 0.6 : 1,
                    boxShadow: 'none'
                  }}
                  onMouseEnter={e => {
                    if (!loading) {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = `0 6px 20px ${prompt.hoverShadow}`;
                      e.currentTarget.style.borderColor = prompt.borderColor;
                    }
                  }}
                  onMouseLeave={e => {
                    if (!loading) {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                      e.currentTarget.style.borderColor = `${prompt.borderColor}40`;
                    }
                  }}
                >
                  <span style={{ 
                    fontSize: '20px',
                    background: `${prompt.borderColor}20`,
                    borderRadius: '8px',
                    padding: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>{prompt.emoji}</span>
                  <span style={{ flex: 1, textAlign: 'left' }}>{prompt.text}</span>
                  <span style={{ 
                    background: `${prompt.borderColor}20`,
                    borderRadius: '50%',
                    width: '24px',
                    height: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    color: prompt.borderColor
                  }}>→</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Chat Section */}
        <div
          style={{
            background: isDarkMode 
              ? 'linear-gradient(180deg, #1e1b4b 0%, #0f172a 100%)'
              : 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
            borderRadius: '20px',
            border: `2px solid ${isDarkMode ? '#6366f1' : '#c7d2fe'}`,
            display: 'flex',
            flexDirection: 'column',
            height: '600px',
            overflow: 'hidden',
            boxShadow: isDarkMode 
              ? '0 20px 60px rgba(99, 102, 241, 0.2)'
              : '0 20px 60px rgba(99, 102, 241, 0.1)'
          }}
        >
          {/* Chat Header */}
          <div
            style={{
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)',
              color: 'white',
              padding: '24px 28px',
              borderBottom: '1px solid rgba(255,255,255,0.1)',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {/* Decorative circles */}
            <div style={{
              position: 'absolute',
              right: '20px',
              top: '-20px',
              width: '100px',
              height: '100px',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '50%'
            }}></div>
            <div style={{
              position: 'absolute',
              right: '60px',
              bottom: '-30px',
              width: '60px',
              height: '60px',
              background: 'rgba(255,255,255,0.08)',
              borderRadius: '50%'
            }}></div>
            <h3
              style={{
                margin: 0,
                fontSize: '20px',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                position: 'relative',
                zIndex: 1
              }}
            >
              <span style={{
                background: 'rgba(255,255,255,0.2)',
                borderRadius: '10px',
                padding: '8px',
                display: 'flex'
              }}>💬</span>
              Financial Chat
            </h3>
            <p
              style={{
                margin: '8px 0 0 0',
                fontSize: '14px',
                opacity: 0.9,
                position: 'relative',
                zIndex: 1
              }}
            >
              ✨ Ask anything about your finances
            </p>
          </div>

          {/* Messages Container */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              background: isDarkMode
                ? 'linear-gradient(180deg, rgba(15, 23, 42, 0.8) 0%, rgba(30, 27, 75, 0.5) 100%)'
                : 'linear-gradient(180deg, rgba(249, 250, 251, 0.8) 0%, rgba(241, 245, 249, 0.5) 100%)'
            }}
          >
            {chatMessages.length === 0 ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  gap: '12px',
                  color: secondaryTextColor,
                  textAlign: 'center'
                }}
              >
                <div style={{ fontSize: '48px' }}>👋</div>
                <p>Start a conversation with your AI financial advisor!</p>
                <p style={{ fontSize: '13px', opacity: 0.8 }}>
                  Use quick actions above or type your own question
                </p>
              </div>
            ) : (
              chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    justifyContent:
                      msg.type === 'user' ? 'flex-end' : 'flex-start',
                    animation: 'fadeIn 0.3s ease'
                  }}
                >
                  <div
                    style={{
                      maxWidth: '75%',
                      padding: '16px 20px',
                      borderRadius: '12px',
                      background:
                        msg.type === 'user'
                          ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'
                          : isDarkMode
                          ? '#334155'
                          : '#f3f4f6',
                      color: msg.type === 'user' ? 'white' : textColor,
                      fontSize: '14px',
                      lineHeight: '1.6',
                      wordBreak: 'break-word',
                      boxShadow:
                        msg.type === 'user'
                          ? '0 4px 12px rgba(99, 102, 241, 0.3)'
                          : 'none'
                    }}
                  >
                    {msg.type === 'ai' ? renderFormattedMessage(msg.content) : msg.content}
                    {msg.category && msg.type === 'ai' && (
                      <div
                        style={{
                          marginTop: '8px',
                          fontSize: '11px',
                          opacity: 0.7,
                          fontStyle: 'italic'
                        }}
                      >
                        📌 {msg.category}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
            {loading && (
              <div
                style={{
                  display: 'flex',
                  gap: '8px',
                  alignItems: 'center',
                  color: secondaryTextColor
                }}
              >
                <div style={{ fontSize: '20px' }}>🤔</div>
                <div>Thinking...</div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input Area */}
          <div
            style={{
              padding: '20px',
              borderTop: `1px solid ${isDarkMode ? '#4d4a6f' : '#e5e7eb'}`,
              background: isDarkMode 
                ? 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)'
                : 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
              display: 'flex',
              gap: '12px'
            }}
          >
            <input
              type="text"
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && sendMessage()}
              placeholder="✨ Ask me about your finances..."
              style={{
                flex: 1,
                padding: '14px 20px',
                borderRadius: '28px',
                border: `2px solid ${isDarkMode ? '#6366f1' : '#c7d2fe'}`,
                background: isDarkMode ? '#1a1f2e' : 'white',
                color: textColor,
                fontSize: '14px',
                outline: 'none',
                transition: 'all 0.3s ease',
                boxShadow: isDarkMode 
                  ? '0 4px 12px rgba(99, 102, 241, 0.1)'
                  : '0 4px 12px rgba(99, 102, 241, 0.08)'
              }}
              onFocus={e => {
                e.target.style.borderColor = '#8b5cf6';
                e.target.style.boxShadow = '0 0 0 4px rgba(139, 92, 246, 0.2)';
              }}
              onBlur={e => {
                e.target.style.borderColor = isDarkMode ? '#6366f1' : '#c7d2fe';
                e.target.style.boxShadow = isDarkMode 
                  ? '0 4px 12px rgba(99, 102, 241, 0.1)'
                  : '0 4px 12px rgba(99, 102, 241, 0.08)';
              }}
            />
            <button
              onClick={() => sendMessage()}
              disabled={loading || !chatInput.trim()}
              style={{
                padding: '14px 24px',
                background: loading
                  ? 'linear-gradient(135deg, #6b7280 0%, #9ca3af 100%)'
                  : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '28px',
                cursor:
                  loading || !chatInput.trim() ? 'not-allowed' : 'pointer',
                fontSize: '18px',
                fontWeight: '600',
                transition: 'all 0.3s ease',
                boxShadow: loading 
                  ? 'none' 
                  : '0 4px 16px rgba(139, 92, 246, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: '56px'
              }}
              onMouseEnter={e => {
                if (!loading) {
                  e.currentTarget.style.transform = 'scale(1.08)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(139, 92, 246, 0.5)';
                }
              }}
              onMouseLeave={e => {
                if (!loading) {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(139, 92, 246, 0.4)';
                }
              }}
            >
              {loading ? '⏳' : '🚀'}
            </button>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.1); }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  );
}
