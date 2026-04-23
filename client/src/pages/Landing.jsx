import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { ChevronRight, Trophy, Heart, Target, Users, TrendingUp, Star, Award } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { charityAPI } from '../api/charity';
import { subscriptionAPI } from '../api/subscription';

// ── Animated Counter ───────────────────────────────────────────────────────────
const AnimatedCounter = ({ value, prefix = '', suffix = '', decimals = 0, duration = 2 }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const end = parseFloat(value);
    const increment = end / (duration * 60);
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) { setCount(end); clearInterval(timer); }
      else setCount(start);
    }, 1000 / 60);
    return () => clearInterval(timer);
  }, [inView, value, duration]);

  return (
    <span ref={ref}>
      {prefix}{decimals > 0 ? count.toFixed(decimals) : Math.floor(count).toLocaleString()}{suffix}
    </span>
  );
};

// ── How It Works Step ──────────────────────────────────────────────────────────
const HowItWorksStep = ({ icon: Icon, title, description, step, delay }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-50px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay, duration: 0.6, ease: 'easeOut' }}
      className="glass-card p-8 relative overflow-hidden group"
    >
      {/* Step number watermark */}
      <span className="absolute top-4 right-6 text-7xl font-display font-bold text-white/3 select-none leading-none">
        {step}
      </span>
      <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6 group-hover:bg-emerald-500/20 transition-colors">
        <Icon size={22} className="text-emerald-400" />
      </div>
      <h3 className="font-display text-xl text-warm-white font-semibold mb-3">{title}</h3>
      <p className="text-warm-white/50 text-sm leading-relaxed">{description}</p>
    </motion.div>
  );
};

