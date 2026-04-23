import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Award, CheckCircle, XCircle, DollarSign, Eye } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { adminAPI } from '../../../api/admin';

const AdminWinners = () => {
  const [winners, setWinners] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const fetch = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getWinners({ status: statusFilter, page, limit: 20 });
      setWinners(res.data.data);
      setTotal(res.data.total);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetch(); }, [statusFilter, page]);

  const handleVerify = async (id, status) => {
    const adminNote = status === 'rejected' ? window.prompt('Rejection reason (optional):') : null;
    try {
      await adminAPI.verifyWinner(id, { status, adminNote });
      toast.success(`Winner ${status}!`);
      fetch();
    } catch { toast.error('Failed to update winner'); }
  };

  const handlePayout = async (id) => {
    if (!window.confirm('Mark this winner as paid?')) return;
    try {
      await adminAPI.markPayout(id);
      toast.success('Payout marked!');
      fetch();
    } catch { toast.error('Failed to mark payout'); }
  };

  const matchColors = { '5-match': 'text-gold-400', '4-match': 'text-emerald-400', '3-match': 'text-warm-white/70' };
  const statusBadge = { pending: 'badge-gold', approved: 'badge-emerald', rejected: 'badge-red' };

  return (
    <motion.div key="admin-winners" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl text-warm-white font-bold">Winners</h1>
          <p className="text-warm-white/40 text-sm mt-1">Review and approve winner proofs</p>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="input-glass w-36"
          style={{ colorScheme: 'dark' }}
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="skeleton h-14 rounded-xl" />)}
          </div>
        ) : winners.length === 0 ? (
          <div className="py-16 text-center">
            <Award size={32} className="text-warm-white/15 mx-auto mb-3" />
            <p className="text-warm-white/35 text-sm">No winners yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Draw</th>
                  <th>Match</th>
                  <th>Prize</th>
                  <th>Status</th>
                  <th>Proof</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {winners.map((w) => (
                  <tr key={w._id}>
                    <td>
                      <div className="font-medium text-warm-white text-sm">{w.userId?.name}</div>
                      <div className="text-warm-white/35 text-xs">{w.userId?.email}</div>
                    </td>
                    <td className="text-warm-white/60 text-sm">{w.drawId?.month || '—'}</td>
                    <td><span className={`font-semibold text-sm ${matchColors[w.matchType]}`}>{w.matchType}</span></td>
                    <td className="font-semibold text-warm-white">£{w.prizeAmount?.toFixed(2)}</td>
                    <td><span className={statusBadge[w.status] || 'badge-gray'}>{w.status}</span></td>
                    <td>
                      {w.proofScreenshotUrl ? (
                        <a href={w.proofScreenshotUrl} target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline text-xs flex items-center gap-1">
                          <Eye size={12} /> View
                        </a>
                      ) : <span className="text-warm-white/25 text-xs">No proof</span>}
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        {w.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleVerify(w._id, 'approved')}
                              className="p-1.5 rounded-lg hover:bg-emerald-500/10 text-warm-white/40 hover:text-emerald-400 transition-all"
                              title="Approve"
                            >
                              <CheckCircle size={14} />
                            </button>
                            <button
                              onClick={() => handleVerify(w._id, 'rejected')}
                              className="p-1.5 rounded-lg hover:bg-red-500/10 text-warm-white/40 hover:text-red-400 transition-all"
                              title="Reject"
                            >
                              <XCircle size={14} />
                            </button>
                          </>
                        )}
                        {w.status === 'approved' && (
                          <button
                            onClick={() => handlePayout(w._id)}
                            className="p-1.5 rounded-lg hover:bg-gold-500/10 text-warm-white/40 hover:text-gold-400 transition-all"
                            title="Mark as paid"
                          >
                            <DollarSign size={14} />
                          </button>
                        )}
                        {w.adminNote && (
                          <span className="text-warm-white/25 text-xs" title={w.adminNote}>📝</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {total > 20 && (
        <div className="flex items-center justify-center gap-3 mt-5">
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn-secondary !py-2 !px-4 !text-sm disabled:opacity-30">Previous</button>
          <span className="text-warm-white/40 text-sm">Page {page}</span>
          <button disabled={page >= Math.ceil(total / 20)} onClick={() => setPage(p => p + 1)} className="btn-secondary !py-2 !px-4 !text-sm disabled:opacity-30">Next</button>
        </div>
      )}
    </motion.div>
  );
};

export default AdminWinners;
