
import React, { useState, useEffect } from 'react';
import { db } from '../db';
import { RepairJob, RepairStatus, ShopSettings } from '../types';
import { Plus, Search, Smartphone, User, ChevronRight, Printer, X } from 'lucide-react';

const statusColors: Record<RepairStatus, string> = {
  'Received': 'bg-slate-100 text-slate-600',
  'Diagnosing': 'bg-blue-50 text-blue-600',
  'In Repair': 'bg-amber-50 text-amber-600',
  'Completed': 'bg-emerald-50 text-emerald-600',
  'Delivered': 'bg-brand-navy text-white',
  'Cancelled': 'bg-red-50 text-red-600',
};

const Repairs = () => {
  const [repairs, setRepairs] = useState<RepairJob[]>([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<Partial<RepairJob>>({ status: 'Received' });
  
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
      const [repairData, settingsData] = await Promise.all([
        db.repairs.getAll(),
        db.settings.get()
      ]);
      setRepairs(repairData);
      setSettings(settingsData);
    };
    loadData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const newJob = {
      ...formData as RepairJob,
      id: formData.id || Math.random().toString(36).substr(2, 9),
      createdAt: formData.createdAt || new Date().toISOString(),
      paidAmount: formData.paidAmount || 0
    };

    let updatedRepairs = [...repairs];
    if (formData.id) {
      updatedRepairs = updatedRepairs.map(r => r.id === formData.id ? newJob : r);
      await db.audit.add({ userId: 'u-admin', username: 'Admin', action: `Updated repair job ${newJob.deviceModel}` });
    } else {
      updatedRepairs.unshift(newJob);
      await db.audit.add({ userId: 'u-admin', username: 'Admin', action: `Created new repair job ${newJob.deviceModel}` });
    }

    setRepairs(updatedRepairs);
    await db.repairs.save(updatedRepairs);
    setShowModal(false);
    setFormData({ status: 'Received' });
  };

  const printJobCard = (job: RepairJob) => {
    const printArea = document.getElementById('print-area');
    if (!printArea) return;

    printArea.innerHTML = `
      <div class="thermal-receipt">
        <div class="center bold header">${settings.businessName}</div>
        <div class="center uppercase bold">REPAIR JOB CARD</div>
        <div class="center text-[10px]">${settings.tagline}</div>
        <hr />
        <div>Job ID: ${job.id.toUpperCase()}</div>
        <div>Date: ${new Date(job.createdAt).toLocaleString()}</div>
        <hr />
        <div class="bold">CUSTOMER INFO</div>
        <div>Name: ${job.customerName}</div>
        <div>Phone: ${job.customerPhone}</div>
        <hr />
        <div class="bold">DEVICE INFO</div>
        <div>Model: ${job.deviceModel}</div>
        <div>Issue: ${job.issue}</div>
        <div>Accs: ${job.accessories || 'None'}</div>
        <hr />
        <div class="bold">STATUS: ${job.status.toUpperCase()}</div>
        <div class="bold" style="font-size: 14px">Est. Cost: UGX ${(job.estimatedCost ?? 0).toLocaleString()}</div>
        <hr />
        <div class="center footer">${settings.receiptFooter}</div>
        <div class="center text-[8px] mt-2">SNA! Mobile Systems • Repair Portal</div>
      </div>
    `;
    window.print();
  };

  const filtered = repairs.filter(r => 
    r.customerName.toLowerCase().includes(search.toLowerCase()) || 
    r.deviceModel.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">Repair Job Cards</h2>
          <p className="text-xs text-slate-500 font-medium tracking-tight">Track, diagnose and bill device repairs</p>
        </div>
        <button 
          onClick={() => { setFormData({ status: 'Received' }); setShowModal(true); }}
          className="flex items-center gap-2 bg-brand-primary text-black px-6 py-3 rounded-2xl text-xs font-black shadow-lg shadow-brand-primary/20 hover:scale-[1.02] transition-all"
        >
          <Plus size={16} /> New Job Card
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        <input 
          type="text" 
          placeholder="Search by customer name, device or job ID..."
          className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white border border-slate-200 shadow-sm focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(job => (
          <div key={job.id} className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-xl transition-all group border-b-4 border-b-slate-100 hover:border-b-brand-primary">
            <div className="p-5 border-b border-slate-50 flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-slate-50 rounded-xl text-slate-600">
                  <Smartphone size={20} />
                </div>
                <div>
                  <div className="text-sm font-black text-slate-800 leading-tight">{job.deviceModel}</div>
                  <div className="text-[10px] text-slate-400 uppercase font-black tracking-widest mt-0.5">#{job.id.slice(0, 6)}</div>
                </div>
              </div>
              <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${statusColors[job.status]}`}>
                {job.status}
              </span>
            </div>

            <div className="p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                  <User size={16} />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-slate-800 truncate">{job.customerName}</div>
                  <div className="text-[10px] text-slate-400 font-medium">{job.customerPhone}</div>
                </div>
              </div>

              <div className="bg-slate-50 rounded-2xl p-4 space-y-2 border border-slate-100">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Job Issue</div>
                <p className="text-xs text-slate-600 font-medium line-clamp-2 leading-relaxed">{job.issue}</p>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div>
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Est. Quote</div>
                  <div className="text-sm font-black text-emerald-600">UGX {(job.estimatedCost ?? 0).toLocaleString()}</div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => printJobCard(job)}
                    className="p-2.5 bg-slate-50 text-slate-400 hover:bg-brand-primary hover:text-black rounded-xl transition-all"
                    title="Print Job Card"
                  >
                    <Printer size={18} />
                  </button>
                  <button 
                    onClick={() => { setFormData(job); setShowModal(true); }}
                    className="p-2.5 bg-slate-50 text-slate-400 hover:bg-brand-primary hover:text-black rounded-xl transition-all"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full py-20 text-center text-slate-400 italic">No repair jobs found</div>
        )}
      </div>

      {/* REPAIR MODAL - ENHANCED LIGHT MODE */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-navy/60 backdrop-blur-md transition-opacity">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-[0_35px_60px_-15px_rgba(0,0,0,0.3)] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-8 bg-white border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-black text-slate-900 leading-tight">{formData.id ? 'Modify Repair Job' : 'Create Repair Entry'}</h3>
                <p className="text-sm text-slate-500 font-medium uppercase tracking-widest mt-1">Device Diagnostics & Intake</p>
              </div>
              <button 
                onClick={() => setShowModal(false)} 
                className="p-2.5 bg-slate-50 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-8 pt-6">
              <div className="grid grid-cols-2 gap-x-6 gap-y-5">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Customer Name</label>
                  <input 
                    required 
                    type="text" 
                    placeholder="Enter full name..."
                    className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl text-slate-900 font-bold focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary outline-none transition-all"
                    value={formData.customerName || ''}
                    onChange={e => setFormData({...formData, customerName: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Contact Number</label>
                  <input 
                    required 
                    type="text" 
                    placeholder="+256..."
                    className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl text-slate-900 font-bold focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary outline-none transition-all"
                    value={formData.customerPhone || ''}
                    onChange={e => setFormData({...formData, customerPhone: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Device Model</label>
                  <input 
                    required 
                    type="text" 
                    placeholder="e.g. iPhone 13 Pro"
                    className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl text-slate-900 font-bold focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary outline-none transition-all"
                    value={formData.deviceModel || ''}
                    onChange={e => setFormData({...formData, deviceModel: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Job Status</label>
                  <select 
                    className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl text-slate-900 font-bold focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary outline-none cursor-pointer"
                    value={formData.status}
                    onChange={e => setFormData({...formData, status: e.target.value as RepairStatus})}
                  >
                    {['Received', 'Diagnosing', 'In Repair', 'Completed', 'Delivered', 'Cancelled'].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Diagnosis / Issue Description</label>
                  <textarea 
                    rows={3}
                    placeholder="Describe what needs to be fixed..."
                    className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl text-slate-900 font-medium focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary outline-none transition-all"
                    value={formData.issue || ''}
                    onChange={e => setFormData({...formData, issue: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Accessories Left</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Battery, SIM card, Case"
                    className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl text-slate-900 font-semibold focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary outline-none transition-all"
                    value={formData.accessories || ''}
                    onChange={e => setFormData({...formData, accessories: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Estimated Cost (UGX)</label>
                  <input 
                    type="number" 
                    className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl text-slate-900 font-black text-emerald-600 focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary outline-none transition-all"
                    value={formData.estimatedCost || ''}
                    onChange={e => setFormData({...formData, estimatedCost: parseInt(e.target.value)})}
                  />
                </div>
              </div>
              <div className="flex gap-4 pt-8">
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
                  {formData.id ? 'Update Job' : 'Register Repair'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Repairs;
