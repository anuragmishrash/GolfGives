import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Trophy, Heart, TrendingUp, BarChart2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { adminAPI } from '../../../api/admin';

const KPI = ({ icon: Icon, label, value, color, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.35 }}
    className="glass-card p-5"
  >
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${
      color === 'emerald' ? 'bg-emerald-500/10 text-emerald-400' :
      color === 'gold' ? 'bg-gold-500/10 text-gold-400' :
      color === 'blue' ? 'bg-blue-500/10 text-blue-400' :
      'bg-white/6 text-warm-white/60'
    }`}>
      <Icon size={18} />
    </div>
    <div className="text-warm-white/50 text-xs font-medium uppercase tracking-wider mb-1">{label}</div>
    <div className="font-display text-2xl font-bold text-warm-white">{value}</div>
  </motion.div>
);

const COLORS = ['#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#ef4444'];

const AdminDashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.getAnalytics()
      .then((res) => setAnalytics(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const subsData = analytics?.subsOverTime?.map((d) => ({
    month: d._id,
    subscribers: d.count,
    revenue: (d.revenue / 100).toFixed(2),
  })) || [];

  const charityData = analytics?.charityBreakdown?.map((c) => ({
    name: c.name,
    value: c.totalContributed,
  })) || [];

  return (
    <motion.div key="admin-dashboard" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
      <div className="mb-8">
        <h1 className="font-display text-3xl text-warm-white font-bold">Admin Dashboard</h1>
        <p className="text-warm-white/40 text-sm mt-1">Platform overview and key metrics</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map(i => <div key={i} className="skeleton h-28 rounded-2xl" />)}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <KPI icon={Users} label="Total Users" value={analytics?.totalUsers ?? 0} color="emerald" delay={0} />
            <KPI icon={TrendingUp} label="Active Subscribers" value={analytics?.activeSubscribers ?? 0} color="blue" delay={0.1} />
            <KPI icon={Trophy} label="Total Prize Pool" value={`£${(analytics?.totalPrizePool || 0).toFixed(0)}`} color="gold" delay={0.2} />
            <KPI icon={Heart} label="Total to Charity" value={`£${(analytics?.totalCharityContributed || 0).toFixed(0)}`} color="emerald" delay={0.3} />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Subscriptions over time */}
            <div className="glass-card p-6">
              <h3 className="text-warm-white font-semibold mb-5 flex items-center gap-2">
                <BarChart2 size={16} className="text-emerald-400" />
                Subscriptions Over Time
              </h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={subsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="month" stroke="rgba(245,240,235,0.3)" tick={{ fontSize: 11 }} />
                  <YAxis stroke="rgba(245,240,235,0.3)" tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ background: 'rgba(14,14,24,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#f5f0eb' }}
                  />
                  <Bar dataKey="subscribers" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Charity distribution */}
            <div className="glass-card p-6">
              <h3 className="text-warm-white font-semibold mb-5 flex items-center gap-2">
                <Heart size={16} className="text-emerald-400" />
                Charity Contributions
              </h3>
              {charityData.length === 0 ? (
                <div className="h-[220px] flex items-center justify-center text-warm-white/25 text-sm">
                  No data yet
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={charityData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      innerRadius={40}
                      paddingAngle={3}
                    >
                      {charityData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: 'rgba(14,14,24,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#f5f0eb' }} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: 'rgba(245,240,235,0.5)' }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
};

export default AdminDashboard;
