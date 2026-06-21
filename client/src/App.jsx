import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useAuth } from './context/AuthContext';

// Public pages
import Landing from './pages/Landing';
import Charities from './pages/Charities';
import CharityProfile from './pages/CharityProfile';
import Subscribe from './pages/Subscribe';
import Login from './pages/Login';
import Register from './pages/Register';
import AuthCallback from './pages/AuthCallback';
import PaymentSuccess from './pages/PaymentSuccess';

// Dashboard Layout and Tabs
import DashboardLayout from './pages/dashboard/Dashboard';
import Overview from './pages/dashboard/tabs/OverviewTab';
import Scores from './pages/dashboard/tabs/ScoresTab';
import Draws from './pages/dashboard/tabs/DrawsTab';
import Winnings from './pages/dashboard/tabs/WinningsTab';
import Settings from './pages/dashboard/tabs/SettingsTab';

// Admin Layout and Sections
import AdminLayout from './pages/admin/Admin';
import AdminDashboard from './pages/admin/sections/AdminDashboard';
import AdminUsers from './pages/admin/sections/AdminUsers';
import AdminDraws from './pages/admin/sections/AdminDraws';
import AdminCharities from './pages/admin/sections/AdminCharities';
import AdminWinners from './pages/admin/sections/AdminWinners';
import AdminAnalytics from './pages/admin/sections/AdminAnalytics';

// Guards
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import SubscriptionGate from './components/SubscriptionGate';
import LoadingScreen from './components/LoadingScreen';

const App = () => {
  const { loading } = useAuth();

  if (loading) return <LoadingScreen />;

  return (
    <AnimatePresence mode="wait">
      <Routes>
        {/* PUBLIC */}
        <Route path="/" element={<Landing />} />
        <Route path="/charities" element={<Charities />} />
        <Route path="/charities/:slug" element={<CharityProfile />} />
        <Route path="/subscribe" element={<Subscribe />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/payment/success" element={<PaymentSuccess />} />

        {/* SUBSCRIBER DASHBOARD — requires login */}
        <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="overview" replace />} />
          <Route path="overview" element={<Overview />} />
          <Route path="scores" element={
            <SubscriptionGate><Scores /></SubscriptionGate>
          } />
          <Route path="draws" element={
            <SubscriptionGate><Draws /></SubscriptionGate>
          } />
          <Route path="winnings" element={
            <SubscriptionGate><Winnings /></SubscriptionGate>
          } />
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* ADMIN PANEL — requires login + admin role */}
        <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="draws" element={<AdminDraws />} />
          <Route path="charities" element={<AdminCharities />} />
          <Route path="winners" element={<AdminWinners />} />
          <Route path="analytics" element={<AdminAnalytics />} />
        </Route>

        {/* CATCH ALL */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
};

export default App;
