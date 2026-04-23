import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, ChevronRight, Trophy, Heart, Zap, Star, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { subscriptionAPI } from '../api/subscription';
import { useAuth } from '../context/AuthContext';

const plans = [
  {
    id: 'monthly',
    name: 'Monthly',
    price: '9.99',
    period: '/month',
    description: 'Perfect for trying out GolfGives',
    badge: null,
    features: [
      'Monthly draw entry',
      'Score tracking (up to 5)',
      'Charity contribution (min 10%)',
      'Full prize pool access',
      'Winner verification portal',
    ],
  },
  {
    id: 'yearly',
    name: 'Yearly',
    price: '99.99',
    period: '/year',
    description: 'Save 17% — best value for committed players',
    badge: 'Best Value',
    savings: 'Save £19.89',
    features: [
      'Everything in Monthly',
      '2 months free',
      'Priority winner verification',
      'Exclusive yearly badge',
      'Early draw access',
    ],
  },
];

const Subscribe = () => {
  const [selected, setSelected] = useState('yearly');
  const [loading, setLoading] = useState(false);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleSubscribe = async () => {
    if (!isAuthenticated) {
      toast.error('Please sign in to subscribe');
      navigate('/login?redirect=/subscribe');
      return;
    }

    setLoading(true);
    try {
      const res = await subscriptionAPI.createCheckoutSession({ plan: selected });
      if (res.data.data?.sessionUrl) {
        window.location.href = res.data.data.sessionUrl;
      } else {
        toast.error('Failed to create checkout session. Please check Stripe configuration.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <Navbar />
      <section className="pt-28 pb-32 px-4">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <span className="badge-emerald mb-4 inline-flex">
              <Trophy size={10} />
              Subscription Plans
            </span>
            <h1 className="font-display text-4xl md:text-6xl text-warm-white font-bold mt-4 mb-4">
              Choose Your Plan
            </h1>
            <p className="text-warm-white/45 text-lg max-w-xl mx-auto">
              Join thousands of golfers making an impact. Every subscription enters you into our monthly draw and funds your chosen charity.
            </p>
          </motion.div>

          {/* Plans */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto mb-12">
            {plans.map((plan, i) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.15 }}
                onClick={() => setSelected(plan.id)}
                className={`glass-card p-8 cursor-pointer transition-all duration-200 relative overflow-hidden ${
                  selected === plan.id
                    ? 'border-emerald-500/40 bg-emerald-500/5 shadow-lg shadow-emerald-500/10'
                    : 'hover:border-white/14'
                }`}
              >
                {/* Selected indicator */}
                <div className={`absolute top-4 right-4 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                  selected === plan.id ? 'border-emerald-500 bg-emerald-500' : 'border-white/20'
                }`}>
                  {selected === plan.id && <Check size={10} className="text-white" strokeWidth={3} />}
                </div>

                {plan.badge && (
                  <span className="badge-gold mb-4 inline-flex">
                    <Star size={9} fill="currentColor" />
                    {plan.badge}
                  </span>
                )}

                <h2 className="font-display text-2xl text-warm-white font-bold mb-1">{plan.name}</h2>
                <p className="text-warm-white/40 text-sm mb-6">{plan.description}</p>

                <div className="mb-6">
                  <span className="font-display text-5xl font-bold text-warm-white">£{plan.price}</span>
                  <span className="text-warm-white/40 text-sm ml-1">{plan.period}</span>
                  {plan.savings && (
                    <div className="mt-1 text-emerald-400 text-sm font-semibold">{plan.savings}</div>
                  )}
                </div>

                <ul className="space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5">
                      <Check size={14} className="text-emerald-400 mt-0.5 shrink-0" />
                      <span className="text-warm-white/60 text-sm">{f}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center"
          >
            <button
              onClick={handleSubscribe}
              disabled={loading}
              className="btn-primary text-base px-12 py-4"
            >
              {loading ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Processing...</>
              ) : (
                <>
                  <Zap size={18} />
                  Subscribe with {plans.find(p => p.id === selected)?.name} Plan
                  <ChevronRight size={18} />
                </>
              )}
            </button>
            <p className="text-warm-white/25 text-xs mt-4 flex items-center justify-center gap-1.5">
              <Shield size={11} />
              Payments secured by Stripe. Cancel anytime. Test mode active.
            </p>
            <p className="text-warm-white/20 text-xs mt-2">
              Use Stripe test card: 4242 4242 4242 4242, any future date, any CVC.
            </p>
          </motion.div>

          {/* Feature comparison */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass-card p-8 mt-16"
          >
            <h3 className="font-display text-2xl text-warm-white font-semibold text-center mb-8">What You Get</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[
                { icon: Trophy, title: 'Monthly Draw', desc: 'Match 3, 4, or 5 numbers to win from a growing prize pool.' },
                { icon: Heart, title: 'Charity Impact', desc: 'Min 10% of your subscription goes to your chosen charity.' },
                { icon: Zap, title: 'Score Tracking', desc: 'Log up to 5 golf scores monthly. Your numbers, your strategy.' },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="text-center">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                    <Icon size={20} className="text-emerald-400" />
                  </div>
                  <h4 className="font-semibold text-warm-white mb-2">{title}</h4>
                  <p className="text-warm-white/40 text-sm leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default Subscribe;
