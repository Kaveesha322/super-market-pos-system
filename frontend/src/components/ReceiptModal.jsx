import { useRef } from 'react';
import { X, Printer } from 'lucide-react';
import { formatCurrency, formatDate } from '../lib/utils';

export default function ReceiptModal({ sale, onClose }) {
  const printRef = useRef(null);
  const settings = sale.settings || {};

  const handlePrint = () => {
    const content = printRef.current?.innerHTML;
    const win = window.open('', '_blank', 'width=400,height=600');
    win.document.write(`
      <html><head><title>Receipt</title>
      <style>
        body { font-family: 'Courier New', monospace; font-size: 12px; width: 80mm; margin: 0; padding: 8px; }
        .center { text-align: center; }
        .line { border-top: 1px dashed #000; margin: 6px 0; }
        .bold { font-weight: bold; }
        table { width: 100%; border-collapse: collapse; }
        td { padding: 2px 0; vertical-align: top; }
        .right { text-align: right; }
        .lg { font-size: 14px; }
      </style>
      </head><body>${content}</body></html>
    `);
    win.document.close();
    win.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="font-semibold text-slate-800">Receipt</div>
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 bg-green-600 text-white text-sm px-3 py-1.5 rounded-lg hover:bg-green-700 transition-all"
            >
              <Printer size={15} /> Print
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"><X size={18} /></button>
          </div>
        </div>

        {/* Receipt preview */}
        <div className="p-4 overflow-y-auto max-h-96">
          <div ref={printRef} style={{ fontFamily: 'Courier New, monospace', fontSize: '12px' }}>
            {/* Store header */}
            <div className="center bold lg">{settings.store_name || 'Super Lanka Mart'}</div>
            <div className="center" style={{ fontSize: '10px', color: '#555' }}>{settings.store_address}</div>
            <div className="center" style={{ fontSize: '10px' }}>Tel: {settings.store_phone}</div>
            {settings.store_registration && (
              <div className="center" style={{ fontSize: '10px' }}>Reg: {settings.store_registration}</div>
            )}
            <div className="line" />

            {/* Invoice info */}
            <table>
              <tbody>
                <tr><td>Invoice:</td><td className="right bold">{sale.sale_number}</td></tr>
                <tr><td>Date:</td><td className="right">{formatDate(sale.created_at)}</td></tr>
                <tr><td>Cashier:</td><td className="right">{sale.cashier_name}</td></tr>
                {sale.customer_name && <tr><td>Customer:</td><td className="right">{sale.customer_name}</td></tr>}
              </tbody>
            </table>
            <div className="line" />

            {/* Items */}
            <table>
              <thead>
                <tr>
                  <td className="bold">Item</td>
                  <td className="right bold">Qty</td>
                  <td className="right bold">Price</td>
                  <td className="right bold">Total</td>
                </tr>
              </thead>
              <tbody>
                <tr><td colSpan={4}><div className="line" /></td></tr>
                {(sale.items || []).map((item, i) => (
                  <>
                    <tr key={i}>
                      <td colSpan={4} style={{ fontSize: '11px' }}>{item.product_name}</td>
                    </tr>
                    <tr>
                      <td></td>
                      <td className="right">{item.quantity}</td>
                      <td className="right">{item.unit_price?.toFixed(2)}</td>
                      <td className="right">{item.line_total?.toFixed(2)}</td>
                    </tr>
                    {item.discount_amount > 0 && (
                      <tr><td colSpan={3} style={{ color: '#c00' }}>  Discount</td><td className="right" style={{ color: '#c00' }}>-{item.discount_amount?.toFixed(2)}</td></tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
            <div className="line" />

            {/* Totals */}
            <table>
              <tbody>
                <tr><td>Subtotal</td><td className="right">{sale.subtotal?.toFixed(2)}</td></tr>
                {sale.discount_amount > 0 && <tr><td>Discount</td><td className="right" style={{ color: '#c00' }}>-{sale.discount_amount?.toFixed(2)}</td></tr>}
                {sale.tax_amount > 0 && <tr><td>Tax</td><td className="right">+{sale.tax_amount?.toFixed(2)}</td></tr>}
                <tr className="bold lg"><td>TOTAL (LKR)</td><td className="right">{sale.total?.toFixed(2)}</td></tr>
                <tr><td>Paid ({sale.payment_method?.toUpperCase()})</td><td className="right">{sale.amount_paid?.toFixed(2)}</td></tr>
                {sale.change_amount > 0 && <tr><td>Change</td><td className="right">{sale.change_amount?.toFixed(2)}</td></tr>}
              </tbody>
            </table>
            <div className="line" />

            {/* Footer */}
            <div className="center" style={{ fontSize: '11px', marginTop: '8px' }}>
              {settings.receipt_header || 'Thank you for shopping!'}
            </div>
            <div className="center" style={{ fontSize: '10px', color: '#777', marginTop: '4px' }}>
              {settings.receipt_footer}
            </div>
            <div className="center" style={{ fontSize: '10px', color: '#777', marginTop: '4px' }}>
              Powered by Super Lanka POS
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
