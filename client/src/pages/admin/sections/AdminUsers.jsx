import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Users, Edit2, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { adminAPI } from '../../../api/admin';

const statusColors = {
  active: 'badge-emerald',
  inactive: 'badge-gray',
  cancelled: 'badge-red',
  lapsed: 'badge-gold',
};

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getUsers({ search, status: statusFilter, page, limit: 20 });
      setUsers(res.data.data);
      setTotal(res.data.total);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    const t = setTimeout(fetchUsers, 300);
    return () => clearTimeout(t);
  }, [search, statusFilter, page]);

  const handleRoleToggle = async (user) => {
    const newRole = user.role === 'admin' ? 'subscriber' : 'admin';
    if (!window.confirm(`Change ${user.name}'s role to ${newRole}?`)) return;
    try {
      await adminAPI.updateUser(user._id, { role: newRole });
      toast.success('Role updated');
      fetchUsers();
    } catch {
      toast.error('Failed to update role');
    }
  };

  return (
    <motion.div key="admin-users" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl text-warm-white font-bold">Users</h1>
          <p className="text-warm-white/40 text-sm mt-1">{total} total users</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-warm-white/30" />
          <input
            type="text"
            placeholder="Search name or email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="input-glass pl-10"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="input-glass w-full sm:w-44"
          style={{ colorScheme: 'dark' }}
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="cancelled">Cancelled</option>
          <option value="lapsed">Lapsed</option>
        </select>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton h-12 rounded-xl" />)}
            </div>
          ) : users.length === 0 ? (
            <div className="py-16 text-center">
              <Users size={32} className="text-warm-white/15 mx-auto mb-3" />
              <p className="text-warm-white/35 text-sm">No users found</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Subscription</th>
                  <th>Plan</th>
                  <th>Scores</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id}>
                    <td>
                      <div className="font-medium text-warm-white">{u.name}</div>
                      <div className="text-warm-white/35 text-xs">{u.email}</div>
                    </td>
                    <td><span className={u.role === 'admin' ? 'badge-gold' : 'badge-gray'}>{u.role}</span></td>
                    <td><span className={statusColors[u.subscriptionStatus] || 'badge-gray'}>{u.subscriptionStatus}</span></td>
                    <td className="text-warm-white/50 text-xs">{u.subscriptionPlan || '—'}</td>
                    <td className="text-warm-white/70">{u.scores?.length || 0}/5</td>
                    <td className="text-warm-white/40 text-xs">{u.createdAt ? format(new Date(u.createdAt), 'MMM d, yyyy') : '—'}</td>
                    <td>
                      <button
                        onClick={() => handleRoleToggle(u)}
                        className="p-1.5 rounded-lg hover:bg-white/8 text-warm-white/40 hover:text-warm-white transition-all"
                        title="Toggle admin role"
                      >
                        <Edit2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Pagination */}
      {total > 20 && (
        <div className="flex items-center justify-center gap-3 mt-5">
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn-secondary !py-2 !px-4 !text-sm disabled:opacity-30">
            Previous
          </button>
          <span className="text-warm-white/40 text-sm">Page {page} of {Math.ceil(total / 20)}</span>
          <button disabled={page >= Math.ceil(total / 20)} onClick={() => setPage(p => p + 1)} className="btn-secondary !py-2 !px-4 !text-sm disabled:opacity-30">
            Next
          </button>
        </div>
      )}
    </motion.div>
  );
};

export default AdminUsers;
