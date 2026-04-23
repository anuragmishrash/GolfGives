import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ChevronRight, LogOut, LayoutDashboard, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => setMobileOpen(false), [location]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const navLinks = [
    { label: 'Charities', to: '/charities' },
    { label: 'How It Works', to: '/#how-it-works' },
    { label: 'Subscribe', to: '/subscribe' },
  ];

  return (
    <>
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-obsidian/90 backdrop-blur-xl border-b border-white/5 shadow-lg'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-emerald-500/30">
                G
              </div>
              <span className="font-display text-warm-white font-semibold text-lg tracking-tight">
                Golf<span className="text-emerald-500">Gives</span>
              </span>
            </Link>

            {/* Desktop links */}
            <div className="hidden md:flex items-center gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`text-sm font-medium transition-colors duration-200 ${
                    location.pathname === link.to
                      ? 'text-emerald-400'
                      : 'text-warm-white/60 hover:text-warm-white'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Desktop CTA */}
            <div className="hidden md:flex items-center gap-3">
              {isAuthenticated ? (
                <>
                  {isAdmin && (
                    <Link to="/admin" className="flex items-center gap-1.5 text-sm text-gold-400 hover:text-gold-300 transition-colors">
                      <Shield size={14} />
                      <span>Admin</span>
                    </Link>
                  )}
                  <Link
                    to="/dashboard"
                    className="flex items-center gap-1.5 text-sm text-warm-white/60 hover:text-warm-white transition-colors"
                  >
                    <LayoutDashboard size={14} />
                    <span>{user?.name?.split(' ')[0]}</span>
                  </Link>
                  <button onClick={handleLogout} className="btn-secondary !py-2 !px-4 !text-sm">
                    <LogOut size={14} />
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="text-sm text-warm-white/60 hover:text-warm-white transition-colors font-medium">
                    Sign in
                  </Link>
                  <Link to="/subscribe" className="btn-primary !py-2.5 !px-5 !text-sm">
                    Get Started
                    <ChevronRight size={14} />
                  </Link>
                </>
              )}
            </div>

            {/* Mobile toggle */}
            <button
              className="md:hidden text-warm-white/60 hover:text-warm-white transition-colors p-2"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed inset-x-0 top-16 z-40 bg-obsidian/95 backdrop-blur-xl border-b border-white/8"
          >
            <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="py-3 px-4 rounded-xl text-warm-white/70 hover:text-warm-white hover:bg-white/5 transition-all font-medium"
                >
                  {link.label}
                </Link>
              ))}
              <div className="h-px bg-white/6 my-2" />
              {isAuthenticated ? (
                <>
                  <Link to="/dashboard" className="py-3 px-4 rounded-xl text-warm-white/70 hover:text-warm-white hover:bg-white/5 transition-all font-medium flex items-center gap-2">
                    <LayoutDashboard size={16} /> Dashboard
                  </Link>
                  {isAdmin && (
                    <Link to="/admin" className="py-3 px-4 rounded-xl text-gold-400/80 hover:text-gold-300 hover:bg-white/5 transition-all font-medium flex items-center gap-2">
                      <Shield size={16} /> Admin Panel
                    </Link>
                  )}
                  <button onClick={handleLogout} className="py-3 px-4 rounded-xl text-left text-warm-white/50 hover:text-warm-white hover:bg-white/5 transition-all font-medium flex items-center gap-2">
                    <LogOut size={16} /> Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="py-3 px-4 rounded-xl text-warm-white/70 hover:text-warm-white hover:bg-white/5 transition-all font-medium">Sign In</Link>
                  <Link to="/subscribe" className="btn-primary mt-2">Get Started</Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
