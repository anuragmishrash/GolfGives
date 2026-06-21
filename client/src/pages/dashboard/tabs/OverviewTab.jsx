import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy, Heart, Calendar, TrendingUp, ChevronRight, Clock, AlertCircle } from 'lucide-react';
import { format, endOfMonth } from 'date-fns';
import { useAuth } from '../../../context/AuthContext';
import { useSubscription } from '../../../context/SubscriptionContext';
import { subscriptionAPI } from '../../../api/subscription';
import { getPrizePool } from '../../../api/prizePool';
import { supabase } from '../../../lib/supabase';
import toast from 'react-hot-toast';

// ── Draw Countdown ─────────────────────────────────────────────────────────────
const DrawCountdown = () => {
  const [timeLeft, setTimeLeft] = useState({});

  useEffect(() => {
    const calc = () => {
      const now = new Date();
      const end = endOfMonth(now);
      end.setHours(23, 59, 59);
      const diff = end - now;
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft({ days, hours, mins, secs });
    };
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, []);

  const units = [
    { label: 'Days', value: timeLeft.days },
    { label: 'Hours', value: timeLeft.hours },
    { label: 'Mins', value: timeLeft.mins },
    { label: 'Secs', value: timeLeft.secs },
  ];

  return (
    <div className="flex gap-3">
      {units.map(({ label, value }) => (
        <div key={label} className="text-center">
          <div className="glass-card px-3 py-2 text-center min-w-[52px]">
            <div className="font-display text-2xl font-bold text-warm-white">
              {String(value ?? 0).padStart(2, '0')}
            </div>
          </div>
          <div className="text-warm-white/30 text-xs mt-1">{label}</div>
        </div>
      ))}
    </div>
  );
};

const KPICard = ({ icon: Icon, label, value, sub, color = 'emerald', delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.4 }}
    className="glass-card p-5"
  >
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${
      color === 'emerald' ? 'bg-emerald-500/10 text-emerald-400' :
      color === 'gold' ? 'bg-gold-500/10 text-gold-400' :
      'bg-white/6 text-warm-white/60'
    }`}>
      <Icon size={18} />
    </div>
    <div className="text-warm-white/50 text-xs font-medium uppercase tracking-wider mb-1">{label}</div>
    <div className="font-display text-2xl font-bold text-warm-white">{value}</div>
    {sub && <div className="text-warm-white/35 text-xs mt-1">{sub}</div>}
  </motion.div>
);

const OverviewTab = () => {
  const { user, refreshUser } = useAuth();
  const { subscription, isActive } = useSubscription();
  const location = useLocation();
  const navigate = useNavigate();
  const [verifying, setVerifying] = useState(false);
  const [totalPrize, setTotalPrize] = useState(0);
  const [scoresCount, setScoresCount] = useState(0);

  useEffect(() => {
    const fetchDashboardData = async () => {
      // Fetch dynamic prize pool
      const pool = await getPrizePool();
      setTotalPrize(pool.total);

      // Fetch dynamic score count for current user
      if (user?.id) {
        const { count } = await supabase
          .from('scores')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);
        setScoresCount(count || 0);
      }
    };
    fetchDashboardData();
  }, [user?.id]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const sessionId = params.get('session_id');
    
    if (sessionId) {
      const verify = async () => {
        try {
          setVerifying(true);
          await subscriptionAPI.verifySession(sessionId);
          await refreshUser(); // Fetch updated active profile
          toast.success('Subscription activated successfully! 🎉');
        } catch (err) {
          console.error('Session verify failed:', err);
        } finally {
          setVerifying(false);
          // Clear URL query params
          navigate('/dashboard/overview', { replace: true });
        }
      };
      verify();
    }
  }, [location, navigate, refreshUser]);

  const eligible = scoresCount === 5 && isActive;

  return (
    <motion.div
      key="overview"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
    >
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-3xl text-warm-white font-bold">
          Good to see you, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-warm-white/40 text-sm mt-1">
          {format(new Date(), 'EEEE, MMMM d, yyyy')}
        </p>
      </div>

      {/* Subscription Status Banner */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mb-6"
      >
        {verifying && (
          <div className="flex items-center justify-between gap-3 rounded-xl p-4 bg-emerald-500/8 border border-emerald-500/20 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin" />
              <div className="text-warm-white text-sm font-medium">
                Verifying your payment securely...
              </div>
            </div>
          </div>
        )}

        {!verifying && isActive && (
          <div className="flex items-start justify-between gap-3 rounded-xl p-4 bg-emerald-500/8 border border-emerald-500/20">
            <div className="flex items-center gap-3">
              <AlertCircle size={18} className="text-emerald-400" />
              <div className="text-warm-white text-sm font-medium">
                Your subscription is active {subscription?.subscription_renewal_date && `· Renews on ${format(new Date(subscription.subscription_renewal_date), 'MMM d, yyyy')}`}
              </div>
            </div>
            {!eligible && (
              <div className="text-emerald-400 text-sm font-medium">
                Need {5 - scoresCount} more scores to enter draw!
              </div>
            )}
          </div>
        )}

        {!verifying && subscription?.subscription_status === 'inactive' && (
          <div className="flex items-center justify-between gap-3 rounded-xl p-4 bg-gold-500/8 border border-gold-500/20">
            <div className="flex items-center gap-3">
              <AlertCircle size={18} className="text-gold-400" />
              <div className="text-warm-white text-sm font-medium">
                You don't have an active subscription
              </div>
            </div>
            <Link to="/subscribe" className="btn-primary !py-1.5 !px-4 !text-xs">
              Subscribe Now
            </Link>
          </div>
        )}

        {subscription?.subscription_status === 'cancelled' && (
          <div className="flex items-center justify-between gap-3 rounded-xl p-4 bg-gold-500/8 border border-gold-500/20">
            <div className="flex items-center gap-3">
              <AlertCircle size={18} className="text-gold-400" />
              <div className="text-warm-white text-sm font-medium">
                Your subscription has been cancelled {subscription.subscription_renewal_date && `· Access ends on ${format(new Date(subscription.subscription_renewal_date), 'MMM d, yyyy')}`}
              </div>
            </div>
            <Link to="/subscribe" className="btn-primary !py-1.5 !px-4 !text-xs">
              Resubscribe
            </Link>
          </div>
        )}

        {subscription?.subscription_status === 'lapsed' && (
          <div className="flex items-center justify-between gap-3 rounded-xl p-4 bg-red-500/8 border border-red-500/20">
            <div className="flex items-center gap-3">
              <AlertCircle size={18} className="text-red-400" />
              <div className="text-warm-white text-sm font-medium">
                Your last payment failed · Please update your payment method
              </div>
            </div>
            <Link to="/subscribe" className="btn-primary !bg-red-500 !shadow-[0_0_15px_rgba(239,68,68,0.3)] hover:!shadow-[0_0_20px_rgba(239,68,68,0.5)] !py-1.5 !px-4 !text-xs border-none">
              Reactivate
            </Link>
          </div>
        )}
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KPICard
          icon={Trophy}
          label="Prize Pool"
          value={`£${totalPrize.toFixed(2)}`}
          sub="This month, all tiers"
          color="gold"
          delay={0}
        />
        <KPICard
          icon={TrendingUp}
          label="Scores Entered"
          value={`${scoresCount}/5`}
          sub={eligible ? '✓ Draw eligible' : `Need ${5 - scoresCount} to enter`}
          color={eligible ? 'emerald' : 'gray'}
          delay={0.1}
        />
        <KPICard
          icon={Heart}
          label="Charity Contribution"
          value={`${user?.charityContributionPercent || 10}%`}
          sub={user?.selectedCharityId ? 'Your chosen charity' : 'No charity selected'}
          color="emerald"
          delay={0.2}
        />
        <KPICard
          icon={Calendar}
          label="Subscription"
          value={isActive ? 'Active' : 'Inactive'}
          sub={subscription?.subscription_renewal_date
            ? `Renews ${format(new Date(subscription.subscription_renewal_date), 'MMM d')}`
            : isActive ? 'Ongoing' : 'Subscribe to play'
          }
          color={isActive ? 'emerald' : 'gray'}
          delay={0.3}
        />
      </div>

      {/* Countdown + Charity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Countdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card p-6"
        >
          <div className="flex items-center gap-2 mb-5">
            <Clock size={16} className="text-emerald-400" />
            <h3 className="text-warm-white/60 text-sm font-medium uppercase tracking-wider">Next Draw In</h3>
          </div>
          <DrawCountdown />
          <p className="text-warm-white/30 text-xs mt-4">
            Draw happens at end of {format(new Date(), 'MMMM yyyy')}
          </p>
        </motion.div>

        {/* Charity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-card p-6"
        >
          <div className="flex items-center gap-2 mb-5">
            <Heart size={16} className="text-emerald-400" />
            <h3 className="text-warm-white/60 text-sm font-medium uppercase tracking-wider">Your Charity</h3>
          </div>
          {user?.selectedCharityId ? (
            <>
              <div className="text-warm-white font-semibold mb-1">{user.selectedCharityId.name || 'Selected Charity'}</div>
              <div className="text-warm-white/35 text-sm">{user.charityContributionPercent || 10}% of your subscription goes here</div>
            </>
          ) : (
            <div>
              <div className="text-warm-white/40 text-sm mb-3">No charity selected yet</div>
              <Link to="/dashboard/settings" className="btn-secondary !py-2 !px-4 !text-xs">
                Choose a Charity <ChevronRight size={12} />
              </Link>
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
};

export default OverviewTab;
