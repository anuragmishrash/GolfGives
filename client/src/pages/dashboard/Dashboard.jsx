import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Target, Trophy, DollarSign, Settings,
  Menu, X, LogOut, ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';

// Tab Components
import OverviewTab from './tabs/OverviewTab';
import ScoresTab from './tabs/ScoresTab';
import DrawsTab from './tabs/DrawsTab';
import WinningsTab from './tabs/WinningsTab';
import SettingsTab from './tabs/SettingsTab';

const tabs = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard, path: '' },
  { id: 'scores', label: 'My Scores', icon: Target, path: 'scores' },
  { id: 'draws', label: 'My Draws', icon: Trophy, path: 'draws' },
  { id: 'winnings', label: 'Winnings', icon: DollarSign, path: 'winnings' },
  { id: 'settings', label: 'Settings', icon: Settings, path: 'settings' },
];



const Dashboard = () => {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const activeTab = location.pathname.split('/dashboard/')[1] || '';

  const handleLogout = async () => { await logout(); navigate('/'); };

  return (
    <div className="min-h-screen bg-obsidian flex flex-col">
      {/* Top bar (mobile) */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 h-14 border-b border-white/6 bg-obsidian/95 backdrop-blur-xl">
        <Link to="/" className="font-display text-warm-white font-semibold text-base">
          Golf<span className="text-emerald-500">Gives</span>
        </Link>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-warm-white/60 hover:text-warm-white p-2">
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      <div className="flex flex-1 pt-14 lg:pt-0">
        {/* Sidebar */}
        <AnimatePresence>
          {(sidebarOpen || true) && (
            <motion.aside
              initial={false}
              className={`
                ${sidebarOpen ? 'fixed inset-y-0 left-0 z-30' : 'hidden lg:flex'}
                lg:relative lg:flex flex-col w-64 border-r border-white/6 bg-obsidian/95 backdrop-blur-xl lg:bg-transparent lg:backdrop-blur-none pt-14 lg:pt-0
              `}
            >
              <div className="flex flex-col h-full py-6 px-4">
                {/* Logo */}
                <div className="hidden lg:flex items-center gap-2 px-2 mb-8">
                  <div className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold text-xs">G</div>
                  <span className="font-display text-warm-white font-semibold">
                    Golf<span className="text-emerald-500">Gives</span>
                  </span>
                </div>

                {/* User card */}
                <div className="glass-card p-4 mb-6">
                  <div className="w-9 h-9 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-sm mb-2">
                    {user?.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div className="text-warm-white text-sm font-medium truncate">{user?.name}</div>
                  <div className={`badge-${user?.subscriptionStatus === 'active' ? 'emerald' : 'gray'} mt-1.5 text-xs`}>
                    {user?.subscriptionStatus || 'inactive'}
                  </div>
                </div>

                {/* Nav links */}
                <nav className="flex-1 space-y-1">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.path;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => {
                          navigate(`/dashboard${tab.path ? '/' + tab.path : ''}`);
                          setSidebarOpen(false);
                        }}
                        className={`sidebar-link ${isActive ? 'active' : ''}`}
                      >
                        <Icon size={16} />
                        {tab.label}
                      </button>
                    );
                  })}
                </nav>

                {/* Bottom actions */}
                <div className="mt-4 pt-4 border-t border-white/6 space-y-1">
                  <button onClick={handleLogout} className="sidebar-link text-red-400/60 hover:text-red-400 hover:bg-red-500/5">
                    <LogOut size={16} />
                    Sign Out
                  </button>
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Mobile overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        {/* Main content */}
        <main className="flex-1 overflow-x-hidden min-h-screen">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 lg:py-10">
            <AnimatePresence mode="wait">
              <Outlet />
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
};



export default Dashboard;
