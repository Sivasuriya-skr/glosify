import React, { useEffect, useState, useContext } from "react";
import axios from "../api/axios";
import { TransactionContext } from "../context/TransactionContext";
import { useTheme } from '../context/ThemeContext';
import "../styles/Transactions.css";

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

const BASE_URL = "/api/transactions";
const DEFAULT_CURRENCIES = [
  "₹ INR - Indian Rupee",
  "$ USD - US Dollar",
  "€ EUR - Euro",
  "£ GBP - British Pound",
  "¥ JPY - Japanese Yen",
  "₩ KRW - Korean Won",
  "A$ AUD - Australian Dollar",
  "C$ CAD - Canadian Dollar"
];

export default function Transactions() {
  const { transactions: globalTransactions, loadTransactions: globalLoadTransactions } = useContext(TransactionContext);
  const { isDarkMode } = useTheme();
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [editing, setEditing] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    description: "",
    amount: "",
    type: "expense",
    category: "Food",
    paymentMethod: "Cash",
    currency: "₹ INR - Indian Rupee",
    date: new Date().toISOString().slice(0, 10)
  });
  const [categories, setCategories] = useState([
    "Salary",
    "Housing",
    "Food",
    "Transport",
    "Shopping",
    "Entertainment",
    "Healthcare",
    "Education",
    "Other"
  ]);
  const [showOtherCategoryInput, setShowOtherCategoryInput] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("All");
  const [filterCategory, setFilterCategory] = useState("All Categories");
  const [filterCurrency, setFilterCurrency] = useState("All Currencies");
  const [selectedCurrency, setSelectedCurrency] = useState("₹ INR - Indian Rupee");
  const [sortBy, setSortBy] = useState("date-desc"); // "date-desc", "date-asc", "alpha-asc", "alpha-desc", "amount-asc", "amount-desc", "category-asc", "category-desc", "currency-asc", "currency-desc"
  const [dateRangeFilter, setDateRangeFilter] = useState(false);
  const [dateRangeStart, setDateRangeStart] = useState("");
  const [dateRangeEnd, setDateRangeEnd] = useState("");
  const [message, setMessage] = useState({ type: '', text: '' });

    // Load categories from backend
  useEffect(() => {
      const loadCategories = async () => {
      try {
          const response = await axios.get('/api/categories');
          const categoryNames = response.data.map(cat => cat.name);
          setCategories(categoryNames);
      } catch (err) {
        console.error('Error loading categories:', err);
          // Fallback to default categories if API fails
          setCategories([
            "Salary",
            "Housing",
            "Food",
            "Transport",
            "Shopping",
            "Entertainment",
            "Healthcare",
            "Education",
            "Other"
          ]);
      }
      };
      loadCategories();
  }, []);

  // Load all transactions on mount
  useEffect(() => {
    globalLoadTransactions();
  }, [globalLoadTransactions]);

  // Apply filters and search
  useEffect(() => {
    let filtered = globalTransactions;

    // Filter by type
    if (filterType !== "All") {
      const typeFilter = filterType.toLowerCase();
      filtered = filtered.filter(
        (t) => {
          const txnType = (t.type || "").toLowerCase();
          return typeFilter === "income" ? txnType === "income" : typeFilter === "expenses" ? txnType === "expense" : true;
        }
      );
    }

    // Filter by category
    if (filterCategory !== "All Categories") {
      filtered = filtered.filter((t) => t.category === filterCategory);
    }

    // Filter by currency
    if (filterCurrency !== "All Currencies") {
      filtered = filtered.filter((t) => (t.currency || "₹ INR - Indian Rupee") === filterCurrency);
    }

    // Search by description
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          (t.description && t.description.toLowerCase().includes(term)) ||
          (t.category && t.category.toLowerCase().includes(term))
      );
    }

    // Filter by date range
    if (dateRangeFilter && dateRangeStart && dateRangeEnd) {
      const startDate = new Date(dateRangeStart);
      const endDate = new Date(dateRangeEnd);
      // Set end date to end of day (23:59:59)
      endDate.setHours(23, 59, 59, 999);
      
      filtered = filtered.filter((t) => {
        const txnDate = new Date(t.date);
        return txnDate >= startDate && txnDate <= endDate;
      });
    }

    // Apply sorting - Create a copy to avoid mutating
    const sorted = [...filtered];
    
    if (sortBy === "date-desc") {
      sorted.sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return dateB - dateA;
      });
    } else if (sortBy === "date-asc") {
      sorted.sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return dateA - dateB;
      });
    } else if (sortBy === "alpha-asc") {
      sorted.sort((a, b) => {
        const descA = (a.description || "").toLowerCase();
        const descB = (b.description || "").toLowerCase();
        return descA.localeCompare(descB);
      });
    } else if (sortBy === "alpha-desc") {
      sorted.sort((a, b) => {
        const descA = (a.description || "").toLowerCase();
        const descB = (b.description || "").toLowerCase();
        return descB.localeCompare(descA);
      });
    } else if (sortBy === "amount-asc") {
      sorted.sort((a, b) => {
        const amountA = parseFloat(a.amount) || 0;
        const amountB = parseFloat(b.amount) || 0;
        return amountA - amountB;
      });
    } else if (sortBy === "amount-desc") {
      sorted.sort((a, b) => {
        const amountA = parseFloat(a.amount) || 0;
        const amountB = parseFloat(b.amount) || 0;
        return amountB - amountA;
      });
    } else if (sortBy === "category-asc") {
      sorted.sort((a, b) => {
        const catA = (a.category || "").toLowerCase();
        const catB = (b.category || "").toLowerCase();
        return catA.localeCompare(catB);
      });
    } else if (sortBy === "category-desc") {
      sorted.sort((a, b) => {
        const catA = (a.category || "").toLowerCase();
        const catB = (b.category || "").toLowerCase();
        return catB.localeCompare(catA);
      });
    } else if (sortBy === "currency-asc") {
      sorted.sort((a, b) => {
        const curA = (a.currency || "").toLowerCase();
        const curB = (b.currency || "").toLowerCase();
        return curA.localeCompare(curB);
      });
    } else if (sortBy === "currency-desc") {
      sorted.sort((a, b) => {
        const curA = (a.currency || "").toLowerCase();
        const curB = (b.currency || "").toLowerCase();
        return curB.localeCompare(curA);
      });
    }

    setFilteredTransactions(sorted);
  }, [globalTransactions, searchTerm, filterType, filterCategory, filterCurrency, sortBy, dateRangeFilter, dateRangeStart, dateRangeEnd]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));

    // Dynamic category input trigger
    if (name === "category") {
      if (value === "Other") {
        setShowOtherCategoryInput(true);
      } else {
        setShowOtherCategoryInput(false);
        setNewCategory("");
      }
    }
  };

    const handleOtherCategorySubmit = async () => {
    if (!newCategory.trim()) {
      setMessage({ type: 'error', text: 'Please enter a category name' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      return;
    }
    
    // Check if category already exists (case-insensitive)
    const normalizedNewCategory = newCategory.trim().toLowerCase();
    if (categories.some(cat => cat.toLowerCase() === normalizedNewCategory)) {
      setMessage({ type: 'error', text: 'This category already exists' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      return;
    }

    try {
      // Verify user is logged in
      const token = localStorage.getItem('bw_token') || localStorage.getItem('token');
      if (!token) {
        setMessage({ type: 'error', text: 'Please login to add categories' });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        return;
      }

      // Save to backend
      const response = await axios.post('/api/categories', {
        name: newCategory.trim()
      });
      
      console.log('Category saved successfully:', response.data);
      
      // Reload all categories from backend to ensure they're in sync
      const categoriesResponse = await axios.get('/api/categories');
      const categoryNames = categoriesResponse.data.map(cat => cat.name);
      setCategories(categoryNames);
      
      // Set form category to the new category
      const newCategoryName = newCategory.trim();
      setForm((f) => ({ ...f, category: newCategoryName }));
      
      // Close input and reset
      setShowOtherCategoryInput(false);
      setNewCategory("");
      
      setMessage({ type: 'success', text: `Category "${newCategoryName}" added successfully! It's now available in filters.` });
      setTimeout(() => setMessage({ type: '', text: '' }), 4000);
    } catch (err) {
      console.error('Error saving category:', err);
      console.error('Error response:', err.response);
      
      // Better error handling
      let errorMsg = 'Failed to save category';
      if (err.response?.status === 401 || err.response?.status === 403) {
        errorMsg = 'Authentication failed. Please logout and login again.';
      } else if (err.response?.status === 409) {
        errorMsg = 'This category already exists in the database';
      } else if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
      } else if (err.message) {
        errorMsg = err.message;
      }
      
      setMessage({ type: 'error', text: errorMsg });
      setTimeout(() => setMessage({ type: '', text: '' }), 4000);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      // Validate form
      if (!form.description.trim()) {
        setMessage({ type: 'error', text: 'Please enter a description' });
        setLoading(false);
        return;
      }
      if (!form.amount || parseFloat(form.amount) <= 0) {
        setMessage({ type: 'error', text: 'Please enter a valid amount' });
        setLoading(false);
        return;
      }

      // Convert date to ISO format with time
      const dateObj = new Date(form.date);
      dateObj.setHours(12, 0, 0, 0); // Set to noon to avoid timezone issues
      
      const payload = {
        description: form.description,
        amount: parseFloat(form.amount),
        type: form.type, // Keep as is: "income" or "expense" (from form default)
        category: form.category,
        paymentMethod: form.paymentMethod,
        currency: form.currency,
        date: dateObj.toISOString()
      };

      console.log("Sending payload:", payload);

      if (editing) {
        await axios.put(`${BASE_URL}/${editing}`, payload);
        console.log("Update successful");
      } else {
        await axios.post(BASE_URL, payload);
        console.log("Create successful");
      }

      // Reload transactions from global context
      await globalLoadTransactions();
      resetForm();
      closeModal();
    } catch (err) {
      console.error("Error saving transaction:", err);
      if (err.response) {
        console.error("Response data:", err.response.data);
        console.error("Response status:", err.response.status);
        setMessage({ type: 'error', text: getErrorMessage(err, 'Unable to save transaction. Please try again.') });
      } else if (err.request) {
        console.error("No response received:", err.request);
        setMessage({ type: 'error', text: 'Unable to connect to server. Please check your internet connection.' });
      } else {
        setMessage({ type: 'error', text: getErrorMessage(err, 'Unable to save transaction. Please try again.') });
      }
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({
      description: "",
      amount: "",
      type: "expense",
      category: "Food",
      paymentMethod: "Cash",
      currency: "₹ INR - Indian Rupee",
      date: new Date().toISOString().slice(0, 10)
    });
    setEditing(null);
    setShowOtherCategoryInput(false);
  };

  const handleEdit = (txn) => {
    setEditing(txn.id);
    setForm({
      description: txn.description,
      amount: txn.amount,
      type: txn.type,
      category: txn.category,
      paymentMethod: txn.paymentMethod,
      currency: txn.currency || "₹ INR - Indian Rupee",
      date: txn.date.slice(0, 10)
    });
    setShowOtherCategoryInput(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this transaction?")) return;
    await axios.delete(`${BASE_URL}/${id}`);
    await globalLoadTransactions();
  };

  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) {
      setMessage({ type: 'error', text: 'No transactions to export' });
      return;
    }

    const csvHeader = ["Description", "Amount", "Category", "Type", "Date", "Payment Method"].join(",");
    const csvRows = filteredTransactions.map((t) => [
      `"${t.description || ""}"`,
      t.amount,
      t.category,
      t.type,
      new Date(t.date).toLocaleDateString(),
      t.paymentMethod
    ].join(","));

    const csv = [csvHeader, ...csvRows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transactions_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const openModal = (txn = null) => {
    if (txn) {
      setEditing(txn.id);
      setForm({
        description: txn.description || "",
        amount: txn.amount,
        type: txn.type,
        category: txn.category,
        paymentMethod: txn.paymentMethod,
        currency: txn.currency || "₹ INR - Indian Rupee",
        date: new Date(txn.date).toISOString().slice(0, 10)
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };

  return (
    <div className="transactions-page">
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
      {/* Header with Export & Currency */}
      <div className="page-title-card" style={{
        background: isDarkMode 
          ? 'linear-gradient(135deg, #2e1065 0%, #3b0764 25%, #4c1d95 50%, #5b21b6 75%, #6d28d9 100%)'
          : 'linear-gradient(135deg, #e9d5ff 0%, #d8b4fe 25%, #c4b5fd 50%, #a78bfa 75%, #8b5cf6 100%)',
        boxShadow: isDarkMode 
          ? '0 10px 40px rgba(91, 33, 182, 0.3), 0 0 60px rgba(139, 92, 246, 0.1)'
          : '0 8px 32px rgba(139, 92, 246, 0.2), 0 0 60px rgba(167, 139, 250, 0.15)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
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
            }}>Transactions</span>
            <span style={{ WebkitTextFillColor: 'initial' }}>💳</span>
          </h1>
          <p style={{ color: isDarkMode ? 'rgba(255,255,255,0.85)' : 'rgba(88, 28, 135, 0.8)', fontSize: '15px', margin: 0, fontWeight: '500' }}>Track all your income and expenses</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>
          <button onClick={() => openModal()} style={{
            padding: '10px 20px',
            background: isDarkMode ? '#334155' : '#ffffff',
            border: isDarkMode ? '1px solid #475569' : '1px solid #e2e8f0',
            borderRadius: '10px',
            color: isDarkMode ? '#e2e8f0' : '#1e293b',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
          }}>
            ➕ Add Transaction
          </button>
          <button onClick={handleExportCSV} style={{
            padding: '10px 20px',
            background: isDarkMode ? '#334155' : '#ffffff',
            border: isDarkMode ? '1px solid #475569' : '1px solid #e2e8f0',
            borderRadius: '10px',
            color: isDarkMode ? '#e2e8f0' : '#1e293b',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
          }}>
            📥 Export CSV
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: isDarkMode ? '#94a3b8' : '#64748b' }}>💱</span>
            <select value={selectedCurrency} onChange={(e) => setSelectedCurrency(e.target.value)} style={{
              padding: '10px 16px',
              background: isDarkMode ? '#334155' : '#ffffff',
              border: isDarkMode ? '1px solid #475569' : '1px solid #e2e8f0',
              borderRadius: '8px',
              color: isDarkMode ? '#e2e8f0' : '#1e293b',
              fontWeight: '500',
              cursor: 'pointer'
            }}>
              {DEFAULT_CURRENCIES.map((cur) => (
                <option key={cur}>{cur}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="filters-section">
        <input
          type="text"
          className="search-bar"
          placeholder="Search transactions..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <div className="filter-buttons">
          {["All", "Income", "Expenses"].map((btn) => (
            <button
              key={btn}
              className={`filter-btn ${filterType === btn ? "active" : ""}`}
              onClick={() => setFilterType(btn)}
            >
              {btn}
            </button>
          ))}
        </div>

        <select
          className="filter-select"
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
        >
          <option>All Categories</option>
          {categories.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>

        <select 
          className="filter-select"
          value={filterCurrency}
          onChange={(e) => setFilterCurrency(e.target.value)}
        >
          <option>All Currencies</option>
          {DEFAULT_CURRENCIES.map((cur) => (
            <option key={cur}>{cur}</option>
          ))}
        </select>

        <select
          className="filter-select"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          title="Sort transactions"
        >
          <option value="date-desc">📅 Newest First</option>
          <option value="date-asc">📅 Oldest First</option>
          <option value="alpha-asc">📝 A-Z (Description)</option>
          <option value="alpha-desc">📝 Z-A (Description)</option>
          <option value="amount-asc">💰 Amount: Low to High</option>
          <option value="amount-desc">💰 Amount: High to Low</option>
          <option value="category-asc">📂 Category: A-Z</option>
          <option value="category-desc">📂 Category: Z-A</option>
          <option value="currency-asc">💱 Currency: A-Z</option>
          <option value="currency-desc">💱 Currency: Z-A</option>
        </select>

        <button
          className={`filter-btn ${dateRangeFilter ? "active" : ""}`}
          onClick={() => setDateRangeFilter(!dateRangeFilter)}
          title="Toggle date range filter"
        >
          📅 Date Range
        </button>
      </div>

      {/* Date Range Filter Inputs */}
      {dateRangeFilter && (
        <div className="date-range-filter">
          <div className="date-range-inputs">
            <div className="date-input-group">
              <label>From Date</label>
              <input
                type="date"
                value={dateRangeStart}
                onChange={(e) => setDateRangeStart(e.target.value)}
                className="date-input"
              />
            </div>
            <div className="date-input-group">
              <label>To Date</label>
              <input
                type="date"
                value={dateRangeEnd}
                onChange={(e) => setDateRangeEnd(e.target.value)}
                className="date-input"
              />
            </div>
            <button
              className="btn secondary"
              onClick={() => {
                setDateRangeStart("");
                setDateRangeEnd("");
              }}
              title="Clear date range"
            >
              Clear Dates
            </button>
          </div>
        </div>
      )}

      {/* Transaction List */}
      <div className="transactions-list">
        {filteredTransactions.length === 0 ? (
          <div className="empty-state">
            <p>No transactions found</p>
          </div>
        ) : (
          filteredTransactions.map((t) => (
            <div
              key={t.id}
              className={`transaction-card ${
                (t.type || "").toLowerCase() === "income" ? "income" : "expense"
              }`}
            >
              <div className="transaction-card-left">
                <div className="txn-icon">
                  {(t.type || "").toLowerCase() === "income" ? "↑" : "↓"}
                </div>
                <div className="txn-info">
                  <div className="txn-description">{t.description}</div>
                  <div className="txn-meta">
                    {t.category} • {new Date(t.date).toLocaleDateString()} • {t.paymentMethod}
                  </div>
                </div>
              </div>
              <div className="transaction-card-right">
                <div className="txn-currency">
                  {t.currency || "₹ INR"}
                </div>
                <div className={`txn-amount ${(t.type || "").toLowerCase() === "income" ? "income" : "expense"}`}>
                  {(t.type || "").toLowerCase() === "income" ? "+" : "-"}
                  {typeof t.amount === 'number' ? t.amount.toFixed(2) : t.amount}
                </div>
                <div className="transaction-actions">
                  <button
                    className="icon-btn edit-btn"
                    onClick={() => openModal(t)}
                    title="Edit"
                  >
                    ✏️
                  </button>
                  <button
                    className="icon-btn delete-btn"
                    onClick={() => handleDelete(t.id)}
                    title="Delete"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Floating Action Button */}


      {/* Modal Overlay */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editing ? "Edit Transaction" : "Add Transaction"}</h2>
              <button className="close-btn" onClick={closeModal}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="transaction-form">
              <div className="form-group">
                <label>Description</label>
                <input
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Enter transaction description"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Type</label>
                  <select name="type" value={form.type} onChange={handleChange}>
                    <option value="income">Income</option>
                    <option value="expense">Expense</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <select
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                  >
                    {categories.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Custom Category Input - Shows when "Other" is selected */}
              {form.category === "Other" && (
                <div className="form-group">
                  <label>Enter New Category Name</label>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <input
                      type="text"
                      placeholder="e.g., Groceries, Utilities, etc."
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      style={{ flex: 1 }}
                    />
                    <button
                      type="button"
                      className="btn primary"
                      onClick={handleOtherCategorySubmit}
                      style={{ padding: "10px 16px" }}
                    >
                      Add Category
                    </button>
                  </div>
                </div>
              )}

              <div className="form-row">
                <div className="form-group">
                  <label>Amount</label>
                  <input
                    type="number"
                    name="amount"
                    value={form.amount}
                    onChange={handleChange}
                    placeholder="0.00"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Currency</label>
                  <select
                    name="currency"
                    value={form.currency}
                    onChange={handleChange}
                  >
                    {DEFAULT_CURRENCIES.map((cur) => (
                      <option key={cur}>{cur}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Date</label>
                  <input
                    type="date"
                    name="date"
                    value={form.date}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label>Payment Method</label>
                  <select
                    name="paymentMethod"
                    value={form.paymentMethod}
                    onChange={handleChange}
                  >
                    <option>Cash</option>
                    <option>Card</option>
                    <option>UPI</option>
                    <option>Bank Transfer</option>
                  </select>
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn secondary" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="btn primary" disabled={loading}>
                  {loading ? "Saving..." : editing ? "Update Transaction" : "Add Transaction"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
