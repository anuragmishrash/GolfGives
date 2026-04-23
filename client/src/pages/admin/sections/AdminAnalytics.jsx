import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart2, TrendingUp } from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts';
import { adminAPI } from '../../../api/admin';

const tooltipStyle = {
  contentStyle: {
    background: 'rgba(14,14,24,0.95)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 10,
    color: '#f5f0eb',
    fontSize: 12,
  },
};

const AdminAnalytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.getAnalytics().then((res) => setAnalytics(res.data.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const subsData = analytics?.subsOverTime?.map(d => ({
    month: d._id,
    subscribers: d.count,
    revenue: +(d.revenue / 100).toFixed(2),
  })) || [];

  const charityData = analytics?.charityBreakdown?.map(c => ({
    name: c.name.length > 16 ? c.name.substring(0, 16) + '...' : c.name,
    contributed: +(c.totalContributed || 0).toFixed(2),
  })) || [];

  const drawData = analytics?.drawStats?.map(d => ({ status: d._id, count: d.count })) || [];

  return (
    <motion.div key="admin-analytics" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
      <div className="mb-8">
        <h1 className="font-display text-3xl text-warm-white font-bold">Analytics</h1>
        <p className="text-warm-white/40 text-sm mt-1">Platform performance and trends</p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="skeleton h-64 rounded-2xl" />)}
        </div>
      ) : (
        <div className="space-y-5">
          {/* Subscriptions over time */}
          <div className="glass-card p-6">
            <h3 className="text-warm-white font-semibold mb-5 flex items-center gap-2">
              <TrendingUp size={16} className="text-emerald-400" />
              Subscriptions Over Time (Last 12 Months)
            </h3>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={subsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" stroke="rgba(245,240,235,0.3)" tick={{ fontSize: 11 }} />
                <YAxis stroke="rgba(245,240,235,0.3)" tick={{ fontSize: 11 }} />
                <Tooltip {...tooltipStyle} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12, color: 'rgba(245,240,235,0.5)' }} />
                <Line type="monotone" dataKey="subscribers" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981', r: 4 }} name="New Subscribers" />
                <Line type="monotone" dataKey="revenue" stroke="#f59e0b" strokeWidth={2} dot={{ fill: '#f59e0b', r: 4 }} name="Revenue (£)" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Charity contributions */}
          <div className="glass-card p-6">
            <h3 className="text-warm-white font-semibold mb-5 flex items-center gap-2">
              <BarChart2 size={16} className="text-emerald-400" />
              Charity Contributions (£)
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={charityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" stroke="rgba(245,240,235,0.3)" tick={{ fontSize: 10 }} />
                <YAxis stroke="rgba(245,240,235,0.3)" tick={{ fontSize: 11 }} />
                <Tooltip {...tooltipStyle} />
                <Bar dataKey="contributed" fill="#10b981" radius={[4, 4, 0, 0]} name="Contributed (£)" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Draw stats table */}
          <div className="glass-card p-6">
            <h3 className="text-warm-white font-semibold mb-5">Draw Statistics</h3>
            <div className="grid grid-cols-3 gap-4">
              {drawData.map((d) => (
                <div key={d.status} className="glass-card p-4 text-center">
                  <div className="font-display text-2xl font-bold text-warm-white">{d.count}</div>
                  <div className="text-warm-white/40 text-xs mt-1 capitalize">{d.status} draws</div>
                </div>
              ))}
              {drawData.length === 0 && (
                <p className="col-span-3 text-center text-warm-white/30 text-sm py-4">No draw data yet</p>
              )}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default AdminAnalytics;
