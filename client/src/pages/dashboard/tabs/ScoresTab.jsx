import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Edit2, Trash2, Target, Save, X, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { userAPI } from '../../../api/user';
import { useAuth } from '../../../context/AuthContext';

const scoreSchema = z.object({
  score: z.coerce.number()
    .min(1, 'Score must be between 1 and 45')
    .max(45, 'Score must be between 1 and 45'),
  date: z.string().min(1, 'Date is required'),
});

const ScoreRow = ({ entry, onEdit, onDelete, index }) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: 20 }}
    transition={{ delay: index * 0.05 }}
    className="flex items-center justify-between gap-4 py-3.5 px-4 rounded-xl hover:bg-white/3 transition-colors group"
  >
    <div className="flex items-center gap-4">
      <div className="number-ball flex-shrink-0" style={{ width: 38, height: 38, fontSize: 14 }}>
        {entry.score}
      </div>
      <div>
        <div className="text-warm-white font-medium text-sm">Score: {entry.score}</div>
        <div className="text-warm-white/35 text-xs">{format(new Date(entry.date), 'MMMM d, yyyy')}</div>
      </div>
    </div>
    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
      <button
        onClick={() => onEdit(entry)}
        className="p-2 rounded-lg hover:bg-white/8 text-warm-white/40 hover:text-warm-white transition-all"
        title="Edit score"
      >
        <Edit2 size={14} />
      </button>
      <button
        onClick={() => onDelete(entry._id)}
        className="p-2 rounded-lg hover:bg-red-500/10 text-warm-white/40 hover:text-red-400 transition-all"
        title="Delete score"
      >
        <Trash2 size={14} />
      </button>
    </div>
  </motion.div>
);

const ScoresTab = () => {
  const { user, refreshUser } = useAuth();
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingEntry, setEditingEntry] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const isActive = user?.subscriptionStatus === 'active';

  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(scoreSchema),
  });

  const fetchScores = async () => {
    try {
      const res = await userAPI.getScores();
      setScores(res.data.data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchScores(); }, []);

  const onSubmit = async (data) => {
    try {
      if (editingEntry) {
        await userAPI.updateScore(editingEntry._id, data);
        toast.success('Score updated!');
      } else {
        await userAPI.addScore(data);
        toast.success('Score added!');
      }
      await fetchScores();
      await refreshUser();
      reset();
      setShowForm(false);
      setEditingEntry(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save score');
    }
  };

  const handleEdit = (entry) => {
    setEditingEntry(entry);
    setValue('score', entry.score);
    setValue('date', format(new Date(entry.date), 'yyyy-MM-dd'));
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this score?')) return;
    try {
      await userAPI.deleteScore(id);
      toast.success('Score deleted');
      await fetchScores();
      await refreshUser();
    } catch {
      toast.error('Failed to delete score');
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingEntry(null);
    reset();
  };

  return (
    <motion.div
      key="scores"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
    >
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl text-warm-white font-bold">My Scores</h1>
          <p className="text-warm-white/40 text-sm mt-1">
            Enter up to 5 golf scores per month (1–45). These are your draw numbers.
          </p>
        </div>
        {isActive && !showForm && scores.length < 5 && (
          <button onClick={() => setShowForm(true)} className="btn-primary !py-2.5 !px-5 !text-sm">
            <Plus size={14} /> Add Score
          </button>
        )}
      </div>

      {/* Inactive notice */}
      {!isActive && (
        <div className="flex items-start gap-3 bg-red-500/8 border border-red-500/20 rounded-xl p-4 mb-6">
          <AlertCircle size={16} className="text-red-400 mt-0.5" />
          <p className="text-warm-white/60 text-sm">
            Active subscription required to add or modify scores.
            <a href="/subscribe" className="text-emerald-400 hover:underline ml-1">Subscribe now →</a>
          </p>
        </div>
      )}

      {/* Score count indicator */}
      <div className="flex items-center gap-2 mb-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${
              i < scores.length ? 'bg-emerald-500' : 'bg-white/10'
            }`}
          />
        ))}
        <span className="text-warm-white/40 text-xs ml-2 whitespace-nowrap">{scores.length}/5</span>
      </div>

      {/* Entry form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="glass-card p-6 mb-6 border-emerald-500/20"
          >
            <h3 className="text-warm-white font-medium mb-4 flex items-center gap-2">
              {editingEntry ? <><Edit2 size={15} /> Edit Score</> : <><Plus size={15} /> New Score</>}
            </h3>
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-warm-white/50 text-xs font-medium mb-1.5">
                  Score (1–45)
                </label>
                <input
                  type="number"
                  min={1}
                  max={45}
                  {...register('score')}
                  className={`input-glass ${errors.score ? 'error' : ''}`}
                  placeholder="Enter score"
                />
                {errors.score && <p className="text-red-400 text-xs mt-1">{errors.score.message}</p>}
              </div>
              <div className="flex-1">
                <label className="block text-warm-white/50 text-xs font-medium mb-1.5">Date</label>
                <input
                  type="date"
                  {...register('date')}
                  max={format(new Date(), 'yyyy-MM-dd')}
                  className={`input-glass ${errors.date ? 'error' : ''}`}
                  style={{ colorScheme: 'dark' }}
                />
                {errors.date && <p className="text-red-400 text-xs mt-1">{errors.date.message}</p>}
              </div>
              <div className="flex items-end gap-2">
                <button type="submit" disabled={isSubmitting} className="btn-primary !py-3 !px-5 !text-sm">
                  {isSubmitting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Save size={14} /> Save</>}
                </button>
                <button type="button" onClick={handleCancel} className="btn-secondary !py-3 !px-4 !text-sm">
                  <X size={14} />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scores list */}
      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="skeleton h-14 rounded-xl" />)}
          </div>
        ) : scores.length === 0 ? (
          <div className="py-16 text-center">
            <Target size={32} className="text-warm-white/15 mx-auto mb-3" />
            <p className="text-warm-white/35 text-sm">No scores entered yet.</p>
            {isActive && (
              <button onClick={() => setShowForm(true)} className="btn-primary !py-2.5 !px-5 !text-sm mt-4">
                <Plus size={14} /> Add Your First Score
              </button>
            )}
          </div>
        ) : (
          <div className="p-2">
            <AnimatePresence>
              {scores.map((entry, i) => (
                <ScoreRow
                  key={entry._id}
                  entry={entry}
                  index={i}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </AnimatePresence>
          </div>
        )}

        {scores.length === 5 && isActive && (
          <div className="px-4 pb-4 pt-2">
            <div className="badge-emerald text-xs justify-center">
              ✓ You have 5 scores — you're eligible for this month's draw!
            </div>
          </div>
        )}
      </div>

      <p className="text-warm-white/25 text-xs mt-4">
        Rolling window: adding a 6th score removes your oldest. Scores cannot share the same date.
      </p>
    </motion.div>
  );
};

export default ScoresTab;
