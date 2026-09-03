import { useState, useEffect } from 'react';
import { Plus, Edit2, X, User, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { formatDate } from '../lib/utils';

const ROLES = [
  { id: 'admin', label: 'Admin', color: 'bg-red-100 text-red-700', desc: 'Full access' },
  { id: 'manager', label: 'Manager', color: 'bg-blue-100 text-blue-700', desc: 'Inventory, reports, no settings' },
  { id: 'cashier', label: 'Cashier', color: 'bg-green-100 text-green-700', desc: 'POS & dashboard only' },
];

function UserModal({ user, onSave, onClose }) {
  const isEdit = !!user?.id;
  const [form, setForm] = useState({
    name: user?.name || '', email: user?.email || '',
    role: user?.role || 'cashier', password: '', active: user?.active !== undefined ? user.active : 1,
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isEdit && !form.password) { toast.error('Password required for new user'); return; }
    setSaving(true);
    try {
      if (isEdit) await api.put(`/users/${user.id}`, form);
      else await api.post('/users', form);
      toast.success(`User ${isEdit ? 'updated' : 'created'}!`);
      onSave();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed');
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="font-bold text-lg">{isEdit ? 'Edit User' : 'Add User'}</h2>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Full Name *</label>
            <input value={form.name} onChange={e => set('name', e.target.value)} className="input-field" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
            <input type="email" value={form.email} onChange={e => set('email', e.target.value)} className="input-field" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
            <div className="grid grid-cols-3 gap-2">
              {ROLES.map(r => (
                <button key={r.id} type="button" onClick={() => set('role', r.id)}
                  className={`py-2 px-3 rounded-xl border-2 text-xs font-medium transition-all ${form.role === r.id ? 'border-green-500 bg-green-50 text-green-700' : 'border-slate-200 text-slate-600'}`}>
                  {r.label}
                  <div className="text-xs font-normal text-slate-400 mt-0.5">{r.desc}</div>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Password {isEdit && <span className="text-slate-400 font-normal">(leave blank to keep)</span>}
            </label>
            <input type="password" value={form.password} onChange={e => set('password', e.target.value)}
              className="input-field" placeholder={isEdit ? 'Leave blank to keep current' : 'Set password'} />
          </div>
          {isEdit && (
            <div className="flex items-center gap-3">
              <input type="checkbox" id="activeCheck" checked={form.active === 1} onChange={e => set('active', e.target.checked ? 1 : 0)} className="w-4 h-4" />
              <label htmlFor="activeCheck" className="text-sm text-slate-700">Active user</label>
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border rounded-xl text-slate-700">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-green-600 text-white rounded-xl font-semibold">
              {saving ? 'Saving...' : (isEdit ? 'Update' : 'Create User')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [modalUser, setModalUser] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/users');
      setUsers(data);
    } catch { } finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, []);

  const roleInfo = (role) => ROLES.find(r => r.id === role);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">User Management</h1>
          <p className="text-slate-500 text-sm">{users.length} users total</p>
        </div>
        <button onClick={() => { setModalUser(null); setModalOpen(true); }}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-xl font-medium text-sm">
          <Plus size={18} /> Add User
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.map(u => {
          const role = roleInfo(u.role);
          return (
            <div key={u.id} className={`card p-5 flex items-start gap-4 ${!u.active ? 'opacity-60' : ''}`}>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0 ${
                u.role === 'admin' ? 'bg-red-100 text-red-600' : u.role === 'manager' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'
              }`}>
                {u.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-semibold text-slate-800">{u.name}</div>
                    <div className="text-sm text-slate-500">{u.email}</div>
                  </div>
                  <button onClick={() => { setModalUser(u); setModalOpen(true); }}
                    className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg">
                    <Edit2 size={14} />
                  </button>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`badge ${role?.color}`}>{role?.label}</span>
                  {!u.active && <span className="badge bg-slate-100 text-slate-500">Inactive</span>}
                </div>
                {u.last_login && (
                  <div className="text-xs text-slate-400 mt-1">Last login: {formatDate(u.last_login)}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {modalOpen && (
        <UserModal user={modalUser} onSave={() => { setModalOpen(false); fetchUsers(); }} onClose={() => setModalOpen(false)} />
      )}
    </div>
  );
}
