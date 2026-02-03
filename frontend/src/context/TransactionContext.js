import React, { createContext, useState, useCallback } from 'react';
import axios from '../api/axios';

export const TransactionContext = createContext();

export function TransactionProvider({ children }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadTransactions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get('/api/transactions');
      setTransactions(res.data || []);
    } catch (err) {
      setError(err.message);
      console.error('Error loading transactions:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const addTransaction = useCallback(async (txnData) => {
    try {
      const res = await axios.post('/api/transactions', txnData);
      setTransactions(prev => [...prev, res.data]);
      return res.data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const updateTransaction = useCallback(async (id, txnData) => {
    try {
      const res = await axios.put(`/api/transactions/${id}`, txnData);
      setTransactions(prev => prev.map(t => t.id === id ? res.data : t));
      return res.data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const deleteTransaction = useCallback(async (id) => {
    try {
      await axios.delete(`/api/transactions/${id}`);
      setTransactions(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const value = {
    transactions,
    loading,
    error,
    loadTransactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
  };

  return (
    <TransactionContext.Provider value={value}>
      {children}
    </TransactionContext.Provider>
  );
}
