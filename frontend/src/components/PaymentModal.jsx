import { useState } from 'react';
import { X, Banknote, CreditCard, QrCode, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { formatCurrency } from '../lib/utils';

const PAYMENT_METHODS = [
  { id: 'cash', label: 'Cash', icon: Banknote, color: 'bg-green-500' },
  { id: 'card', label: 'Card', icon: CreditCard, color: 'bg-blue-500' },
  { id: 'qr', label: 'QR Pay', icon: QrCode, color: 'bg-purple-500' },
];

export default function PaymentModal({ total, items, discount, customer, onComplete, onClose }) {
  const [method, setMethod] = useState('cash');
  const [amountPaid, setAmountPaid] = useState('');
  const [loading, setLoading] = useState(false);

  const paid = parseFloat(amountPaid) || 0;
  const change = Math.max(0, paid - total);

  const quickAmounts = [
    Math.ceil(total / 100) * 100,
    Math.ceil(total / 500) * 500,
    Math.ceil(total / 1000) * 1000,
    2000, 5000, 10000,
  ].filter((v, i, arr) => v >= total && arr.indexOf(v) === i).slice(0, 4);

  const handlePay = async () => {
    if (method === 'cash' && paid < total) {
      toast.error('Amount paid is less than total');
      return;
    }
    setLoading(true);
    try {
      const saleData = {
        items: items.map(i => ({
          product_id: i.product_id,
          quantity: i.quantity,
          unit_price: i.unit_price,
          discount_pct: i.discount_pct || 0,
        })),
        discount_amount: discount || 0,
        payment_method: method,
        amount_paid: method === 'cash' ? paid : total,
        customer_name: customer,
      };
      const { data } = await api.post('/sales', saleData);
      toast.success('Sale completed!');
      onComplete(data);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Sale failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-slate-800 text-white p-5 flex items-center justify-between">
          <div>
            <div className="font-bold text-lg">Process Payment</div>
            {customer && <div className="text-slate-300 text-sm">Customer: {customer}</div>}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-700"><X size={20} /></button>
        </div>

        <div className="p-5 space-y-5">
          {/* Total */}
          <div className="text-center bg-green-50 rounded-xl p-4 border border-green-200">
            <div className="text-sm text-green-600 font-medium">Total Amount</div>
            <div className="text-4xl font-bold text-green-700 mt-1">{formatCurrency(total)}</div>
          </div>

          {/* Payment method */}
          <div>
            <div className="text-sm font-medium text-slate-700 mb-2">Payment Method</div>
            <div className="grid grid-cols-3 gap-2">
              {PAYMENT_METHODS.map(m => (
                <button
                  key={m.id}
                  onClick={() => setMethod(m.id)}
                  className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 transition-all ${
                    method === m.id ? `border-green-500 ${m.color} text-white` : 'border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <m.icon size={22} />
                  <span className="text-xs font-medium">{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Cash amount input */}
          {method === 'cash' && (
            <div>
              <div className="text-sm font-medium text-slate-700 mb-2">Amount Received (LKR)</div>
              <input
                type="number"
                value={amountPaid}
                onChange={e => setAmountPaid(e.target.value)}
                placeholder={`Min: ${total.toFixed(2)}`}
                className="input-field text-xl font-bold text-center"
                min={total}
                autoFocus
              />
              {/* Quick amount buttons */}
              <div className="flex gap-2 mt-2">
                {quickAmounts.map(a => (
                  <button
                    key={a}
                    onClick={() => setAmountPaid(String(a))}
                    className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-medium text-slate-700 transition-all"
                  >
                    {a.toLocaleString()}
                  </button>
                ))}
              </div>

              {paid >= total && (
                <div className="mt-3 bg-blue-50 border border-blue-200 rounded-xl p-3 text-center">
                  <div className="text-sm text-blue-600">Change to Return</div>
                  <div className="text-2xl font-bold text-blue-700">{formatCurrency(change)}</div>
                </div>
              )}
            </div>
          )}

          {(method === 'card' || method === 'qr') && (
            <div className="bg-slate-50 rounded-xl p-4 text-center border border-slate-200">
              {method === 'qr' ? (
                <>
                  <QrCode size={48} className="mx-auto text-purple-500 mb-2" />
                  <div className="text-sm text-slate-600">Show QR code to customer for LankaPay/CEFT payment</div>
                </>
              ) : (
                <>
                  <CreditCard size={48} className="mx-auto text-blue-500 mb-2" />
                  <div className="text-sm text-slate-600">Swipe/tap card on terminal</div>
                </>
              )}
              <div className="text-lg font-bold mt-2 text-slate-800">{formatCurrency(total)}</div>
            </div>
          )}

          {/* Complete button */}
          <button
            onClick={handlePay}
            disabled={loading || (method === 'cash' && paid < total)}
            className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl text-base transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <>
                <CheckCircle size={20} />
                Complete Sale
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
