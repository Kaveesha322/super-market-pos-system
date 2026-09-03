import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, TrendingUp, Package, AlertTriangle, ShoppingCart, Users } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import api from '../lib/api';
import { formatCurrency, formatDate } from '../lib/utils';

function StatCard({ title, value, sub, icon: Icon, color, link }) {
  const content = (
    <div className={`card p-5 flex items-start gap-4 hover:shadow-md transition-shadow`}>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon size={22} className="text-white" />
      </div>
      <div className="min-w-0">
        <div className="text-2xl font-bold text-slate-800 truncate">{value}</div>
        <div className="text-sm text-slate-500 mt-0.5">{title}</div>
        {sub && <div className="text-xs text-slate-400 mt-1">{sub}</div>}
      </div>
    </div>
  );
  return link ? <Link to={link}>{content}</Link> : content;
}

const PAYMENT_LABELS = { cash: 'Cash', card: 'Card', qr: 'QR Pay', mixed: 'Mixed' };

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/reports/dashboard').then(r => { setData(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
        <p className="text-slate-500 text-sm">Welcome back! Here's today's overview.</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Today's Revenue" value={formatCurrency(data?.today?.revenue)} sub={`${data?.today?.count || 0} transactions`} icon={TrendingUp} color="bg-green-500" />
        <StatCard title="Month Revenue" value={formatCurrency(data?.month?.revenue)} sub={`${data?.month?.count || 0} sales`} icon={BarChart3} color="bg-blue-500" />
        <StatCard title="Total Products" value={data?.products?.count || 0} link="/products" icon={Package} color="bg-purple-500" />
        <StatCard title="Low Stock" value={data?.lowStock?.count || 0} sub={`${data?.outOfStock?.count || 0} out of stock`} link="/stock" icon={AlertTriangle} color="bg-orange-500" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue chart */}
        <div className="lg:col-span-2 card p-5">
          <h2 className="font-semibold text-slate-700 mb-4">Revenue — Last 7 Days</h2>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data?.last7Days || []} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#16a34a" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} tickFormatter={d => d?.slice(5)} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `LKR ${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => [formatCurrency(v), 'Revenue']} labelFormatter={l => `Date: ${l}`} />
              <Area type="monotone" dataKey="revenue" stroke="#16a34a" fill="url(#revGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Top products today */}
        <div className="card p-5">
          <h2 className="font-semibold text-slate-700 mb-4">Top Products Today</h2>
          {data?.topProducts?.length === 0 && <p className="text-slate-400 text-sm">No sales today yet.</p>}
          <div className="space-y-3">
            {data?.topProducts?.slice(0, 6).map((p, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400 w-4">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-700 truncate">{p.name}</div>
                  <div className="text-xs text-slate-400">{p.qty_sold} units sold</div>
                </div>
                <div className="text-sm font-semibold text-green-600">{formatCurrency(p.revenue)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent sales */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-700">Recent Transactions</h2>
          <Link to="/reports" className="text-green-600 text-sm hover:underline">View all</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left py-2 text-slate-500 font-medium">Invoice</th>
                <th className="text-left py-2 text-slate-500 font-medium">Cashier</th>
                <th className="text-left py-2 text-slate-500 font-medium">Payment</th>
                <th className="text-right py-2 text-slate-500 font-medium">Total</th>
                <th className="text-right py-2 text-slate-500 font-medium">Time</th>
              </tr>
            </thead>
            <tbody>
              {data?.recentSales?.map(sale => (
                <tr key={sale.id} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="py-2 font-mono text-xs text-slate-600">{sale.sale_number}</td>
                  <td className="py-2">{sale.cashier_name}</td>
                  <td className="py-2">
                    <span className={`badge ${
                      sale.payment_method === 'cash' ? 'bg-green-100 text-green-700' :
                      sale.payment_method === 'card' ? 'bg-blue-100 text-blue-700' :
                      'bg-purple-100 text-purple-700'
                    }`}>{PAYMENT_LABELS[sale.payment_method]}</span>
                  </td>
                  <td className="py-2 text-right font-semibold">{formatCurrency(sale.total)}</td>
                  <td className="py-2 text-right text-slate-400 text-xs">{formatDate(sale.created_at)}</td>
                </tr>
              ))}
              {!data?.recentSales?.length && (
                <tr><td colSpan={5} className="py-6 text-center text-slate-400">No sales yet today</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
