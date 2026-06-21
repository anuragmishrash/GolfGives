import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Upload, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useSubscription } from '../../../context/SubscriptionContext';
import toast from 'react-hot-toast';
import { userAPI } from '../../../api/user';
import api from '../../../api/axios';

const statusConfig = {
  pending: { label: 'Pending', color: 'badge-gray', icon: Clock },
  approved: { label: 'Approved', color: 'badge-emerald', icon: CheckCircle },
  rejected: { label: 'Rejected', color: 'badge-red', icon: XCircle },
};

const DrawCard = ({ draw }) => {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();
  const result = draw.myResult;

  const matchColors = {
    '5-match': 'text-gold-400',
    '4-match': 'text-emerald-400',
    '3-match': 'text-warm-white/70',
  };

  const handleProofUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          // Send base64 to backend (store in DB or Cloudinary)
          await api.post(`/user/draws/${draw._id}/proof`, { proofBase64: reader.result });
          toast.success('Proof uploaded successfully!');
        } catch (err) {
          toast.error(err.response?.data?.message || 'Upload failed');
        } finally {
          setUploading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch {
      setUploading(false);
      toast.error('Upload failed');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-warm-white font-semibold">{draw.month} Draw</h3>
          <div className="text-warm-white/35 text-xs mt-0.5">
            Status: <span className={draw.status === 'published' ? 'text-emerald-400' : 'text-warm-white/40'}>{draw.status}</span>
          </div>
        </div>
        {result ? (
          <span className={`badge-gold font-bold ${matchColors[result.matchType] || ''}`}>
            🏆 {result.matchType}
          </span>
        ) : draw.status === 'published' ? (
          <span className="badge-gray">No match</span>
        ) : (
          <span className="badge-gray">Awaiting draw</span>
        )}
      </div>

      {/* Winning Numbers */}
      {draw.winningNumbers?.length > 0 && (
        <div className="mb-4">
          <div className="text-warm-white/30 text-xs mb-2">Winning Numbers</div>
          <div className="flex gap-2 flex-wrap">
            {draw.winningNumbers.map((n) => (
              <div key={n} className="number-ball" style={{ width: 32, height: 32, fontSize: 12 }}>{n}</div>
            ))}
          </div>
        </div>
      )}

      {/* Prize info */}
      {result && (
        <div className={`rounded-lg p-3 mb-4 ${
          result.matchType === '5-match' ? 'bg-gold-500/8 border border-gold-500/20' :
          'bg-emerald-500/8 border border-emerald-500/20'
        }`}>
          <div className="text-warm-white/60 text-xs mb-1">Your Prize</div>
          <div className={`font-display text-xl font-bold ${result.matchType === '5-match' ? 'text-gold-400' : 'text-emerald-400'}`}>
            £{result.prizeAmount?.toFixed(2)}
          </div>
          <div className="text-warm-white/30 text-xs mt-1">Payment: {result.paymentStatus}</div>

          {/* Upload proof button */}
          {result.matchType && (
            <div className="mt-3">
              <input
                ref={fileRef}
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={(e) => handleProofUpload(e.target.files[0])}
              />
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="btn-primary !py-2 !px-4 !text-xs"
              >
                {uploading ? (
                  <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <><Upload size={12} /> Upload Proof</>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};

const DrawsTab = () => {
  const { isActive, loading: subLoading } = useSubscription();
  const navigate = useNavigate();
  const [draws, setDraws] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isActive) {
      setLoading(false);
      return;
    }
    userAPI.getDraws().then((res) => {
      setDraws(res.data.data || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [isActive]);

  if (subLoading) return <div className="p-8 text-center text-warm-white/50">Loading...</div>;

  if (!isActive) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center p-12 glass-card border-red-500/20 mt-8">
        <AlertCircle size={36} className="text-red-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-warm-white mb-2">Subscription Required</h2>
        <p className="text-warm-white/50 mb-6 max-w-md mx-auto">
          You need an active subscription to view your draws and results.
        </p>
        <button onClick={() => navigate('/dashboard/subscribe')} className="btn-primary !px-8">
          Subscribe Now
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      key="draws"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
    >
      <div className="mb-8">
        <h1 className="font-display text-3xl text-warm-white font-bold">My Draws</h1>
        <p className="text-warm-white/40 text-sm mt-1">Monthly draws you've participated in</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="skeleton h-40 rounded-2xl" />)}
        </div>
      ) : draws.length === 0 ? (
        <div className="glass-card py-20 text-center">
          <Trophy size={36} className="text-warm-white/15 mx-auto mb-3" />
          <p className="text-warm-white/35 text-sm">No draws yet. Add 5 scores and wait for the monthly draw!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {draws.map((draw) => <DrawCard key={draw._id} draw={draw} />)}
        </div>
      )}
    </motion.div>
  );
};

export default DrawsTab;
