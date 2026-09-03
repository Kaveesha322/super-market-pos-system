import { useState, useEffect, useRef, useCallback } from 'react';
import { Scan, Search, Trash2, Plus, Minus, ShoppingCart, X, CreditCard, Banknote, QrCode, Printer, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { useCartStore, useAuthStore, useSettingsStore } from '../store';
import { formatCurrency } from '../lib/utils';
import BarcodeScanner from '../components/BarcodeScanner';
import PaymentModal from '../components/PaymentModal';
import ReceiptModal from '../components/ReceiptModal';

export default function POSPage() {
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCat, setSelectedCat] = useState(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [productLoading, setProductLoading] = useState(false);
  const searchRef = useRef(null);
  const { settings, fetchSettings } = useSettingsStore();

  const cart = useCartStore();
  const user = useAuthStore(s => s.user);

  useEffect(() => { fetchSettings(); }, []);

  useEffect(() => {
    api.get('/categories').then(r => setCategories(r.data)).catch(() => {});
    searchRef.current?.focus();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      if (search.length === 0 && !selectedCat) { setProducts([]); return; }
      fetchProducts();
    }, 250);
    return () => clearTimeout(t);
  }, [search, selectedCat]);

  const fetchProducts = async () => {
    setProductLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (selectedCat) params.category = selectedCat;
      const { data } = await api.get('/products', { params });
      setProducts(data.slice(0, 30));
    } catch { } finally { setProductLoading(false); }
  };

  // USB barcode reader — keyboard wedge (types barcode then Enter)
  const barcodeBuffer = useRef('');
  const barcodeTimer = useRef(null);
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (document.activeElement === searchRef.current) return;
      if (e.key === 'Enter') {
        const code = barcodeBuffer.current.trim();
        barcodeBuffer.current = '';
        if (code.length >= 3) lookupBarcode(code);
      } else if (e.key.length === 1) {
        barcodeBuffer.current += e.key;
        clearTimeout(barcodeTimer.current);
        barcodeTimer.current = setTimeout(() => { barcodeBuffer.current = ''; }, 100);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const lookupBarcode = async (code) => {
    try {
      const { data } = await api.get(`/products/barcode/${encodeURIComponent(code)}`);
      if (data.stock_qty <= 0) { toast.error(`${data.name} is out of stock!`); return; }
      cart.addItem(data);
      toast.success(`✓ ${data.name} added`, { duration: 1500 });
    } catch {
      toast.error(`Product not found: ${code}`);
    }
  };

  const handleSaleComplete = (saleData) => {
    setPaymentOpen(false);
    setReceipt({ ...saleData, settings });
    cart.clearCart();
  };

  const subtotal = cart.getSubtotal();
  const itemDiscount = cart.getItemDiscount();
  const cartDiscount = cart.discount;
  const tax = cart.getTax();
  const total = cart.getTotal();
  const itemCount = cart.items.reduce((s, i) => s + i.quantity, 0);

  return (
    <div className="flex gap-4 h-full -m-6 p-0 overflow-hidden" style={{ height: 'calc(100vh - 56px)' }}>
      {/* Left — product search */}
      <div className="flex-1 flex flex-col bg-white min-w-0">
        {/* Search bar */}
        <div className="p-4 border-b border-slate-100 bg-slate-50">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && search) lookupBarcode(search);
                }}
                placeholder="Search products or scan barcode..."
                className="w-full pl-9 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <button
              onClick={() => setScannerOpen(true)}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-all"
            >
              <Scan size={16} />
              Camera Scan
            </button>
          </div>

          {/* Categories */}
          <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
            <button
              onClick={() => setSelectedCat(null)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${!selectedCat ? 'bg-green-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
            >
              All
            </button>
            {categories.map(c => (
              <button
                key={c.id}
                onClick={() => { setSelectedCat(selectedCat === c.id ? null : c.id); }}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${selectedCat === c.id ? 'text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                style={selectedCat === c.id ? { backgroundColor: c.color } : {}}
              >
                {c.icon} {c.name}
              </button>
            ))}
          </div>
        </div>

        {/* Products grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {productLoading && (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin w-6 h-6 border-3 border-green-500 border-t-transparent rounded-full" />
            </div>
          )}
          {!productLoading && products.length === 0 && (
            <div className="flex flex-col items-center justify-center h-48 text-slate-400">
              <Scan size={40} className="mb-3 opacity-30" />
              <p className="text-sm">Scan a barcode or search for products</p>
              <p className="text-xs mt-1">USB barcode reader works automatically</p>
            </div>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {products.map(p => (
              <button
                key={p.id}
                onClick={() => {
                  if (p.stock_qty <= 0) { toast.error('Out of stock!'); return; }
                  cart.addItem(p);
                  toast.success(`✓ Added`, { duration: 1000 });
                }}
                className={`text-left p-3 rounded-xl border transition-all hover:shadow-md active:scale-95 ${
                  p.stock_qty <= 0 ? 'border-red-200 bg-red-50 opacity-60 cursor-not-allowed' : 'border-slate-200 bg-white hover:border-green-400'
                }`}
              >
                <div
                  className="w-full h-16 rounded-lg mb-2 flex items-center justify-center text-2xl"
                  style={{ backgroundColor: p.category_color ? `${p.category_color}20` : '#f1f5f9' }}
                >
                  {p.category_icon || '📦'}
                </div>
                <div className="text-xs font-semibold text-slate-700 leading-tight line-clamp-2 mb-1">{p.name}</div>
                <div className="text-xs text-slate-400 font-mono mb-1">{p.barcode}</div>
                <div className="flex items-center justify-between">
                  <div className="text-sm font-bold text-green-600">{formatCurrency(p.selling_price)}</div>
                  <div className={`text-xs ${p.stock_qty <= p.min_stock ? 'text-orange-500' : 'text-slate-400'}`}>
                    {p.stock_qty <= 0 ? 'Out' : `${p.stock_qty} ${p.unit}`}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right — Cart */}
      <div className="w-80 xl:w-96 bg-slate-900 flex flex-col flex-shrink-0">
        {/* Cart header */}
        <div className="p-4 border-b border-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-white font-semibold">
              <ShoppingCart size={18} />
              Cart
              {itemCount > 0 && (
                <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">{itemCount}</span>
              )}
            </div>
            {cart.items.length > 0 && (
              <button onClick={() => { cart.clearCart(); }} className="text-slate-400 hover:text-red-400 transition-colors">
                <RotateCcw size={16} />
              </button>
            )}
          </div>

          {/* Customer */}
          <input
            type="text"
            value={cart.customer}
            onChange={e => cart.setCustomer(e.target.value)}
            placeholder="Customer name (optional)"
            className="mt-3 w-full bg-slate-800 border border-slate-600 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-green-500 placeholder-slate-500"
          />
        </div>

        {/* Cart items */}
        <div className="flex-1 overflow-y-auto">
          {cart.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-slate-500">
              <ShoppingCart size={32} className="mb-2 opacity-30" />
              <p className="text-sm">Cart is empty</p>
            </div>
          ) : (
            <div className="p-3 space-y-2">
              {cart.items.map((item) => (
                <div key={item.product_id} className="bg-slate-800 rounded-xl p-3">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-white font-medium leading-tight truncate">{item.name}</div>
                      <div className="text-xs text-slate-400">{formatCurrency(item.unit_price)} / {item.unit}</div>
                    </div>
                    <button onClick={() => cart.removeItem(item.product_id)} className="text-slate-500 hover:text-red-400 flex-shrink-0">
                      <X size={14} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    {/* Qty controls */}
                    <div className="flex items-center gap-1 bg-slate-700 rounded-lg p-0.5">
                      <button
                        onClick={() => cart.updateQty(item.product_id, item.quantity - 1)}
                        className="w-7 h-7 flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-600 rounded-md transition-all"
                      >
                        <Minus size={14} />
                      </button>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={e => cart.updateQty(item.product_id, parseFloat(e.target.value) || 0)}
                        className="w-10 bg-transparent text-white text-center text-sm font-semibold focus:outline-none"
                        min="0" step="0.5"
                      />
                      <button
                        onClick={() => {
                          if (item.quantity >= item.stock_qty) { toast.error('Stock limit reached'); return; }
                          cart.updateQty(item.product_id, item.quantity + 1);
                        }}
                        className="w-7 h-7 flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-600 rounded-md transition-all"
                      >
                        <Plus size={14} />
                      </button>
                    </div>

                    {/* Line total */}
                    <div className="text-right">
                      {item.discount_pct > 0 && (
                        <div className="text-xs text-orange-400">{item.discount_pct}% off</div>
                      )}
                      <div className="text-sm font-bold text-green-400">
                        {formatCurrency(item.unit_price * item.quantity * (1 - (item.discount_pct || 0) / 100))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Totals & payment */}
        <div className="border-t border-slate-700 p-4 space-y-3">
          {/* Cart discount */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-xs flex-1">Cart Discount (LKR)</span>
            <input
              type="number"
              value={cart.discount || ''}
              onChange={e => cart.setDiscount(parseFloat(e.target.value) || 0)}
              placeholder="0"
              className="w-24 bg-slate-800 border border-slate-600 text-white text-sm rounded px-2 py-1 text-right focus:outline-none focus:ring-1 focus:ring-green-500"
              min="0"
            />
          </div>

          {/* Summary */}
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between text-slate-400">
              <span>Subtotal</span><span>{formatCurrency(subtotal)}</span>
            </div>
            {itemDiscount > 0 && (
              <div className="flex justify-between text-orange-400">
                <span>Item Discounts</span><span>-{formatCurrency(itemDiscount)}</span>
              </div>
            )}
            {cartDiscount > 0 && (
              <div className="flex justify-between text-orange-400">
                <span>Cart Discount</span><span>-{formatCurrency(cartDiscount)}</span>
              </div>
            )}
            {tax > 0 && (
              <div className="flex justify-between text-slate-400">
                <span>Tax</span><span>+{formatCurrency(tax)}</span>
              </div>
            )}
            <div className="flex justify-between text-white font-bold text-lg pt-2 border-t border-slate-700">
              <span>TOTAL</span><span className="text-green-400">{formatCurrency(total)}</span>
            </div>
          </div>

          {/* Payment buttons */}
          <button
            onClick={() => { if (cart.items.length === 0) { toast.error('Add items to cart first'); return; } setPaymentOpen(true); }}
            disabled={cart.items.length === 0}
            className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl text-base transition-all flex items-center justify-center gap-2"
          >
            <CreditCard size={20} />
            Process Payment
          </button>
        </div>
      </div>

      {/* Camera Scanner Modal */}
      {scannerOpen && (
        <BarcodeScanner
          onScan={(code) => { setScannerOpen(false); lookupBarcode(code); }}
          onClose={() => setScannerOpen(false)}
        />
      )}

      {/* Payment Modal */}
      {paymentOpen && (
        <PaymentModal
          total={total}
          items={cart.items}
          discount={cartDiscount}
          customer={cart.customer}
          onComplete={handleSaleComplete}
          onClose={() => setPaymentOpen(false)}
        />
      )}

      {/* Receipt Modal */}
      {receipt && (
        <ReceiptModal sale={receipt} onClose={() => setReceipt(null)} />
      )}
    </div>
  );
}
