import { useState, useEffect } from 'react';
import { Save, Store, Phone, Mail, MapPin, Percent, Receipt, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';

function SettingSection({ title, icon: Icon, children }) {
  return (
    <div className="card p-6">
      <div className="flex items-center gap-2 mb-5 pb-3 border-b border-slate-100">
        <Icon size={18} className="text-green-600" />
        <h3 className="font-semibold text-slate-800">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function FieldRow({ label, children }) {
  return (
    <div className="grid grid-cols-3 gap-4 items-center py-3 border-b border-slate-50">
      <label className="text-sm font-medium text-slate-600 col-span-1">{label}</label>
      <div className="col-span-2">{children}</div>
    </div>
  );
}

export default function SettingsPage() {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/settings').then(r => { setSettings(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const set = (k, v) => setSettings(s => ({ ...s, [k]: v }));

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/settings', settings);
      toast.success('Settings saved successfully!');
    } catch {
      toast.error('Failed to save settings');
    } finally { setSaving(false); }
  };

  if (loading) return <div className="flex justify-center pt-16"><div className="animate-spin w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full" /></div>;

  return (
    <form onSubmit={handleSave} className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Settings</h1>
        <button type="submit" disabled={saving}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl font-medium text-sm disabled:opacity-60">
          <Save size={16} /> {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      <SettingSection title="Store Information" icon={Store}>
        <FieldRow label="Store Name">
          <input value={settings.store_name || ''} onChange={e => set('store_name', e.target.value)} className="input-field" />
        </FieldRow>
        <FieldRow label="Address">
          <input value={settings.store_address || ''} onChange={e => set('store_address', e.target.value)} className="input-field" />
        </FieldRow>
        <FieldRow label="Phone">
          <input value={settings.store_phone || ''} onChange={e => set('store_phone', e.target.value)} className="input-field" placeholder="+94 11 234 5678" />
        </FieldRow>
        <FieldRow label="Email">
          <input type="email" value={settings.store_email || ''} onChange={e => set('store_email', e.target.value)} className="input-field" />
        </FieldRow>
        <FieldRow label="Business Reg. No.">
          <input value={settings.store_registration || ''} onChange={e => set('store_registration', e.target.value)} className="input-field" placeholder="BR-2024-XXXXXX" />
        </FieldRow>
      </SettingSection>

      <SettingSection title="Tax & Currency" icon={Percent}>
        <FieldRow label="Currency">
          <select value={settings.currency || 'LKR'} onChange={e => set('currency', e.target.value)} className="input-field">
            <option value="LKR">LKR — Sri Lankan Rupee</option>
            <option value="USD">USD — US Dollar</option>
          </select>
        </FieldRow>
        <FieldRow label="Default Tax Rate (%)">
          <input type="number" value={settings.tax_rate || '18'} onChange={e => set('tax_rate', e.target.value)} className="input-field" min="0" max="100" step="0.5" />
        </FieldRow>
        <FieldRow label="Tax Inclusive Prices">
          <div className="flex items-center gap-2">
            <input type="checkbox" id="taxInclusive" checked={settings.pos_tax_inclusive === 'true'}
              onChange={e => set('pos_tax_inclusive', String(e.target.checked))} className="w-4 h-4 accent-green-600" />
            <label htmlFor="taxInclusive" className="text-sm text-slate-600">Product prices include tax</label>
          </div>
        </FieldRow>
        <FieldRow label="Low Stock Alert (qty)">
          <input type="number" value={settings.low_stock_threshold || '5'} onChange={e => set('low_stock_threshold', e.target.value)} className="input-field" min="0" />
        </FieldRow>
      </SettingSection>

      <SettingSection title="Receipt Customization" icon={Receipt}>
        <FieldRow label="Receipt Header">
          <input value={settings.receipt_header || ''} onChange={e => set('receipt_header', e.target.value)} className="input-field" placeholder="Thank you for shopping!" />
        </FieldRow>
        <FieldRow label="Receipt Footer">
          <input value={settings.receipt_footer || ''} onChange={e => set('receipt_footer', e.target.value)} className="input-field" placeholder="Visit us again!" />
        </FieldRow>
      </SettingSection>

      <div className="card p-5 border-l-4 border-yellow-400 bg-yellow-50">
        <div className="flex gap-3">
          <AlertCircle size={18} className="text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-yellow-800">Default Admin Credentials</div>
            <div className="text-sm text-yellow-700 mt-1">
              After deployment, please change the default admin password from <code className="bg-yellow-100 px-1 rounded">admin123</code> immediately.
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
