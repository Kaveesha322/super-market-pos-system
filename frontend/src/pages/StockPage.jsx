import { useState, useEffect } from 'react';
import { AlertTriangle, Plus, TrendingDown, TrendingUp, Search, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { formatCurrency, formatDate } from '../lib/utils';

function StockAdjustModal({ product, onDone, onClose }) {
  const [type, setType] = useState('in');
  const [qty, setQty] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post(`/products/${product.id}/stock`, { quantity: parseFloat(qty), type, note });
      toast.success(`Stock ${type === 'in' ? 'added' : 'removed'} successfully`);
      onDone();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed');
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6">
        <h3 className="font-bold text-lg mb-1">Adjust Stock</h3>
        <p className="text-slate-500 text-sm mb-4">{product.name} — Current: {product.stock_qty} {product.unit}</p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            {[{ id: 'in', label: '+ Add Stock', color: 'bg-green-500' }, { id: 'out', label: '- Remove Stock', color: 'bg-red-500' }].map(t => (
              <button key={t.id} type="button" onClick={() => setType(t.id)}
                className={`py-2.5 rounded-xl font-medium text-sm transition-all ${type === t.id ? t.color + ' text-white' : 'border border-slate-200 text-slate-600'}`}>
                {t.label}
              </button>
            ))}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Quantity *</label>
            <input type="number" value={qty} onChange={e => setQty(e.target.value)} className="input-field" min="0.01" step="0.5" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Note</label>
            <input value={note} onChange={e => setNote(e.target.value)} className="input-field" placeholder="e.g. New delivery" />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border rounded-xl text-slate-700">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-green-600 text-white rounded-xl font-semibold">
              {saving ? 'Saving...' : 'Apply'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function StockPage() {
  const [products, setProducts] = useState([]);
  const [movements, setMovements] = useState([]);
  const [summary, setSummary] = useState(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [adjustProduct, setAdjustProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('stock');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [stockRes, movRes] = await Promise.all([
        api.get('/reports/stock'),
        api.get('/stock/movements', { params: { limit: 100 } }),
      ]);
      setProducts(stockRes.data.products);
      setSummary(stockRes.data.summary);
      setMovements(movRes.data);
    } catch { } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = products.filter(p => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.barcode?.includes(search);
    const matchFilter =
      filter === 'all' ? true :
      filter === 'low' ? p.stock_qty <= p.min_stock && p.stock_qty > 0 :
      filter === 'out' ? p.stock_qty <= 0 : true;
    return matchSearch && matchFilter;
  });

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-slate-800">Stock Management</h1>

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Products', value: summary.total_products, color: 'bg-blue-500', icon: Package },
            { label: 'Stock Value', value: formatCurrency(summary.total_value), color: 'bg-green-500', icon: TrendingUp },
            { label: 'Low Stock', value: summary.low_stock, color: 'bg-orange-500', icon: AlertTriangle },
            { label: 'Out of Stock', value: summary.out_of_stock, color: 'bg-red-500', icon: TrendingDown },
          ].map(card => (
            <div key={card.label} className="card p-4 flex items-center gap-3">
              <div className={`w-10 h-10 ${card.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                <card.icon size={18} className="text-white" />
              </div>
              <div>
                <div className="text-lg font-bold text-slate-800">{card.value}</div>
                <div className="text-xs text-slate-500">{card.label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2">
        {[{ id: 'stock', label: 'Stock Levels' }, { id: 'movements', label: 'Stock Movements' }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${tab === t.id ? 'bg-green-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'stock' && (
        <>
          <div className="card p-4 flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-48">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="input-field pl-9" />
            </div>
            {['all', 'low', 'out'].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all capitalize ${filter === f ? 'bg-slate-800 text-white' : 'border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                {f === 'all' ? 'All' : f === 'low' ? '⚠ Low Stock' : '🔴 Out of Stock'}
              </button>
            ))}
          </div>

          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Product</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Category</th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-600">Stock</th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-600">Min</th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-600">Value</th>
                  <th className="text-center px-4 py-3 font-semibold text-slate-600">Status</th>
                  <th className="text-center px-4 py-3 font-semibold text-slate-600">Adjust</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id} className={`border-b border-slate-100 hover:bg-slate-50 ${p.stock_qty <= 0 ? 'bg-red-50/40' : p.stock_qty <= p.min_stock ? 'bg-orange-50/40' : ''}`}>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800">{p.name}</div>
                      <div className="text-xs text-slate-400 font-mono">{p.barcode}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{p.category_name}</td>
                    <td className="px-4 py-3 text-right font-bold">
                      <span className={p.stock_qty <= 0 ? 'text-red-500' : p.stock_qty <= p.min_stock ? 'text-orange-500' : 'text-slate-700'}>
                        {p.stock_qty} {p.unit}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-slate-400">{p.min_stock}</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(p.stock_value)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`badge ${p.stock_qty <= 0 ? 'bg-red-100 text-red-600' : p.stock_qty <= p.min_stock ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-700'}`}>
                        {p.stock_qty <= 0 ? 'Out' : p.stock_qty <= p.min_stock ? 'Low' : 'OK'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => setAdjustProduct(p)}
                        className="text-xs bg-slate-700 text-white px-3 py-1.5 rounded-lg hover:bg-slate-600 transition-all">
                        Adjust
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'movements' && (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Product</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Type</th>
                <th className="text-right px-4 py-3 font-semibold text-slate-600">Qty</th>
                <th className="text-right px-4 py-3 font-semibold text-slate-600">Before</th>
                <th className="text-right px-4 py-3 font-semibold text-slate-600">After</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Note</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">User</th>
                <th className="text-right px-4 py-3 font-semibold text-slate-600">Date</th>
              </tr>
            </thead>
            <tbody>
              {movements.map(m => (
                <tr key={m.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-700">{m.product_name}</div>
                    <div className="text-xs text-slate-400 font-mono">{m.barcode}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge capitalize ${
                      m.type === 'in' ? 'bg-green-100 text-green-700' :
                      m.type === 'sale' ? 'bg-blue-100 text-blue-700' :
                      m.type === 'return' ? 'bg-purple-100 text-purple-700' :
                      'bg-orange-100 text-orange-700'
                    }`}>{m.type}</span>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold">
                    <span className={m.type === 'in' || m.type === 'return' ? 'text-green-600' : 'text-red-500'}>
                      {m.type === 'in' || m.type === 'return' ? '+' : '-'}{m.quantity}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-slate-400">{m.quantity_before}</td>
                  <td className="px-4 py-3 text-right text-slate-700">{m.quantity_after}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{m.note}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{m.user_name}</td>
                  <td className="px-4 py-3 text-right text-slate-400 text-xs">{formatDate(m.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {adjustProduct && (
        <StockAdjustModal
          product={adjustProduct}
          onDone={() => { setAdjustProduct(null); fetchData(); }}
          onClose={() => setAdjustProduct(null)}
        />
      )}
    </div>
  );
}
