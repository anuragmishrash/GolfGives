import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Users, Trophy, Heart, Award, BarChart2,
  Menu, X, LogOut, Shield
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

// Section Components
import AdminDashboard from './sections/AdminDashboard';
import AdminUsers from './sections/AdminUsers';
import AdminDraws from './sections/AdminDraws';
import AdminCharities from './sections/AdminCharities';
import AdminWinners from './sections/AdminWinners';
import AdminAnalytics from './sections/AdminAnalytics';

const sections = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '' },
  { id: 'users', label: 'Users', icon: Users, path: 'users' },
  { id: 'draws', label: 'Draw Management', icon: Trophy, path: 'draws' },
  { id: 'charities', label: 'Charities', icon: Heart, path: 'charities' },
  { id: 'winners', label: 'Winners', icon: Award, path: 'winners' },
  { id: 'analytics', label: 'Analytics', icon: BarChart2, path: 'analytics' },
];

const Admin = () => {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const activeSection = location.pathname.split('/admin/')[1] || '';
  const handleLogout = async () => { await logout(); navigate('/'); };

  return (
    <div className="min-h-screen bg-obsidian flex flex-col">
      {/* Mobile Top Bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 h-14 border-b border-white/6 bg-obsidian/95 backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <Shield size={16} className="text-gold-400" />
          <span className="font-display text-warm-white font-semibold text-sm">Admin Panel</span>
        </div>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-warm-white/60 hover:text-warm-white p-2">
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      <div className="flex flex-1 pt-14 lg:pt-0">
        {/* Sidebar */}
        <aside className={`
          ${sidebarOpen ? 'fixed inset-y-0 left-0 z-30' : 'hidden lg:flex'}
          lg:relative lg:flex flex-col w-64 border-r border-white/6 bg-obsidian/95 backdrop-blur-xl lg:bg-transparent pt-14 lg:pt-0
        `}>
          <div className="flex flex-col h-full py-6 px-4">
            {/* Logo */}
            <div className="hidden lg:flex items-center gap-2 px-2 mb-8">
              <div className="w-7 h-7 rounded-full bg-gold-500/20 flex items-center justify-center">
                <Shield size={14} className="text-gold-400" />
              </div>
              <div>
                <div className="font-display text-warm-white font-semibold text-sm leading-tight">GolfGives</div>
                <div className="text-warm-white/30 text-xs">Admin Panel</div>
              </div>
            </div>

            {/* Admin User Card */}
            <div className="glass-card p-4 mb-6 border-gold-500/15">
              <div className="w-9 h-9 rounded-full bg-gold-500/20 flex items-center justify-center text-gold-400 font-bold text-sm mb-2">
                {user?.name?.charAt(0)?.toUpperCase()}
              </div>
              <div className="text-warm-white text-sm font-medium truncate">{user?.name}</div>
              <div className="badge-gold mt-1.5 text-xs">Administrator</div>
            </div>

            {/* Nav */}
            <nav className="flex-1 space-y-1">
              {sections.map((section) => {
                const Icon = section.icon;
                const isActive = activeSection === section.path;
                return (
                  <button
                    key={section.id}
                    onClick={() => {
                      navigate(`/admin${section.path ? '/' + section.path : ''}`);
                      setSidebarOpen(false);
                    }}
                    className={`sidebar-link ${isActive ? 'active' : ''}`}
                  >
                    <Icon size={16} />
                    {section.label}
                  </button>
                );
              })}
            </nav>

            <div className="mt-4 pt-4 border-t border-white/6 space-y-1">
              <Link to="/dashboard" className="sidebar-link">
                <LayoutDashboard size={16} />
                User Dashboard
              </Link>
              <button onClick={handleLogout} className="sidebar-link text-red-400/60 hover:text-red-400 hover:bg-red-500/5">
                <LogOut size={16} />
                Sign Out
              </button>
            </div>
          </div>
        </aside>

        {/* Overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        {/* Main */}
        <main className="flex-1 overflow-x-hidden min-h-screen">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 lg:py-10">
            <AnimatePresence mode="wait">
              <Outlet />
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Admin;
