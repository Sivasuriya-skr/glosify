import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }){
  const { user } = useAuth();
  const token = localStorage.getItem('bw_token') || localStorage.getItem('token');
  
  // Check both user context and token existence
  if(!user || !token) {
    console.warn("No user or token found, redirecting to welcome page");
    return <Navigate to="/welcome" replace />;
  }
  
  return children;
}
