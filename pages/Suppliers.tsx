import React, { useState, useEffect } from 'react';
import { db } from '../db';
import { Supplier, User } from '../types';
import { Phone, MapPin, Plus, User as UserIcon, Search, Trash2, X } from 'lucide-react';

const Suppliers = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<Partial<Supplier>>({});
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const loadData = async () => {
      const data = await db.suppliers.getAll();
      setSuppliers(data);
      setUser(db.auth.getCurrentUser());
    };
    loadData();
  }, []);

  const filtered = suppliers.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const currentUser = user || { username: 'System', id: 'system' };
    const newSupplier: Supplier = {
      id: formData.id || `s-${Math.random().toString(36).substring(2, 9)}`,
      name: formData.name || 'Unknown Vendor',
      contact: formData.contact || 'No contact',
      location: formData.location || 'No location'
    };

    let updated = [...suppliers];
    if (formData.id) {
      updated = updated.map(s => s.id === formData.id ? newSupplier : s);
      await db.audit.add({ userId: currentUser.id, username: currentUser.username, action: `Updated supplier ${newSupplier.name}` });
    } else {
      updated.unshift(newSupplier);
      await db.audit.add({ userId: currentUser.id, username: currentUser.username, action: `Added new supplier ${newSupplier.name}` });
    }

    setSuppliers(updated);
    await db.suppliers.save(updated);
    setShowModal(false);
    setFormData({});
  };

  const deleteSupplier = async (id: string) => {
    if (confirm('Are you sure you want to remove this supplier?')) {
      const currentUser = user || { username: 'System', id: 'system' };
      const s = suppliers.find(sup => sup.id === id);
      const updated = suppliers.filter(sup => sup.id !== id);
      setSuppliers(updated);
      await db.suppliers.save(updated);
      await db.audit.add({ userId: currentUser.id, username: currentUser.username, action: `Deleted supplier ${s?.name}` });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">Suppliers & Partners</h2>
          <p className="text-xs text-slate-500 font-medium">Manage your business source contacts</p>
        </div>
        <button 
          onClick={() => { setFormData({}); setShowModal(true); }}
          className="flex items-center gap-2 bg-brand-primary text-black px-6 py-2.5 rounded-xl text-xs font-black shadow-lg shadow-brand-primary/20 transition-transform active:scale-95"
        >
          <Plus size={16} /> Add Supplier
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input 
          type="text" 
          placeholder="Search suppliers by name..."
          className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(s => (
          <div key={s.id} className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 flex flex-col gap-4 relative group hover:border-brand-primary transition-all">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-700">
                <UserIcon size={28} />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-800">{s.name}</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Vendor ID: {s.id}</p>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3 text-slate-600">
                <Phone size={16} className="text-brand-primary" />
                <span className="text-sm font-medium">{s.contact}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-600">
                <MapPin size={16} className="text-brand-primary" />
                <span className="text-sm font-medium">{s.location}</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between">
              <button 
                onClick={() => { setFormData(s); setShowModal(true); }}
                className="text-[10px] font-black uppercase text-brand-primary hover:text-brand-primaryDark transition-colors"
              >
                Edit Details
              </button>
              <button 
                onClick={() => deleteSupplier(s.id)}
                className="text-slate-300 hover:text-red-500 transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full py-20 text-center text-slate-400 italic">No suppliers found</div>
        )}
      </div>

      {/* SUPPLIER MODAL - ENHANCED LIGHT MODE */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-navy/60 backdrop-blur-md transition-opacity duration-300">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-[0_35px_60px_-15px_rgba(0,0,0,0.3)] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-8 bg-white border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-slate-900 leading-tight">{formData.id ? 'Edit Supplier' : 'New Supplier'}</h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Vendor Partnerships</p>
              </div>
              <button 
                onClick={() => setShowModal(false)} 
                className="p-2.5 bg-slate-50 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-8 pt-6 space-y-5">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Supplier Name</label>
                <input 
                  required 
                  type="text" 
                  placeholder="Enter business name..."
                  className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl text-slate-900 font-bold focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary outline-none transition-all"
                  value={formData.name || ''}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Contact Number</label>
                <input 
                  required 
                  type="text" 
                  placeholder="+256..."
                  className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl text-slate-900 font-bold focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary outline-none transition-all"
                  value={formData.contact || ''}
                  onChange={e => setFormData({...formData, contact: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Location / Address</label>
                <input 
                  required 
                  type="text" 
                  placeholder="e.g. Kampala, Uganda"
                  className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl text-slate-900 font-medium focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary outline-none transition-all"
                  value={formData.location || ''}
                  onChange={e => setFormData({...formData, location: e.target.value})}
                />
              </div>
              <div className="flex gap-4 pt-6">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-4 border border-slate-200 rounded-2xl text-xs font-black text-slate-500 uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-4 bg-brand-primary text-black rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-brand-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                >
                  {formData.id ? 'Save Changes' : 'Add Supplier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Suppliers;