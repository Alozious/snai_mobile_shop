import React, { useState, useEffect } from 'react';
import { db } from '../db';
import { Product, ProductType, User } from '../types';
import { Filter, Download, Plus, Search, Edit3, Trash2, Tag, X } from 'lucide-react';

const Inventory = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const loadData = async () => {
      const data = await db.products.getAll();
      setProducts(data);
      setUser(db.auth.getCurrentUser());
    };
    loadData();
  }, []);

  const filtered = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.sku.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    
    let newProducts = [...products];
    const currentUser = user || { username: 'System', id: 'system' };
    
    if (editingProduct.id) {
      newProducts = newProducts.map(p => p.id === editingProduct.id ? { ...p, ...editingProduct, updatedAt: new Date().toISOString() } as Product : p);
      await db.audit.add({ userId: currentUser.id, username: currentUser.username, action: `Updated product ${editingProduct.name}` });
    } else {
      const newP = { 
        ...editingProduct, 
        id: Math.random().toString(36).substring(2, 11), 
        updatedAt: new Date().toISOString() 
      } as Product;
      newProducts.push(newP);
      await db.audit.add({ userId: currentUser.id, username: currentUser.username, action: `Added new product ${editingProduct.name}` });
    }
    
    setProducts(newProducts);
    await db.products.save(newProducts);
    setShowModal(false);
    setEditingProduct(null);
  };

  const deleteProduct = async (id: string) => {
    if (confirm('Delete this product?')) {
      const p = products.find(prod => prod.id === id);
      const filteredList = products.filter(p => p.id !== id);
      const currentUser = user || { username: 'System', id: 'system' };
      setProducts(filteredList);
      await db.products.save(filteredList);
      await db.audit.add({ userId: currentUser.id, username: currentUser.username, action: `Deleted product ${p?.name}` });
    }
  };

  const exportCSV = () => {
    const headers = ['SKU', 'Name', 'Type', 'Cost Price', 'Selling Price', 'Quantity'];
    const rows = products.map(p => [p.sku, p.name, p.type, p.costPrice ?? 0, p.sellingPrice ?? 0, p.quantity ?? 0]);
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `sna_inventory_${new Date().toISOString().slice(0,10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight uppercase">Product Inventory</h2>
          <p className="text-xs text-slate-500 font-medium tracking-tight">Manage your shop's items and stock levels</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button 
            onClick={exportCSV}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <Download size={14} /> Export CSV
          </button>
          <button 
            onClick={() => { setEditingProduct({ type: 'Accessory', quantity: 0, reorderLevel: 5, costPrice: 0, sellingPrice: 0 }); setShowModal(true); }}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-brand-primary text-black rounded-xl text-xs font-black hover:bg-brand-primaryDark transition-all shadow-lg shadow-brand-primary/20"
          >
            <Plus size={14} strokeWidth={3} /> Add Product
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-wrap gap-3 bg-slate-50/30">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search by name or SKU..."
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-brand-primary/10 transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors">
            <Filter size={14} /> Filters
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/80 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">Product Info</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Stock Status</th>
                <th className="px-6 py-4">Pricing (UGX)</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(p => (
                <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200 font-black uppercase text-xs">
                        {p.name.charAt(0)}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-800 uppercase tracking-tight">{p.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono tracking-tight">{p.sku}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-wider">
                      {p.type}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${(p.quantity ?? 0) <= (p.reorderLevel ?? 0) ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`}></div>
                      <div className="text-sm font-black text-slate-700">{(p.quantity ?? 0)} units</div>
                    </div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Min: {(p.reorderLevel ?? 0)}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-black text-brand-primaryDark">{(p.sellingPrice ?? 0).toLocaleString()}</div>
                    <div className="text-[10px] text-slate-400 font-bold">Cost: {(p.costPrice ?? 0).toLocaleString()}</div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => { setEditingProduct(p); setShowModal(true); }}
                        className="p-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-all"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button 
                        onClick={() => deleteProduct(p.id)}
                        className="p-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* PRODUCT MODAL - REFINED AS PER SCREENSHOT */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-navy/60 backdrop-blur-md transition-all duration-300">
          <div className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-[0_35px_60px_-15px_rgba(0,0,0,0.3)] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-8 pb-4 relative">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-3xl font-black text-slate-900 tracking-tight">
                    {editingProduct?.id ? 'Edit Product' : 'Add New Product'}
                  </h3>
                  <p className="text-sm text-slate-500 font-medium mt-1">Fill in the product details below</p>
                </div>
                <button 
                  onClick={() => setShowModal(false)}
                  className="p-3 bg-slate-50 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
                >
                  <X size={24} />
                </button>
              </div>
            </div>
            
            <form onSubmit={handleSave} className="p-8 pt-4 space-y-6">
              <div className="grid grid-cols-2 gap-x-6 gap-y-5">
                {/* Product Name - Full Width */}
                <div className="col-span-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2.5 ml-1">Product Name</label>
                  <input 
                    required 
                    type="text" 
                    placeholder="Enter product title..."
                    className="w-full px-6 py-4.5 bg-white border border-slate-200 rounded-[1.25rem] text-slate-900 font-bold placeholder:text-slate-300 focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary outline-none transition-all"
                    value={editingProduct?.name || ''}
                    onChange={e => setEditingProduct({...editingProduct!, name: e.target.value})}
                  />
                </div>
                
                {/* SKU & Category */}
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2.5 ml-1">SKU / Barcode</label>
                  <input 
                    required 
                    type="text" 
                    placeholder="e.g. SN-IP13"
                    className="w-full px-6 py-4.5 bg-white border border-slate-200 rounded-[1.25rem] text-slate-900 font-mono text-sm focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary outline-none transition-all"
                    value={editingProduct?.sku || ''}
                    onChange={e => setEditingProduct({...editingProduct!, sku: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2.5 ml-1">Category Type</label>
                  <div className="relative">
                    <select 
                      className="w-full px-6 py-4.5 bg-white border border-slate-200 rounded-[1.25rem] text-slate-900 font-bold focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary outline-none appearance-none cursor-pointer"
                      value={editingProduct?.type || 'Phone'}
                      onChange={e => setEditingProduct({...editingProduct!, type: e.target.value as ProductType})}
                    >
                      <option value="Phone">Phone</option>
                      <option value="Accessory">Accessory</option>
                      <option value="Spare Part">Spare Part</option>
                    </select>
                  </div>
                </div>
                
                {/* Pricing */}
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2.5 ml-1">Cost Price (UGX)</label>
                  <input 
                    required 
                    type="number" 
                    placeholder="0"
                    className="w-full px-6 py-4.5 bg-white border border-slate-200 rounded-[1.25rem] text-slate-900 font-black focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary outline-none transition-all"
                    value={editingProduct?.costPrice ?? ''}
                    onChange={e => setEditingProduct({...editingProduct!, costPrice: parseInt(e.target.value) || 0})}
                  />
                </div>
                
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2.5 ml-1">Selling Price (UGX)</label>
                  <input 
                    required 
                    type="number" 
                    placeholder="0"
                    className="w-full px-6 py-4.5 bg-white border border-slate-200 rounded-[1.25rem] text-slate-900 font-black text-emerald-600 focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary outline-none transition-all"
                    value={editingProduct?.sellingPrice ?? ''}
                    onChange={e => setEditingProduct({...editingProduct!, sellingPrice: parseInt(e.target.value) || 0})}
                  />
                </div>
                
                {/* Stock Details */}
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2.5 ml-1">Stock Quantity</label>
                  <input 
                    required 
                    type="number" 
                    placeholder="0"
                    className="w-full px-6 py-4.5 bg-white border border-slate-200 rounded-[1.25rem] text-slate-900 font-black focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary outline-none transition-all"
                    value={editingProduct?.quantity ?? ''}
                    onChange={e => setEditingProduct({...editingProduct!, quantity: parseInt(e.target.value) || 0})}
                  />
                </div>
                
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2.5 ml-1">Reorder Level</label>
                  <input 
                    required 
                    type="number" 
                    placeholder="5"
                    className="w-full px-6 py-4.5 bg-white border border-slate-200 rounded-[1.25rem] text-slate-900 font-black text-amber-600 focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary outline-none transition-all"
                    value={editingProduct?.reorderLevel ?? ''}
                    onChange={e => setEditingProduct({...editingProduct!, reorderLevel: parseInt(e.target.value) || 0})}
                  />
                </div>
              </div>
              
              {/* Form Actions */}
              <div className="flex gap-4 pt-8">
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-8 py-5 border border-slate-200 rounded-[1.5rem] text-xs font-black text-slate-500 uppercase tracking-[0.3em] hover:bg-slate-50 transition-all active:scale-95"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-8 py-5 bg-brand-primary text-black rounded-[1.5rem] text-xs font-black uppercase tracking-[0.3em] hover:bg-brand-primaryDark shadow-xl shadow-brand-primary/20 hover:shadow-brand-primary/40 transition-all active:scale-95"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;