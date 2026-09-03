import { useState, useEffect } from 'react';
import { Plus, Edit2, X, Truck, Phone, Mail, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';

function SupplierModal({ supplier, onSave, onClose }) {
  const isEdit = !!supplier?.id;
  const [form, setForm] = useState({
    name: supplier?.name || '', contact_person: supplier?.contact_person || '',
    phone: supplier?.phone || '', email: supplier?.email || '', address: supplier?.address || '',
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (isEdit) await api.put(`/suppliers/${supplier.id}`, form);
      else await api.post('/suppliers', form);
      toast.success(`Supplier ${isEdit ? 'updated' : 'added'}!`);
      onSave();
    } catch { toast.error('Failed'); } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="font-bold text-lg">{isEdit ? 'Edit Supplier' : 'Add Supplier'}</h2>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          {[
            { key: 'name', label: 'Company Name *', required: true },
            { key: 'contact_person', label: 'Contact Person' },
            { key: 'phone', label: 'Phone', placeholder: '+94 77 XXX XXXX' },
            { key: 'email', label: 'Email', type: 'email' },
            { key: 'address', label: 'Address' },
          ].map(f => (
            <div key={f.key}>
              <label className="block text-sm font-medium text-slate-700 mb-1">{f.label}</label>
              <input type={f.type || 'text'} value={form[f.key]} onChange={e => set(f.key, e.target.value)}
                className="input-field" required={f.required} placeholder={f.placeholder} />
            </div>
          ))}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border rounded-xl text-slate-700">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-green-600 text-white rounded-xl font-semibold">
              {saving ? 'Saving...' : (isEdit ? 'Update' : 'Add Supplier')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState([]);
  const [modalSupplier, setModalSupplier] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchSuppliers = async () => {
    const { data } = await api.get('/suppliers');
    setSuppliers(data);
  };

  useEffect(() => { fetchSuppliers(); }, []);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Suppliers</h1>
        <button onClick={() => { setModalSupplier(null); setModalOpen(true); }}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-xl font-medium text-sm">
          <Plus size={18} /> Add Supplier
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {suppliers.map(s => (
          <div key={s.id} className="card p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                <Truck size={18} className="text-slate-500" />
              </div>
              <button onClick={() => { setModalSupplier(s); setModalOpen(true); }}
                className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg">
                <Edit2 size={14} />
              </button>
            </div>
            <div className="font-semibold text-slate-800">{s.name}</div>
            {s.contact_person && <div className="text-sm text-slate-500 mt-0.5">{s.contact_person}</div>}
            <div className="mt-3 space-y-1">
              {s.phone && <div className="flex items-center gap-2 text-xs text-slate-500"><Phone size={12} />{s.phone}</div>}
              {s.email && <div className="flex items-center gap-2 text-xs text-slate-500"><Mail size={12} />{s.email}</div>}
              {s.address && <div className="flex items-center gap-2 text-xs text-slate-500"><MapPin size={12} />{s.address}</div>}
            </div>
          </div>
        ))}
        {suppliers.length === 0 && (
          <div className="col-span-3 text-center py-12 text-slate-400">
            <Truck size={40} className="mx-auto mb-3 opacity-30" />
            <p>No suppliers added yet</p>
          </div>
        )}
      </div>

      {modalOpen && (
        <SupplierModal supplier={modalSupplier} onSave={() => { setModalOpen(false); fetchSuppliers(); }} onClose={() => setModalOpen(false)} />
      )}
    </div>
  );
}