const Landing = () => {
  const [featuredCharity, setFeaturedCharity] = useState(null);
  const [prizePool, setPrizePool] = useState({ fiveMatch: 12400, fourMatch: 10850, threeMatch: 7750 });
  const heroRef = useRef(null);

  useEffect(() => {
    charityAPI.getCharities({ featured: 'true', limit: 1 }).then((res) => {
      if (res.data.data?.[0]) setFeaturedCharity(res.data.data[0]);
    }).catch(() => {});
  }, []);

  const totalPrize = prizePool.fiveMatch + prizePool.fourMatch + prizePool.threeMatch;

  return (
    <div className="page-container">
      <Navbar />

      {/* ── Hero Section ──────────────────────────────────────────────────────── */}
      <section className="grain-overlay relative min-h-screen flex flex-col items-center justify-center text-center px-4 pt-16 overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 bg-hero-gradient pointer-events-none" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-emerald-500/8 blur-[120px] rounded-full pointer-events-none" />

        {/* Floating number orbs */}
        {[7, 12, 28, 33, 41].map((n, i) => (
          <motion.div
            key={n}
            className="absolute number-ball text-sm opacity-20"
            style={{
              top: `${20 + (i * 12)}%`,
              left: i % 2 === 0 ? `${8 + i * 5}%` : undefined,
              right: i % 2 !== 0 ? `${8 + i * 4}%` : undefined,
            }}
            animate={{
              y: [0, -15, 0],
              opacity: [0.15, 0.3, 0.15],
            }}
            transition={{ repeat: Infinity, duration: 3 + i * 0.7, ease: 'easeInOut' }}
          >
            {n}
          </motion.div>
        ))}

        <div className="relative z-10 max-w-5xl mx-auto">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 mb-8"
          >
            <span className="badge-emerald">
              <Star size={10} fill="currentColor" />
              Golf · Charity · Draws
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8, ease: 'easeOut' }}
            className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-warm-white leading-none mb-6"
          >
            Play Golf.{' '}
            <span className="text-emerald-400 italic">Give Back.</span>
            <br />
            Win Big.
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="text-warm-white/50 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            GolfGives combines your passion for golf with charitable impact and the thrill of monthly prize draws. 
            Subscribe, track your scores, and compete for a growing prize pool — all while funding causes that matter.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link to="/subscribe" className="btn-primary text-base px-8 py-4">
              Start for £9.99/month
              <ChevronRight size={18} />
            </Link>
            <Link to="/charities" className="btn-secondary text-base px-8 py-4">
              Explore Charities
            </Link>
          </motion.div>

          {/* Trust badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="flex items-center justify-center gap-8 mt-14 text-warm-white/25 text-xs uppercase tracking-widest flex-wrap"
          >
            <span className="flex items-center gap-2"><Users size={12} />2,400+ Members</span>
            <span className="text-white/10">·</span>
            <span className="flex items-center gap-2"><Heart size={12} />£48K+ to Charity</span>
            <span className="text-white/10">·</span>
            <span className="flex items-center gap-2"><Trophy size={12} />Monthly Draws</span>
          </motion.div>
        </div>

        {/* Scroll cue */}
        <motion.div
          className="absolute bottom-8 left-0 right-0 flex justify-center"
          animate={{ y: [0, 6, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <div className="w-5 h-8 border-2 border-white/15 rounded-full flex justify-center pt-1.5">
            <div className="w-1 h-2 bg-white/30 rounded-full" />
          </div>
        </motion.div>
      </section>

      {/* ── Prize Pool Section ────────────────────────────────────────────────── */}
      <section className="py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="badge-gold mb-4 inline-flex">
              <Trophy size={10} />
              This Month's Prize Pool
            </span>
            <h2 className="font-display text-4xl md:text-6xl text-warm-white font-bold mt-4">
              <span className="text-gold-400">£</span>
              <AnimatedCounter value={totalPrize} duration={2.5} />
            </h2>
            <p className="text-warm-white/40 mt-4">Distributed across 3 winning tiers every month</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: '5 Numbers Matched', desc: 'Jackpot — 40% of pool', color: 'text-gold-400', border: 'border-gold-500/20', bg: 'bg-gold-500/5', amount: prizePool.fiveMatch },
              { label: '4 Numbers Matched', desc: '35% of pool', color: 'text-emerald-400', border: 'border-emerald-500/20', bg: 'bg-emerald-500/5', amount: prizePool.fourMatch },
              { label: '3 Numbers Matched', desc: '25% of pool', color: 'text-warm-white/70', border: 'border-white/10', bg: 'bg-white/3', amount: prizePool.threeMatch },
            ].map((tier, i) => (
              <motion.div
                key={tier.label}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.5 }}
                className={`glass-card p-8 border ${tier.border} ${tier.bg} text-center`}
              >
                <div className={`text-3xl font-display font-bold ${tier.color} mb-2`}>
                  £<AnimatedCounter value={tier.amount} duration={2} />
                </div>
                <div className="font-semibold text-warm-white mb-1">{tier.label}</div>
                <div className="text-warm-white/40 text-sm">{tier.desc}</div>
              </motion.div>
            ))}
          </div>

          {/* Jackpot rollover notice */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mt-6 glass-card p-4 text-center border-gold-500/20 bg-gold-500/5"
          >
            <p className="text-warm-white/50 text-sm">
              <span className="text-gold-400 font-semibold">Jackpot Rolls Over</span> — if no one matches all 5 numbers, the jackpot carries forward to next month. It keeps growing until someone wins!
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── How It Works ─────────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-24 px-4 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="badge-emerald mb-4 inline-flex">How It Works</span>
            <h2 className="font-display text-4xl md:text-5xl text-warm-white font-bold mt-4">
              Simple. Impactful. Rewarding.
            </h2>
            <p className="text-warm-white/40 mt-4 max-w-xl mx-auto">
              Three steps between you and a community that plays with purpose.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <HowItWorksStep
              step="1" delay={0}
              icon={Target}
              title="Subscribe & Choose Your Charity"
              description="Pick a monthly or yearly plan. A portion of every payment goes directly to your chosen charity. You control how much — minimum 10%."
            />
            <HowItWorksStep
              step="2" delay={0.15}
              icon={TrendingUp}
              title="Log Your Top 5 Scores"
              description="Enter up to 5 of your best golf scores (1–45) each month. These become your draw numbers. Play more, improve your chances."
            />
            <HowItWorksStep
              step="3" delay={0.3}
              icon={Award}
              title="Enter the Monthly Draw"
              description="At month-end, 5 winning numbers are drawn. Match 3, 4, or all 5 to win your share of the prize pool. Jackpot grows until claimed."
            />
          </div>

          <div className="text-center mt-12">
            <Link to="/subscribe" className="btn-primary px-10 py-4 text-base">
              Join GolfGives Today
              <ChevronRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Featured Charity ──────────────────────────────────────────────────── */}
      {featuredCharity && (
        <section className="py-24 px-4 border-t border-white/5">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <span className="badge-gold mb-4 inline-flex">
                <Heart size={10} fill="currentColor" />
                Featured Charity
              </span>
            </div>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="glass-card p-8 md:p-12 max-w-3xl mx-auto text-center"
            >
              {featuredCharity.logoUrl && (
                <img src={featuredCharity.logoUrl} alt={featuredCharity.name} className="h-16 object-contain mx-auto mb-6 opacity-80" />
              )}
              <h3 className="font-display text-3xl text-warm-white font-bold mb-4">{featuredCharity.name}</h3>
              <p className="text-warm-white/50 leading-relaxed mb-8 max-w-xl mx-auto">{featuredCharity.description}</p>
              <div className="flex items-center justify-center gap-3">
                <Link to={`/charities/${featuredCharity.slug}`} className="btn-primary">
                  Learn More <ChevronRight size={16} />
                </Link>
                <Link to="/charities" className="btn-secondary">All Charities</Link>
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* ── Final CTA ─────────────────────────────────────────────────────────── */}
      <section className="py-32 px-4 border-t border-white/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-radial from-emerald-500/10 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-display text-5xl md:text-6xl text-warm-white font-bold leading-tight mb-6"
          >
            Your game.<br />
            <span className="text-emerald-400 italic">Their future.</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-warm-white/40 text-lg mb-10"
          >
            Every subscription funds a cause. Every score enters a draw. Every month, someone wins big.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link to="/subscribe" className="btn-primary !px-10 !py-4 !text-base">
              <Trophy size={18} />
              Subscribe & Play
            </Link>
            <Link to="/register" className="btn-secondary !px-10 !py-4 !text-base">
              Create Free Account
            </Link>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Landing;
