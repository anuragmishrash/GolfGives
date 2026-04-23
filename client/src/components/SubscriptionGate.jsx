import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Lock } from 'lucide-react';
import { Link } from 'react-router-dom';

const SubscriptionGate = ({ children, fallback }) => {
  const { isActiveSubscriber, isAdmin } = useAuth();

  // Active subscribers and admins can bypass the gate
  if (isActiveSubscriber || isAdmin) {
    return children;
  }

  // If a custom fallback is provided, use it
  if (fallback) {
    return fallback;
  }

  // Default locked state UI
  return (
    <div className="w-full h-full min-h-[400px] flex items-center justify-center p-6">
      <div className="glass-card max-w-md w-full p-8 text-center border-red-500/20 relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 bg-red-500/5 pointer-events-none" />
        
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6 text-red-400">
          <Lock size={32} />
        </div>
        
        <h2 className="font-display text-2xl font-bold text-warm-white mb-3">
          Active Subscription Required
        </h2>
        
        <p className="text-warm-white/70 mb-8 leading-relaxed">
          Reactivate your plan to access scores, draws, and prizes. Don't miss out on the next big draw!
        </p>
        
        <Link 
          to="/subscribe" 
          className="btn-primary w-full shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)]"
        >
          Reactivate Subscription
        </Link>
      </div>
    </div>
  );
};

export default SubscriptionGate;
