import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Play, Send, Eye, AlertTriangle, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { adminAPI } from '../../../api/admin';

const statusColors = {
  pending: 'badge-gray',
  simulated: 'badge-gold',
  published: 'badge-emerald',
};

const AdminDraws = () => {
  const [draws, setDraws] = useState([]);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [simulationResult, setSimulationResult] = useState(null);
  const [drawType, setDrawType] = useState('random');
  const [currentMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [publishTarget, setPublishTarget] = useState(null);
  const [confirmPublish, setConfirmPublish] = useState(false);

  const fetchDraws = async () => {
    try {
      const res = await adminAPI.getDraws();
      setDraws(res.data.data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchDraws(); }, []);

  const handleSimulate = async () => {
    setSimulating(true);
    setSimulationResult(null);
    try {
      const res = await adminAPI.simulateDraw({ month: currentMonth, drawType });
      setSimulationResult(res.data.data);
      setPublishTarget(res.data.data.draw._id);
      toast.success('Simulation complete!');
      fetchDraws();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Simulation failed');
    } finally {
      setSimulating(false);
    }
  };

  const handlePublish = async () => {
    if (!publishTarget) return;
    setPublishing(true);
    try {
      await adminAPI.publishDraw({ drawId: publishTarget });
      toast.success('Draw published! Winners have been notified.');
      setSimulationResult(null);
      setConfirmPublish(false);
      setPublishTarget(null);
      fetchDraws();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Publish failed');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <motion.div key="admin-draws" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
      <div className="mb-8">
        <h1 className="font-display text-3xl text-warm-white font-bold">Draw Management</h1>
        <p className="text-warm-white/40 text-sm mt-1">Simulate and publish monthly draws</p>
      </div>

      {/* Draw control */}
      <div className="glass-card p-6 mb-6 border-gold-500/15">
        <h2 className="text-warm-white font-semibold mb-5 flex items-center gap-2">
          <Trophy size={16} className="text-gold-400" />
          {currentMonth} Draw Control
        </h2>

        {draws.find(d => d.month === currentMonth && d.status === 'published') ? (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-5 text-center">
            <h3 className="text-emerald-400 font-semibold mb-1">✅ Draw Completed</h3>
            <p className="text-warm-white/60 text-sm">The draw for {currentMonth} has been published successfully. Winners have been notified.</p>
          </div>
        ) : (
          <>
            <div className="flex flex-col sm:flex-row gap-4 mb-5">
              <div>
                <label className="text-warm-white/50 text-xs font-medium block mb-1.5">Draw Type</label>
                <select
                  value={drawType}
                  onChange={(e) => setDrawType(e.target.value)}
                  className="input-glass w-48"
                  style={{ colorScheme: 'dark' }}
                >
                  <option value="random">🎲 Random</option>
                  <option value="algorithmic">⚡ Algorithmic</option>
                </select>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleSimulate}
                disabled={simulating}
                className="btn-secondary !text-sm !py-2.5 !px-5 !border-gold-500/30 !text-gold-400 hover:!bg-gold-500/10"
              >
                {simulating ? (
                  <><div className="w-4 h-4 border-2 border-gold-400/30 border-t-gold-400 rounded-full animate-spin" /> Simulating...</>
                ) : (
                  <><Play size={14} /> Run Simulation</>
                )}
              </button>

              {simulationResult && (
                <button
                  onClick={() => setConfirmPublish(true)}
                  disabled={publishing}
                  className="btn-gold !text-sm !py-2.5 !px-5"
                >
                  <Send size={14} />
                  Publish Draw
                </button>
              )}
            </div>

            {/* Confirm publish modal */}
            {confirmPublish && (
              <div className="mt-4 bg-red-500/8 border border-red-500/20 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle size={15} className="text-red-400" />
                  <span className="text-warm-white font-medium text-sm">Confirm Publish</span>
                </div>
                <p className="text-warm-white/50 text-xs mb-4">
                  This will finalize results, notify all participants, and create winner records. This cannot be undone.
                </p>
                <div className="flex gap-3">
                  <button onClick={handlePublish} disabled={publishing} className="btn-gold !py-2 !px-4 !text-xs">
                    {publishing ? 'Publishing...' : 'Yes, Publish'}
                  </button>
                  <button onClick={() => setConfirmPublish(false)} className="btn-secondary !py-2 !px-4 !text-xs">Cancel</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Simulation Result Preview */}
      {simulationResult && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6 mb-6 border-emerald-500/20"
        >
          <h3 className="text-warm-white font-semibold mb-4 flex items-center gap-2">
            <Zap size={15} className="text-emerald-400" />
            Simulation Preview (not published)
          </h3>

          {/* Winning numbers */}
          <div className="mb-4">
            <div className="text-warm-white/40 text-xs mb-2">Drawn Numbers</div>
            <div className="flex gap-2 flex-wrap">
              {simulationResult.simulation?.winningNumbers?.map(n => (
                <div key={n} className="number-ball" style={{ width: 36, height: 36, fontSize: 13 }}>{n}</div>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="glass-card p-3 text-center">
              <div className="text-gold-400 font-bold font-display text-xl">
                {simulationResult.simulation?.prizes?.filter(p => p.matchType === '5-match').length || 0}
              </div>
              <div className="text-warm-white/40 text-xs">5-Match winners</div>
            </div>
            <div className="glass-card p-3 text-center">
              <div className="text-emerald-400 font-bold font-display text-xl">
                {simulationResult.simulation?.prizes?.filter(p => p.matchType === '4-match').length || 0}
              </div>
              <div className="text-warm-white/40 text-xs">4-Match winners</div>
            </div>
            <div className="glass-card p-3 text-center">
              <div className="text-warm-white font-bold font-display text-xl">
                {simulationResult.simulation?.prizes?.filter(p => p.matchType === '3-match').length || 0}
              </div>
              <div className="text-warm-white/40 text-xs">3-Match winners</div>
            </div>
          </div>

          {!simulationResult.simulation?.hasJackpotWinner && (
            <div className="bg-gold-500/8 border border-gold-500/20 rounded-xl px-4 py-3 text-gold-400 text-sm">
              ⚡ Jackpot will roll over to next month (no 5-match winner)
            </div>
          )}
        </motion.div>
      )}

      {/* Past draws */}
      <div className="glass-card overflow-hidden">
        <div className="p-5 border-b border-white/6">
          <h3 className="text-warm-white font-semibold">Past & Current Draws</h3>
        </div>
        {loading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="skeleton h-14 rounded-xl" />)}
          </div>
        ) : draws.length === 0 ? (
          <div className="py-12 text-center text-warm-white/30 text-sm">No draws yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Winners</th>
                  <th>Jackpot Rollover</th>
                  <th>Jackpot Amount</th>
                </tr>
              </thead>
              <tbody>
                {draws.map((d) => (
                  <tr key={d._id}>
                    <td className="font-medium text-warm-white">{d.month}</td>
                    <td className="text-warm-white/50 text-xs">{d.drawType}</td>
                    <td><span className={statusColors[d.status] || 'badge-gray'}>{d.status}</span></td>
                    <td className="text-warm-white/70">{d.results?.length || 0}</td>
                    <td>{d.jackpotRolledOver ? <span className="badge-gold">Yes</span> : <span className="badge-gray text-xs">No</span>}</td>
                    <td className="text-gold-400 font-medium">£{(d.jackpotAmount || 0).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default AdminDraws;
