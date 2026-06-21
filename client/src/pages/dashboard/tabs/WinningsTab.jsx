import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, Trophy, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useSubscription } from '../../../context/SubscriptionContext';
import { userAPI } from '../../../api/user';

const WinningsTab = () => {
  const { isActive, loading: subLoading } = useSubscription();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isActive) {
      setLoading(false);
      return;
    }
    userAPI.getWinnings().then((res) => setData(res.data.data))
      .catch(() => {}).finally(() => setLoading(false));
  }, [isActive]);

  if (subLoading) return <div className="p-8 text-center text-warm-white/50">Loading...</div>;

  if (!isActive) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center p-12 glass-card border-red-500/20 mt-8">
        <AlertCircle size={36} className="text-red-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-warm-white mb-2">Subscription Required</h2>
        <p className="text-warm-white/50 mb-6 max-w-md mx-auto">
          You need an active subscription to view your winnings and payment status.
        </p>
        <button onClick={() => navigate('/dashboard/subscribe')} className="btn-primary !px-8">
          Subscribe Now
        </button>
      </motion.div>
    );
  }

  const statusIcon = { pending: Clock, approved: CheckCircle, paid: CheckCircle };

  return (
    <motion.div
      key="winnings"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
    >
      <div className="mb-8">
        <h1 className="font-display text-3xl text-warm-white font-bold">Winnings</h1>
        <p className="text-warm-white/40 text-sm mt-1">Your prize history and payment status</p>
      </div>

      {/* Total card */}
      <div className="glass-card p-6 mb-6 border-gold-500/20 bg-gold-500/5">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gold-500/10 flex items-center justify-center">
            <Trophy size={18} className="text-gold-400" />
          </div>
          <div className="text-warm-white/50 text-sm">Total Winnings</div>
        </div>
        <div className="font-display text-4xl font-bold text-gold-400">
          £{(data?.totalWinnings || 0).toFixed(2)}
        </div>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="skeleton h-12 rounded-xl" />)}
          </div>
        ) : !data?.verifications?.length ? (
          <div className="py-16 text-center">
            <DollarSign size={32} className="text-warm-white/15 mx-auto mb-3" />
            <p className="text-warm-white/35 text-sm">No winnings yet. Keep playing!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Draw</th>
                  <th>Match</th>
                  <th>Prize</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {data.verifications.map((v) => {
                  const Icon = statusIcon[v.status] || Clock;
                  return (
                    <tr key={v._id}>
                      <td>{v.drawId?.month || '—'}</td>
                      <td>
                        <span className={`font-semibold ${v.matchType === '5-match' ? 'text-gold-400' : 'text-emerald-400'}`}>
                          {v.matchType}
                        </span>
                      </td>
                      <td className="font-semibold text-warm-white">£{v.prizeAmount?.toFixed(2)}</td>
                      <td>
                        <span className={`badge-${v.status === 'approved' || v.status === 'paid' ? 'emerald' : v.status === 'rejected' ? 'red' : 'gray'}`}>
                          <Icon size={10} />
                          {v.status}
                        </span>
                      </td>
                      <td>{v.createdAt ? format(new Date(v.createdAt), 'MMM d, yyyy') : '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default WinningsTab;
