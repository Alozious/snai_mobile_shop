import React, { useState, useEffect } from 'react';
import { db } from '../db';
import { User, Role } from '../types';
import { Plus, Search, Edit3, Trash2, X, UserCheck, UserX, Mail, Phone } from 'lucide-react';

const roleColors: Record<Role, string> = {
  'Admin': 'bg-red-50 text-red-600',
  'Manager': 'bg-blue-50 text-blue-600',
  'Cashier': 'bg-emerald-50 text-emerald-600',
  'Technician': 'bg-purple-50 text-purple-600',
};

const Users = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<Partial<User & { email?: string, phone?: string }>>({ status: 'Active', role: 'Cashier' });
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const loadData = async () => {
      const data = await db.users.getAll();
      setUsers(data);
      setCurrentUser(db.auth.getCurrentUser());
    };
    loadData();
  }, []);

  const filtered = users.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) || 
    u.username.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const newUser: User = {
      id: formData.id || `u-${Math.random().toString(36).substring(2, 9)}`,
      name: formData.name || 'Unknown User',
      username: formData.username || 'unknown',
      role: formData.role as Role || 'Cashier',
      status: formData.status as 'Active' | 'Inactive' || 'Active'
    };

    let updated = [...users];
    if (formData.id) {
      updated = updated.map(u => u.id === formData.id ? newUser : u);
      await db.audit.add({ userId: currentUser?.id || 'sys', username: currentUser?.username || 'sys', action: `Updated user profile for ${newUser.username}` });
    } else {
      updated.unshift(newUser);
      await db.audit.add({ userId: currentUser?.id || 'sys', username: currentUser?.username || 'sys', action: `Created new user account: ${newUser.username}` });
    }

    setUsers(updated);
    await db.users.save(updated);
    setShowModal(false);
    setFormData({ status: 'Active', role: 'Cashier' });
  };

  const toggleStatus = async (id: string) => {
    const updated = users.map(u => u.id === id ? { ...u, status: u.status === 'Active' ? 'Inactive' : 'Active' } as User : u);
    setUsers(updated);
    await db.users.save(updated);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">Staff Management</h2>
          <p className="text-xs text-slate-500 font-medium tracking-tight">Control access levels and member profiles</p>
        </div>
        <button 
          onClick={() => { setFormData({ status: 'Active', role: 'Cashier' }); setShowModal(true); }}
          className="flex items-center gap-2 bg-brand-primary text-black px-6 py-2.5 rounded-xl text-xs font-black shadow-lg shadow-brand-primary/20 hover:scale-[1.02] transition-transform"
        >
          <Plus size={16} /> Create Account
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/30">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by name, role or username..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-primary/20 outline-none"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">Employee</th>
                <th className="px-6 py-4">Role & Access</th>
                <th className="px-6 py-4">Account Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(u => (
                <tr key={u.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200 font-black uppercase text-xs">
                        {u.name.charAt(0)}
                      </div>
                      <div>
                        <div className="text-sm font-black text-slate-800 leading-tight">{u.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono tracking-tight mt-0.5">@{u.username}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${roleColors[u.role]}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => toggleStatus(u.id)}
                      className={`flex items-center gap-2 text-xs font-black transition-colors ${u.status === 'Active' ? 'text-emerald-500' : 'text-slate-300'}`}
                    >
                      {u.status === 'Active' ? <UserCheck size={16} /> : <UserX size={16} />}
                      {u.status}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => { setFormData(u); setShowModal(true); }}
                        className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit Profile"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button className="p-2 text-slate-300 hover:text-red-500 rounded-lg transition-colors" title="Deactivate">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400 text-xs italic">No matching team members found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-navy/60 backdrop-blur-md transition-opacity">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-[0_35px_60px_-15px_rgba(0,0,0,0.3)] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-8 bg-white border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-slate-900 leading-tight">{formData.id ? 'Edit User Profile' : 'New Staff Account'}</h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Security & Identification</p>
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
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Full Legal Name</label>
                <input 
                  required 
                  type="text" 
                  className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl text-slate-900 font-bold focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary outline-none transition-all"
                  value={formData.name || ''}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g. John Doe"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Username</label>
                  <input 
                    required 
                    type="text" 
                    className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl text-slate-900 font-mono focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary outline-none transition-all"
                    value={formData.username || ''}
                    onChange={e => setFormData({...formData, username: e.target.value})}
                    placeholder="jdoe"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Password</label>
                  <input 
                    type="password" 
                    className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl text-slate-900 focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary outline-none transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Role</label>
                  <select 
                    className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl text-slate-900 font-bold focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary outline-none"
                    value={formData.role}
                    onChange={e => setFormData({...formData, role: e.target.value as Role})}
                  >
                    <option value="Admin">Administrator</option>
                    <option value="Manager">Manager</option>
                    <option value="Cashier">Cashier</option>
                    <option value="Technician">Technician</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Status</label>
                  <select 
                    className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl text-slate-900 font-bold focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary outline-none"
                    value={formData.status}
                    onChange={e => setFormData({...formData, status: e.target.value as 'Active' | 'Inactive'})}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Suspended</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-4 pt-6">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-4 border border-slate-200 rounded-2xl text-xs font-black text-slate-500 uppercase tracking-widest hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-4 bg-brand-primary text-black rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-brand-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                >
                  {formData.id ? 'Save Changes' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;