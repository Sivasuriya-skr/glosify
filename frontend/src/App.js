import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import ResetPassword from './pages/ResetPassword';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Budgets from './pages/Budgets';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import AIInsights from './pages/AIInsights';
import Analytics from './pages/Analytics';
import Goals from './pages/Goals';
import Community from './pages/Community';
import Welcome from './pages/Welcome';
import Sidebar from './components/Sidebar';
import Export from './pages/Export';
import ProtectedRoute from './components/ProtectedRoute';
import AIFloatingButton from './components/AIFloatingButton';
import { useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { TransactionProvider } from './context/TransactionContext';

function AppContent() {
  const { user } = useAuth();
  const location = useLocation();

  // Pages where Sidebar should be hidden
  const noSidebarRoutes = ['/login', '/register', '/welcome', '/reset-password', '/', '/home'];

  // Force redirect to Welcome page for unauthenticated users trying to access protected routes
  if (!user && location.pathname !== '/' && location.pathname !== '/login' && location.pathname !== '/register' && location.pathname !== '/reset-password' && location.pathname !== '/welcome') {
    return (
      <div className="app">
        <div className="container">
          <Routes>
            <Route path="*" element={<Navigate to="/welcome" replace />} />
          </Routes>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      {/* ✅ Sidebar visible only when user logged in AND not on auth pages */}
      {user && !noSidebarRoutes.includes(location.pathname) && <Sidebar />}
      
      {/* ✅ AI Floating Button - visible when logged in and not on auth pages */}
      {user && !noSidebarRoutes.includes(location.pathname) && <AIFloatingButton />}

      <div className={`container ${noSidebarRoutes.includes(location.pathname) ? 'no-sidebar' : ''}`}>
        <Routes>
          {/* Root path - Always redirect to welcome or home */}
          <Route
            path="/"
            element={<Navigate to={user ? "/home" : "/welcome"} replace />}
          />
          
          {/* Welcome page - shown to non-authenticated users */}
          <Route 
            path="/welcome" 
            element={user ? <Navigate to="/home" replace /> : <Welcome />} 
          />

          {/* Home page - Overview of BudgetWise (after login) */}
          <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />

          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Protected Routes */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/transactions" element={<ProtectedRoute><Transactions /></ProtectedRoute>} />
          <Route path="/budgets" element={<ProtectedRoute><Budgets /></ProtectedRoute>} />
          <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
          <Route path="/goals" element={<ProtectedRoute><Goals /></ProtectedRoute>} />
          <Route path="/ai-insights" element={<ProtectedRoute><AIInsights /></ProtectedRoute>} />
          <Route path="/community" element={<ProtectedRoute><Community /></ProtectedRoute>} />

          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/export" element={<ProtectedRoute><Export /></ProtectedRoute>} />

          {/* Fallback - Redirect any unknown routes to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <TransactionProvider>
        <AppContent />
      </TransactionProvider>
    </ThemeProvider>
  );
}

export default App;