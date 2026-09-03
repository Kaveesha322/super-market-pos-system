import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Package, Users, Download, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import api from '../lib/api';
import { formatCurrency, formatNumber, today } from '../lib/utils';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const TABS = [
  { id: 'sales', label: 'Sales Report', icon: TrendingUp },
  { id: 'products', label: 'Top Products', icon: Package },
  { id: 'stock', label: 'Stock Report', icon: BarChart3 },
  { id: 'cashier', label: 'Cashier Report', icon: Users },
];

export default function ReportsPage() {
  const [tab, setTab] = useState('sales');
  const [from, setFrom] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [to, setTo] = useState(today);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchReport(); }, [tab, from, to]);

  const fetchReport = async () => {
    setLoading(true);
    setData(null);
    try {
      let res;
      if (tab === 'sales') res = await api.get('/reports/sales', { params: { from, to } });
      else if (tab === 'products') res = await api.get('/reports/products', { params: { from, to, limit: 30 } });
      else if (tab === 'stock') res = await api.get('/reports/stock');
      else if (tab === 'cashier') res = await api.get('/reports/cashier', { params: { from, to } });
      setData(res.data);
    } catch { } finally { setLoading(false); }
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`Super Lanka Mart — ${TABS.find(t => t.id === tab)?.label}`, 14, 20);
    doc.setFontSize(10);
    doc.text(`Period: ${from} to ${to}`, 14, 28);

    if (tab === 'sales' && data?.sales) {
      autoTable(doc, {
        startY: 35,
        head: [['Period', 'Transactions', 'Revenue', 'Discounts', 'Tax']],
        body: data.sales.map(s => [s.period, s.transactions, formatCurrency(s.revenue), formatCurrency(s.discounts), formatCurrency(s.tax)]),
      });
    } else if (tab === 'products' && Array.isArray(data)) {
      autoTable(doc, {
        startY: 35,
        head: [['#', 'Product', 'Category', 'Qty Sold', 'Revenue', 'Profit']],
        body: data.map((p, i) => [i + 1, p.name, p.category || '-', formatNumber(p.qty_sold), formatCurrency(p.revenue), formatCurrency(p.profit)]),
      });
    } else if (tab === 'stock' && data?.products) {
      autoTable(doc, {
        startY: 35,
        head: [['Product', 'Category', 'Stock', 'Min', 'Value', 'Status']],
        body: data.products.map(p => [p.name, p.category_name || '-', `${p.stock_qty} ${p.unit}`, p.min_stock, formatCurrency(p.stock_value), p.stock_qty <= 0 ? 'Out' : p.stock_qty <= p.min_stock ? 'Low' : 'OK']),
      });
    }

    doc.save(`report-${tab}-${from}-${to}.pdf`);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Reports & Analytics</h1>
        <button onClick={exportPDF} className="flex items-center gap-2 bg-slate-700 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl text-sm font-medium">
          <Download size={16} /> Export PDF
        </button>
      </div>

      {/* Tab selector */}
      <div className="flex gap-2 flex-wrap">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${tab === t.id ? 'bg-green-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
            <t.icon size={15} /> {t.label}
          </button>
        ))}
      </div>

      {/* Date range */}
      {tab !== 'stock' && (
        <div className="card p-4 flex items-center gap-3 flex-wrap">
          <Calendar size={16} className="text-slate-500" />
          <span className="text-sm text-slate-600 font-medium">From:</span>
          <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="input-field w-40" />
          <span className="text-sm text-slate-600 font-medium">To:</span>
          <input type="date" value={to} onChange={e => setTo(e.target.value)} className="input-field w-40" />
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-16">
          <div className="animate-spin w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full" />
        </div>
      )}

      {/* Sales Report */}
      {tab === 'sales' && data && !loading && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Revenue', value: formatCurrency(data.summary?.revenue) },
              { label: 'Transactions', value: formatNumber(data.summary?.transactions) },
              { label: 'Avg. Sale Value', value: formatCurrency(data.summary?.avg_sale) },
              { label: 'Total Discounts', value: formatCurrency(data.summary?.discounts) },
            ].map(card => (
              <div key={card.label} className="card p-4">
                <div className="text-xl font-bold text-slate-800">{card.value}</div>
                <div className="text-xs text-slate-500 mt-1">{card.label}</div>
              </div>
            ))}
          </div>
          <div className="card p-5">
            <h3 className="font-semibold text-slate-700 mb-4">Revenue Over Time</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.sales} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={v => [formatCurrency(v)]} />
                <Bar dataKey="revenue" fill="#16a34a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Period</th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-600">Transactions</th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-600">Revenue</th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-600">Discounts</th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-600">Tax</th>
                </tr>
              </thead>
              <tbody>
                {data.sales.map(s => (
                  <tr key={s.period} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-2.5 font-mono text-xs text-slate-600">{s.period}</td>
                    <td className="px-4 py-2.5 text-right">{s.transactions}</td>
                    <td className="px-4 py-2.5 text-right font-semibold text-green-600">{formatCurrency(s.revenue)}</td>
                    <td className="px-4 py-2.5 text-right text-orange-500">-{formatCurrency(s.discounts)}</td>
                    <td className="px-4 py-2.5 text-right text-slate-500">{formatCurrency(s.tax)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Products Report */}
      {tab === 'products' && Array.isArray(data) && !loading && (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">#</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Product</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Category</th>
                <th className="text-right px-4 py-3 font-semibold text-slate-600">Qty Sold</th>
                <th className="text-right px-4 py-3 font-semibold text-slate-600">Revenue</th>
                <th className="text-right px-4 py-3 font-semibold text-slate-600">Cost</th>
                <th className="text-right px-4 py-3 font-semibold text-slate-600">Profit</th>
              </tr>
            </thead>
            <tbody>
              {data.map((p, i) => (
                <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-2.5 text-slate-400 font-bold">{i + 1}</td>
                  <td className="px-4 py-2.5">
                    <div className="font-medium text-slate-700">{p.name}</div>
                    <div className="text-xs text-slate-400 font-mono">{p.barcode}</div>
                  </td>
                  <td className="px-4 py-2.5 text-slate-500">{p.category || '-'}</td>
                  <td className="px-4 py-2.5 text-right font-semibold">{formatNumber(p.qty_sold)}</td>
                  <td className="px-4 py-2.5 text-right text-green-600 font-semibold">{formatCurrency(p.revenue)}</td>
                  <td className="px-4 py-2.5 text-right text-slate-500">{formatCurrency(p.cost)}</td>
                  <td className="px-4 py-2.5 text-right font-bold text-blue-600">{formatCurrency(p.profit)}</td>
                </tr>
              ))}
              {data.length === 0 && <tr><td colSpan={7} className="text-center py-8 text-slate-400">No sales data for this period</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {/* Stock Report */}
      {tab === 'stock' && data && !loading && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Products', value: data.summary?.total_products },
              { label: 'Total Stock Value', value: formatCurrency(data.summary?.total_value) },
              { label: 'Low Stock Items', value: data.summary?.low_stock },
              { label: 'Out of Stock', value: data.summary?.out_of_stock },
            ].map(card => (
              <div key={card.label} className="card p-4">
                <div className="text-xl font-bold text-slate-800">{card.value}</div>
                <div className="text-xs text-slate-500 mt-1">{card.label}</div>
              </div>
            ))}
          </div>
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Product</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Category</th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-600">Stock</th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-600">Min</th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-600">Unit Cost</th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-600">Stock Value</th>
                  <th className="text-center px-4 py-3 font-semibold text-slate-600">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.products.map(p => (
                  <tr key={p.id} className={`border-b border-slate-100 hover:bg-slate-50 ${p.stock_qty <= 0 ? 'bg-red-50/50' : p.stock_qty <= p.min_stock ? 'bg-orange-50/50' : ''}`}>
                    <td className="px-4 py-2.5">
                      <div className="font-medium text-slate-700">{p.name}</div>
                      <div className="text-xs font-mono text-slate-400">{p.barcode}</div>
                    </td>
                    <td className="px-4 py-2.5 text-slate-500">{p.category_name || '-'}</td>
                    <td className="px-4 py-2.5 text-right font-semibold">{p.stock_qty} {p.unit}</td>
                    <td className="px-4 py-2.5 text-right text-slate-400">{p.min_stock}</td>
                    <td className="px-4 py-2.5 text-right">{formatCurrency(p.cost_price)}</td>
                    <td className="px-4 py-2.5 text-right font-semibold text-blue-600">{formatCurrency(p.stock_value)}</td>
                    <td className="px-4 py-2.5 text-center">
                      <span className={`badge ${p.stock_qty <= 0 ? 'bg-red-100 text-red-600' : p.stock_qty <= p.min_stock ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-700'}`}>
                        {p.stock_qty <= 0 ? 'Out' : p.stock_qty <= p.min_stock ? 'Low' : 'OK'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Cashier Report */}
      {tab === 'cashier' && Array.isArray(data) && !loading && (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Cashier</th>
                <th className="text-right px-4 py-3 font-semibold text-slate-600">Transactions</th>
                <th className="text-right px-4 py-3 font-semibold text-slate-600">Total Revenue</th>
                <th className="text-right px-4 py-3 font-semibold text-slate-600">Avg. Sale</th>
              </tr>
            </thead>
            <tbody>
              {data.map(c => (
                <tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">{c.name}</td>
                  <td className="px-4 py-3 text-right">{c.transactions}</td>
                  <td className="px-4 py-3 text-right font-semibold text-green-600">{formatCurrency(c.revenue)}</td>
                  <td className="px-4 py-3 text-right">{formatCurrency(c.avg_sale)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
