
import React, { useState, useEffect } from 'react';
import { db } from '../db';
import { Product, Sale, SaleItem, User, ShopSettings } from '../types';
import { Search, ShoppingBag, Trash2, Printer, CheckCircle2, X, Plus, Minus } from 'lucide-react';

const POS = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<Sale['paymentMethod']>('Cash');
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastSale, setLastSale] = useState<Sale | null>(null);
  const [user, setUser] = useState<User | null>(null);
  
  const [settings, setSettings] = useState<ShopSettings>({
    businessName: 'SNA! MOBILE',
    tagline: '',
    address: '',
    phone: '',
    tin: '',
    receiptFooter: '',
    currency: 'UGX',
    taxEnabled: false,
    taxRate: 0,
    postgresUrl: '',
    postgresKey: '',
    syncEnabled: false
  });

  useEffect(() => {
    const loadData = async () => {
      const [prodData, settingsData] = await Promise.all([
        db.products.getAll(),
        db.settings.get()
      ]);
      setProducts(prodData);
      setSettings(settingsData);
      setUser(db.auth.getCurrentUser());
    };
    loadData();
  }, []);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.sku.toLowerCase().includes(search.toLowerCase())
  );

  const addToCart = (product: Product) => {
    if ((product.quantity ?? 0) <= 0) {
      alert('Out of stock!');
      return;
    }
    const existing = cart.find(item => item.productId === product.id);
    if (existing) {
      if (existing.quantity >= (product.quantity ?? 0)) {
        alert('Cannot exceed available stock');
        return;
      }
      setCart(cart.map(item => item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setCart([...cart, { productId: product.id, name: product.name, quantity: 1, price: product.sellingPrice ?? 0 }]);
    }
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(cart.map(item => {
      if (item.productId === id) {
        const product = products.find(p => p.id === id);
        const newQty = Math.max(0, item.quantity + delta);
        if (product && newQty > (product.quantity ?? 0)) return item;
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter(item => item.productId !== id));
  };

  const subtotal = cart.reduce((acc, item) => acc + ((item.price ?? 0) * (item.quantity ?? 0)), 0);
  const taxAmount = settings.taxEnabled ? (subtotal * (settings.taxRate / 100)) : 0;
  const grandTotal = subtotal + taxAmount;

  const checkout = async () => {
    if (cart.length === 0) return;
    
    const currentUser = user || { id: 'unknown', username: 'Guest', name: 'Guest', role: 'Cashier' };
    
    const sale: Sale = {
      id: Math.random().toString(36).substring(2, 11),
      invoiceNumber: `INV-${Math.floor(100000 + Math.random() * 900000)}`,
      cashierId: currentUser.id,
      items: cart,
      total: grandTotal,
      discount: 0,
      paymentMethod,
      date: new Date().toISOString()
    };

    const updatedProducts = products.map(p => {
      const cartItem = cart.find(item => item.productId === p.id);
      if (cartItem) {
        return { ...p, quantity: (p.quantity ?? 0) - cartItem.quantity };
      }
      return p;
    });

    await db.products.save(updatedProducts);
    const allSales = await db.sales.getAll();
    await db.sales.save([sale, ...allSales]);
    await db.audit.add({ userId: currentUser.id, username: currentUser.username, action: `Processed sale ${sale.invoiceNumber}` });

    setLastSale(sale);
    setShowReceipt(true);
    setCart([]);
    setProducts(updatedProducts);
  };

  const printReceipt = () => {
    if (!lastSale) return;
    
    const printArea = document.getElementById('print-area');
    if (!printArea) return;

    printArea.innerHTML = `
      <div class="thermal-receipt">
        <div class="center bold header">${settings.businessName}</div>
        <div class="center">${settings.tagline}</div>
        <div class="center text-[10px]">${settings.address}</div>
        <div class="center text-[10px]">Tel: ${settings.phone}</div>
        ${settings.tin ? `<div class="center text-[10px]">TIN: ${settings.tin}</div>` : ''}
        
        <hr />
        <div style="margin-bottom: 2px">Invoice: <span class="bold">${lastSale.invoiceNumber}</span></div>
        <div style="margin-bottom: 2px">Date: ${new Date(lastSale.date).toLocaleString()}</div>
        <div style="margin-bottom: 4px">Cashier: ${user?.name || 'Staff'}</div>
        <hr />
        
        <table style="margin: 10px 0">
          <thead>
            <tr>
              <th style="font-size: 11px">ITEM</th>
              <th style="text-align: right; font-size: 11px">QTY</th>
              <th style="text-align: right; font-size: 11px">PRICE</th>
            </tr>
          </thead>
          <tbody>
            ${lastSale.items.map(item => `
              <tr>
                <td style="font-size: 11px">${item.name}</td>
                <td style="text-align: right; font-size: 11px">${(item.quantity ?? 0)}</td>
                <td style="text-align: right; font-size: 11px">${((item.price ?? 0) * (item.quantity ?? 0)).toLocaleString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <hr />
        <div style="display: flex; justify-content: space-between; margin-top: 5px">
          <span>Subtotal:</span>
          <span>UGX ${(subtotal ?? 0).toLocaleString()}</span>
        </div>
        ${settings.taxEnabled ? `
          <div style="display: flex; justify-content: space-between">
            <span>Tax (${settings.taxRate}%):</span>
            <span>UGX ${(taxAmount ?? 0).toLocaleString()}</span>
          </div>
        ` : ''}
        <div style="display: flex; justify-content: space-between; font-size: 15px; margin-top: 8px; border-top: 1px solid #000; padding-top: 5px">
          <span class="bold">TOTAL:</span>
          <span class="bold">UGX ${(lastSale.total ?? 0).toLocaleString()}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-top: 4px">
          <span>Method:</span>
          <span class="bold">${lastSale.paymentMethod}</span>
        </div>
        
        <hr />
        <div class="center footer" style="margin-top: 10px">
          ${settings.receiptFooter}<br/>
          SNA! Mobile Systems • Kampala
        </div>
      </div>
    `;

    window.print();
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full max-h-[calc(100vh-140px)]">
      {/* PRODUCT PICKER */}
      <div className="flex-1 bg-white rounded-[2rem] shadow-sm border border-slate-200/60 flex flex-col overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="Search products by name or SKU..."
              className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary bg-slate-50/30 text-sm font-semibold transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6 scrollbar-hide">
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
            {filteredProducts.map(p => (
              <button 
                key={p.id}
                onClick={() => addToCart(p)}
                className={`group p-4 rounded-3xl border text-left transition-all hover:shadow-xl hover:-translate-y-1 ${ (p.quantity ?? 0) <= 0 ? 'opacity-50 grayscale cursor-not-allowed bg-slate-50 border-slate-100' : 'bg-white border-slate-100 hover:border-brand-primary'}`}
                disabled={(p.quantity ?? 0) <= 0}
              >
                <div className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1.5">{p.type}</div>
                <div className="text-xs font-bold text-slate-800 line-clamp-2 h-9 mb-3 leading-tight group-hover:text-brand-primaryDark transition-colors">{p.name}</div>
                <div className="flex justify-between items-end">
                  <div className="text-sm font-black text-brand-primaryDark">UGX {(p.sellingPrice ?? 0).toLocaleString()}</div>
                  <div className={`text-[9px] font-black px-2 py-0.5 rounded-lg border uppercase tracking-widest ${ (p.quantity ?? 0) <= (p.reorderLevel ?? 0) ? 'bg-red-50 text-red-500 border-red-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                    {(p.quantity ?? 0)} in stock
                  </div>
                </div>
              </button>
            ))}
            {filteredProducts.length === 0 && (
              <div className="col-span-full py-20 text-center opacity-30">
                <Search size={48} className="mx-auto mb-4" />
                <p className="font-bold text-sm">No items found matching "{search}"</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CART & CHECKOUT - REFINED DARK MODE DESIGN */}
      <div className="w-full lg:w-96 bg-brand-navy rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden border border-white/5 relative group/cart">
        {/* Cart Header */}
        <div className="p-6 border-b border-white/5 flex items-center gap-4 bg-white/[0.02]">
          <div className="w-12 h-12 bg-brand-primary rounded-2xl text-black flex items-center justify-center shadow-lg shadow-brand-primary/20">
            <ShoppingBag size={22} />
          </div>
          <div>
            <h3 className="text-white font-black text-base tracking-tight leading-none">Active Cart</h3>
            <p className="text-brand-textMuted text-[10px] font-bold uppercase tracking-widest mt-2 opacity-60">Cashier: {user?.name || 'STAFF'}</p>
          </div>
          <div className="ml-auto bg-white/10 text-white text-[10px] font-black px-2.5 py-1 rounded-full border border-white/10 uppercase">
            {cart.length} Items
          </div>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-auto p-6 space-y-3 scrollbar-hide">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-20">
              <ShoppingBag size={64} className="text-white mb-4 stroke-1" />
              <p className="text-white text-xs font-black uppercase tracking-[0.2em]">Cart is Empty</p>
              <p className="text-white text-[10px] mt-2 max-w-[140px]">Select items from inventory to begin sale</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.productId} className="group/item flex flex-col gap-3 bg-white/[0.03] p-4 rounded-[1.5rem] border border-white/5 hover:bg-white/[0.05] transition-all">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-xs font-black leading-tight truncate uppercase tracking-tight">{item.name}</div>
                    <div className="text-[10px] text-brand-textMuted font-bold mt-1.5 opacity-60 uppercase tracking-widest">
                      UGX {(item.price ?? 0).toLocaleString()} / UNIT
                    </div>
                  </div>
                  <button 
                    onClick={() => removeFromCart(item.productId)}
                    className="p-1.5 text-red-400/30 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                
                <div className="flex items-center justify-between border-t border-white/5 pt-3 mt-1">
                   <div className="flex items-center bg-black/40 rounded-xl p-1 border border-white/5">
                      <button 
                        onClick={() => updateQuantity(item.productId, -1)}
                        className="p-1.5 text-white/40 hover:text-brand-primary transition-colors"
                      >
                        <Minus size={14} strokeWidth={3} />
                      </button>
                      <span className="w-8 text-center text-xs font-black text-white">{item.quantity}</span>
                      <button 
                         onClick={() => updateQuantity(item.productId, 1)}
                         className="p-1.5 text-white/40 hover:text-brand-primary transition-colors"
                      >
                        <Plus size={14} strokeWidth={3} />
                      </button>
                   </div>
                   <div className="text-sm font-black text-brand-primary">
                    UGX {((item.price ?? 0) * (item.quantity ?? 0)).toLocaleString()}
                   </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Totals & Actions */}
        <div className="p-6 bg-white/[0.04] border-t border-white/10 space-y-6">
          <div className="space-y-3">
            <div className="flex justify-between text-brand-textMuted text-[10px] font-black uppercase tracking-widest opacity-60">
              <span>Subtotal</span>
              <span className="text-white/80">UGX {(subtotal ?? 0).toLocaleString()}</span>
            </div>
            {settings.taxEnabled && (
               <div className="flex justify-between text-brand-textMuted text-[10px] font-black uppercase tracking-widest opacity-60">
                <span>Value Added Tax ({settings.taxRate}%)</span>
                <span className="text-white/80">UGX {(taxAmount ?? 0).toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between text-white pt-4 border-t border-white/5">
              <span className="text-xs font-black uppercase tracking-widest opacity-80">Total Due</span>
              <span className="text-2xl font-black text-brand-primary tracking-tighter">UGX {(grandTotal ?? 0).toLocaleString()}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {(['Cash', 'Mobile Money', 'Bank', 'Credit'] as const).map(m => (
              <button 
                key={m}
                onClick={() => setPaymentMethod(m)}
                className={`px-3 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all border ${paymentMethod === m ? 'bg-brand-primary text-black border-brand-primary shadow-lg shadow-brand-primary/20' : 'bg-white/5 text-brand-sidebarText border-white/5 hover:bg-white/10'}`}
              >
                {m}
              </button>
            ))}
          </div>

          <button 
            onClick={checkout}
            disabled={cart.length === 0}
            className={`w-full py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl transition-all group relative overflow-hidden ${cart.length > 0 ? 'bg-brand-primary text-black hover:scale-[1.02] shadow-brand-primary/30 active:scale-95' : 'bg-white/5 text-white/20 cursor-not-allowed border border-white/5'}`}
          >
            <div className="relative z-10 flex items-center justify-center gap-3">
              COMPLETE TRANSACTION
            </div>
            {cart.length > 0 && <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>}
          </button>
        </div>
      </div>

      {/* RECEIPT MODAL - ENHANCED VISIBILITY MATCHING SCREENSHOT */}
      {showReceipt && lastSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-navy/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] overflow-hidden animate-in fade-in zoom-in-95 duration-300">
            {/* Modal Header Section */}
            <div className="p-10 text-center relative">
              <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-emerald-100/50 shadow-inner">
                <CheckCircle2 size={40} strokeWidth={3} />
              </div>
              <h3 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Sale Complete!</h3>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Invoice {lastSale.invoiceNumber}</p>
            </div>

            {/* Receipt Summary Divider */}
            <div className="relative py-4">
               <div className="absolute inset-x-0 top-1/2 h-px bg-slate-100"></div>
               <div className="relative flex justify-center">
                  <span className="bg-white px-6 text-[10px] font-black text-slate-300 uppercase tracking-[0.25em]">Receipt Summary</span>
               </div>
            </div>

            {/* Scrollable Items List */}
            <div className="p-10 pt-4 space-y-6">
              <div className="space-y-4 max-h-56 overflow-auto pr-2 custom-scrollbar">
                {lastSale.items.map(item => (
                  <div key={item.productId} className="flex justify-between items-center text-sm">
                    <div className="flex-1 min-w-0 pr-4">
                      <div className="font-bold text-slate-800 uppercase tracking-tight truncate leading-none">{(item.quantity ?? 0)}x {item.name}</div>
                    </div>
                    <span className="font-black text-slate-900 text-right min-w-[100px]">
                      {((item.price ?? 0) * (item.quantity ?? 0)).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>

              {/* Grand Total Big Display */}
              <div className="pt-8 border-t border-slate-100 flex items-center justify-between">
                <span className="text-slate-400 font-black uppercase tracking-[0.2em] text-[10px]">Total Settlement</span>
                <span className="text-4xl font-black text-emerald-500 tracking-tighter">
                  UGX {(lastSale.total ?? 0).toLocaleString()}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-6 no-print">
                <button 
                  onClick={() => setShowReceipt(false)}
                  className="flex-1 py-5 bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.3em] transition-all active:scale-95"
                >
                  Done
                </button>
                <button 
                  onClick={printReceipt}
                  className="flex-[2] py-5 bg-brand-primary hover:bg-brand-primaryDark text-black rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-3 transition-all shadow-xl shadow-brand-primary/30 active:scale-95 hover:-translate-y-1"
                >
                  <Printer size={18} strokeWidth={2.5} /> Thermal Print
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default POS;
