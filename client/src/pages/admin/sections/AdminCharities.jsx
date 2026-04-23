import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { Heart, Plus, Edit2, Trash2, X, Save, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminAPI } from '../../../api/admin';

const defaultValues = { name: '', slug: '', description: '', logoUrl: '', bannerUrl: '', website: '', isFeatured: false };

const AdminCharities = () => {
  const [charities, setCharities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState(null);

  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm({ defaultValues });

  const fetch = async () => {
    try {
      const res = await adminAPI.getCharities({ limit: 50 });
      setCharities(res.data.data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetch(); }, []);

  const openCreate = () => { setEditTarget(null); reset(defaultValues); setShowForm(true); };
  const openEdit = (c) => {
    setEditTarget(c);
    reset({ name: c.name, slug: c.slug, description: c.description, logoUrl: c.logoUrl || '', bannerUrl: c.bannerUrl || '', website: c.website || '', isFeatured: c.isFeatured });
    setShowForm(true);
  };

  const onSubmit = async (data) => {
    try {
      if (editTarget) {
        await adminAPI.updateCharity(editTarget._id, data);
        toast.success('Charity updated!');
      } else {
        await adminAPI.createCharity(data);
        toast.success('Charity created!');
      }
      setShowForm(false);
      fetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save charity');
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Deactivate ${name}?`)) return;
    try {
      await adminAPI.deleteCharity(id);
      toast.success('Charity deactivated');
      fetch();
    } catch { toast.error('Failed to deactivate'); }
  };

  return (
    <motion.div key="admin-charities" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl text-warm-white font-bold">Charities</h1>
          <p className="text-warm-white/40 text-sm mt-1">Manage charity listings</p>
        </div>
        <button onClick={openCreate} className="btn-primary !py-2.5 !px-5 !text-sm">
          <Plus size={14} /> Add Charity
        </button>
      </div>

      {/* Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="glass-card p-6 mb-6 border-emerald-500/20">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-warm-white font-semibold">{editTarget ? 'Edit Charity' : 'Add Charity'}</h3>
              <button onClick={() => setShowForm(false)} className="text-warm-white/40 hover:text-warm-white"><X size={16} /></button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-warm-white/50 text-xs font-medium block mb-1.5">Charity Name *</label>
                <input {...register('name', { required: 'Required' })} className="input-glass" placeholder="Charity name" />
                {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
              </div>
              <div>
                <label className="text-warm-white/50 text-xs font-medium block mb-1.5">Slug * (URL-safe)</label>
                <input {...register('slug', { required: 'Required' })} className="input-glass" placeholder="charity-name" />
                {errors.slug && <p className="text-red-400 text-xs mt-1">{errors.slug.message}</p>}
              </div>
              <div className="sm:col-span-2">
                <label className="text-warm-white/50 text-xs font-medium block mb-1.5">Description *</label>
                <textarea {...register('description', { required: 'Required' })} rows={3} className="input-glass resize-none" placeholder="Charity description..." />
                {errors.description && <p className="text-red-400 text-xs mt-1">{errors.description.message}</p>}
              </div>
              <div>
                <label className="text-warm-white/50 text-xs font-medium block mb-1.5">Logo URL</label>
                <input {...register('logoUrl')} className="input-glass" placeholder="https://..." />
              </div>
              <div>
                <label className="text-warm-white/50 text-xs font-medium block mb-1.5">Banner URL</label>
                <input {...register('bannerUrl')} className="input-glass" placeholder="https://..." />
              </div>
              <div>
                <label className="text-warm-white/50 text-xs font-medium block mb-1.5">Website</label>
                <input {...register('website')} className="input-glass" placeholder="https://..." />
              </div>
              <div className="flex items-center gap-3 pt-5">
                <input type="checkbox" {...register('isFeatured')} id="isFeatured" className="accent-emerald-500" />
                <label htmlFor="isFeatured" className="text-warm-white/60 text-sm cursor-pointer">Feature on landing page</label>
              </div>
              <div className="sm:col-span-2 flex gap-3">
                <button type="submit" disabled={isSubmitting} className="btn-primary !py-2.5 !px-5 !text-sm">
                  {isSubmitting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Save size={14} /> {editTarget ? 'Update' : 'Create'}</>}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary !py-2.5 !px-4 !text-sm"><X size={14} /></button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Charities grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <div key={i} className="skeleton h-36 rounded-2xl" />)}
        </div>
      ) : charities.length === 0 ? (
        <div className="glass-card py-16 text-center"><p className="text-warm-white/35 text-sm">No charities yet. Add one!</p></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {charities.map((c) => (
            <motion.div key={c._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5 group">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-warm-white font-semibold text-sm truncate">{c.name}</h3>
                    {c.isFeatured && <Star size={11} className="text-gold-400 fill-current shrink-0" />}
                  </div>
                  <div className="text-warm-white/30 text-xs mt-0.5">/{c.slug}</div>
                </div>
                <div className="flex gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg hover:bg-white/8 text-warm-white/40 hover:text-warm-white"><Edit2 size={12} /></button>
                  <button onClick={() => handleDelete(c._id, c.name)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-warm-white/40 hover:text-red-400"><Trash2 size={12} /></button>
                </div>
              </div>
              <p className="text-warm-white/40 text-xs line-clamp-2 mb-3">{c.description}</p>
              <div className="text-emerald-400 text-xs font-medium">£{(c.totalContributed || 0).toLocaleString()} contributed</div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default AdminCharities;
