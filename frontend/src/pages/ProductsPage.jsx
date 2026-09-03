import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Edit2, Trash2, Package, BarChart2, ChevronUp, ChevronDown, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { formatCurrency, generateBarcodeNumber } from '../lib/utils';

function ProductModal({ product, categories, suppliers, onSave, onClose }) {
  const isEdit = !!product?.id;
  const [form, setForm] = useState({
    barcode: product?.barcode || generateBarcodeNumber(),
    name: product?.name || '',
    name_si: product?.name_si || '',
    category_id: product?.category_id || '',
    supplier_id: product?.supplier_id || '',
    unit: product?.unit || 'pcs',
    cost_price: product?.cost_price || '',
    selling_price: product?.selling_price || '',
    stock_qty: product?.stock_qty || 0,
    min_stock: product?.min_stock || 5,
    max_stock: product?.max_stock || 1000,
    tax_rate: product?.tax_rate || 0,
    discount_pct: product?.discount_pct || 0,
  });
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const margin = form.selling_price && form.cost_price
    ? (((form.selling_price - form.cost_price) / form.selling_price) * 100).toFixed(1)
    : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (isEdit) {
        await api.put(`/products/${product.id}`, form);
        toast.success('Product updated!');
      } else {
        await api.post('/products', form);
        toast.success('Product added!');
      }
      onSave();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save product');
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl my-4">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="font-bold text-lg text-slate-800">{isEdit ? 'Edit Product' : 'Add New Product'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Barcode *</label>
              <div className="flex gap-2">
                <input value={form.barcode} onChange={e => set('barcode', e.target.value)} className="input-field font-mono" required />
                <button type="button" onClick={() => set('barcode', generateBarcodeNumber())}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs text-slate-600 whitespace-nowrap">Gen New</button>
              </div>
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Product Name (English) *</label>
              <input value={form.name} onChange={e => set('name', e.target.value)} className="input-field" required placeholder="e.g. Coca-Cola 330ml" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
              <select value={form.category_id} onChange={e => set('category_id', e.target.value)} className="input-field">
                <option value="">-- Select Category --</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Supplier</label>
              <select value={form.supplier_id} onChange={e => set('supplier_id', e.target.value)} className="input-field">
                <option value="">-- Select Supplier --</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Unit</label>
              <select value={form.unit} onChange={e => set('unit', e.target.value)} className="input-field">
                {['pcs', 'kg', 'g', 'L', 'ml', 'dozen', 'pack', 'box', 'bottle', 'can'].map(u => <option key={u}>{u}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tax Rate (%)</label>
              <input type="number" value={form.tax_rate} onChange={e => set('tax_rate', e.target.value)} className="input-field" min="0" max="100" step="0.5" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Cost Price (LKR) *</label>
              <input type="number" value={form.cost_price} onChange={e => set('cost_price', e.target.value)} className="input-field" required min="0" step="0.01" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Selling Price (LKR) *
                {margin && <span className="ml-2 text-xs font-normal text-green-600">Margin: {margin}%</span>}
              </label>
              <input type="number" value={form.selling_price} onChange={e => set('selling_price', e.target.value)} className="input-field" required min="0" step="0.01" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Stock Qty</label>
              <input type="number" value={form.stock_qty} onChange={e => set('stock_qty', e.target.value)} className="input-field" min="0" step="0.5" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Min Stock Alert</label>
              <input type="number" value={form.min_stock} onChange={e => set('min_stock', e.target.value)} className="input-field" min="0" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Discount (%)</label>
              <input type="number" value={form.discount_pct} onChange={e => set('discount_pct', e.target.value)} className="input-field" min="0" max="100" step="0.5" />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-slate-300 rounded-xl text-slate-700 font-medium hover:bg-slate-50">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 disabled:opacity-60">
              {saving ? 'Saving...' : (isEdit ? 'Update Product' : 'Add Product')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [modalProduct, setModalProduct] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [p, c, s] = await Promise.all([
        api.get('/products', { params: { search, category: catFilter, active: 'all' } }),
        api.get('/categories'),
        api.get('/suppliers'),
      ]);
      setProducts(p.data);
      setCategories(c.data);
      setSuppliers(s.data);
    } catch { } finally { setLoading(false); }
  }, [search, catFilter]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleDelete = async (id) => {
    if (!confirm('Deactivate this product?')) return;
    await api.delete(`/products/${id}`);
    toast.success('Product deactivated');
    fetchAll();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Products</h1>
          <p className="text-slate-500 text-sm">{products.length} products total</p>
        </div>
        <button
          onClick={() => { setModalProduct(null); setModalOpen(true); }}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition-all"
        >
          <Plus size={18} /> Add Product
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4 flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or barcode..."
            className="input-field pl-9"
          />
        </div>
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)} className="input-field w-48">
          <option value="">All Categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
        </select>
      </div>

      {/* Products table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Product</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Barcode</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Category</th>
                <th className="text-right px-4 py-3 font-semibold text-slate-600">Cost</th>
                <th className="text-right px-4 py-3 font-semibold text-slate-600">Price</th>
                <th className="text-right px-4 py-3 font-semibold text-slate-600">Stock</th>
                <th className="text-center px-4 py-3 font-semibold text-slate-600">Status</th>
                <th className="text-center px-4 py-3 font-semibold text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={8} className="text-center py-8 text-slate-400">
                  <div className="inline-block animate-spin w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full" />
                </td></tr>
              )}
              {!loading && products.length === 0 && (
                <tr><td colSpan={8} className="text-center py-8 text-slate-400">No products found</td></tr>
              )}
              {products.map(p => (
                <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-800">{p.name}</div>
                    <div className="text-xs text-slate-400">{p.unit}</div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">{p.barcode}</td>
                  <td className="px-4 py-3">
                    {p.category_name ? (
                      <span className="badge text-white text-xs" style={{ backgroundColor: p.category_color || '#888' }}>
                        {p.category_icon} {p.category_name}
                      </span>
                    ) : '-'}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-600">{formatCurrency(p.cost_price)}</td>
                  <td className="px-4 py-3 text-right font-semibold text-green-600">{formatCurrency(p.selling_price)}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={`font-semibold ${p.stock_qty <= 0 ? 'text-red-500' : p.stock_qty <= p.min_stock ? 'text-orange-500' : 'text-slate-700'}`}>
                      {p.stock_qty} {p.unit}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`badge ${p.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                      {p.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => { setModalProduct(p); setModalOpen(true); }}
                        className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors">
                        <Edit2 size={15} />
                      </button>
                      <button onClick={() => handleDelete(p.id)}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <ProductModal
          product={modalProduct}
          categories={categories}
          suppliers={suppliers}
          onSave={() => { setModalOpen(false); fetchAll(); }}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  );
}
