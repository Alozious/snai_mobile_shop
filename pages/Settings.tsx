import React, { useState, useEffect } from 'react';
import { db } from '../db';
import { ShopSettings } from '../types';
import { 
  Save, 
  Globe, 
  MapPin, 
  Phone, 
  Hash, 
  CheckCircle2, 
  Database, 
  Shield, 
  Activity, 
  Trash2, 
  RefreshCw,
  AlertTriangle,
  ChevronRight
} from 'lucide-react';

const Settings = () => {
  const [settings, setSettings] = useState<ShopSettings | null>(null);
  const [success, setSuccess] = useState(false);
  const [queueLength, setQueueLength] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<'SYNCED' | 'FAILED' | 'OFFLINE' | null>(null);

  useEffect(() => {
    const loadSettings = async () => {
      const data = await db.settings.get();
      setSettings(data);
      setQueueLength(db.sync.getQueue().length);
    };
    loadSettings();
    
    // Polling queue length for live updates
    const timer = setInterval(() => {
      setQueueLength(db.sync.getQueue().length);
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    
    setSyncing(true);
    await db.settings.save(settings);
    await db.audit.add({ userId: 'u-admin', username: 'admin', action: 'Updated system preferences' });
    
    // If sync is enabled, attempt an immediate sync
    if (settings.syncEnabled) {
      const result = await db.sync.performSync();
      setSyncResult(result as any);
    } else {
      setSyncResult('OFFLINE');
    }
    
    setSuccess(true);
    setSyncing(false);
    setTimeout(() => setSuccess(false), 3000);
  };

  const handleSyncNow = async () => {
    if (syncing) return;
    setSyncing(true);
    const result = await db.sync.performSync();
    setSyncResult(result as any);
    setQueueLength(db.sync.getQueue().length);
    setSyncing(false);
  };

  const handleReset = async () => {
    if (confirm("🚨 DANGER ZONE: This will wipe all local data including sales, products, and repairs. Continue?")) {
      await db.utils.resetDatabase();
    }
  };

  if (!settings) return <div className="p-20 text-center font-bold text-slate-400">Loading Configuration...</div>;

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-2">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">System Preferences</h2>
          <p className="text-sm text-slate-500 font-medium tracking-tight">Manage shop identity and PostgreSQL cloud integration</p>
        </div>
        {success && (
          <div className="flex items-center gap-2 text-emerald-500 font-black text-xs uppercase tracking-widest animate-in fade-in slide-in-from-right-4">
            <CheckCircle2 size={18} /> Configuration Applied
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SHOP IDENTITY - LEFT LARGE COLUMN */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-[2.5rem] border border-slate-200/60 shadow-sm p-6 sm:p-10 space-y-8">
            <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
              <div className="w-12 h-12 rounded-[1rem] bg-brand-primary/10 text-brand-primaryDark flex items-center justify-center">
                <Globe size={24} />
              </div>
              <div>
                <h3 className="font-black text-slate-900 uppercase tracking-widest text-xs">Business Profile</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-wider">Public identity & receipt info</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
              <div className="sm:col-span-1">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5 ml-1">Business Name</label>
                <input 
                  type="text" 
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black text-slate-800 focus:bg-white focus:ring-4 focus:ring-brand-primary/5 transition-all outline-none"
                  value={settings.businessName}
                  onChange={e => setSettings({...settings, businessName: e.target.value})}
                />
              </div>
              <div className="sm:col-span-1">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5 ml-1">Slogan</label>
                <input 
                  type="text" 
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-600 focus:bg-white focus:ring-4 focus:ring-brand-primary/5 transition-all outline-none"
                  value={settings.tagline}
                  onChange={e => setSettings({...settings, tagline: e.target.value})}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5 ml-1">Headquarters Address</label>
                <div className="relative">
                  <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input 
                    type="text" 
                    className="w-full pl-12 pr-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 focus:bg-white outline-none"
                    value={settings.address}
                    onChange={e => setSettings({...settings, address: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5 ml-1">Official Phone</label>
                <div className="relative">
                  <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input 
                    type="text" 
                    className="w-full pl-12 pr-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:bg-white outline-none"
                    value={settings.phone}
                    onChange={e => setSettings({...settings, phone: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5 ml-1">TIN Number</label>
                <div className="relative">
                  <Hash className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input 
                    type="text" 
                    className="w-full pl-12 pr-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-mono font-bold focus:bg-white outline-none"
                    value={settings.tin}
                    onChange={e => setSettings({...settings, tin: e.target.value})}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-6 rounded-[2rem] border border-slate-200/60 shadow-sm">
             <button 
               type="button"
               onClick={handleReset}
               className="group flex items-center gap-3 text-red-400 hover:text-red-600 transition-colors text-[10px] font-black uppercase tracking-widest"
             >
                <div className="w-10 h-10 rounded-xl bg-red-500/5 flex items-center justify-center group-hover:bg-red-500/10 transition-all">
                  <Trash2 size={18} />
                </div>
                Reset Database
             </button>
             <button 
              type="submit"
              disabled={syncing}
              className="w-full sm:w-auto flex items-center justify-center gap-3 bg-brand-primary text-black px-10 py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-brand-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
            >
              {syncing ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
              SAVE CONFIGURATION
            </button>
          </div>
        </div>

        {/* CLOUD SYNC - RIGHT SIDEBAR COLUMN */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-brand-navy rounded-[2.5rem] border border-white/5 shadow-2xl p-8 space-y-8 text-white relative overflow-hidden h-full">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-500/10 rounded-full blur-[60px] pointer-events-none"></div>

            <div className="flex items-center gap-4 border-b border-white/5 pb-6">
              <div className="w-12 h-12 rounded-[1rem] bg-blue-500/20 text-blue-400 flex items-center justify-center">
                <Database size={24} />
              </div>
              <div>
                <h3 className="font-black text-white uppercase tracking-widest text-xs">Cloud Synchronization</h3>
                <p className="text-[9px] text-blue-400 font-bold uppercase mt-1 tracking-widest">PostgreSQL Bridge</p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Sync Status Overlay */}
              <div className="flex items-center justify-between p-5 bg-white/5 rounded-2xl border border-white/5">
                <div>
                  <div className="text-[9px] text-brand-textMuted font-black uppercase tracking-widest">Local Queue</div>
                  <div className="text-lg font-black text-white">{queueLength} <span className="text-[10px] opacity-40">RECORDS</span></div>
                </div>
                <button 
                  type="button"
                  onClick={handleSyncNow}
                  disabled={syncing || queueLength === 0}
                  className="w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-xl flex items-center justify-center transition-all disabled:opacity-20"
                >
                  <RefreshCw size={18} className={syncing ? 'animate-spin' : ''} />
                </button>
              </div>

              {/* Powered Toggle */}
              <div className="flex items-center justify-between gap-4 p-5 bg-white/5 rounded-2xl border border-white/5">
                <div className="flex-1">
                  <div className="text-xs font-black text-white tracking-tight uppercase">Master Switch</div>
                  <div className="text-[9px] text-brand-textMuted uppercase font-bold tracking-widest mt-1 opacity-60">Enable cloud sync</div>
                </div>
                <div className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={settings.syncEnabled}
                    onChange={e => setSettings({...settings, syncEnabled: e.target.checked})}
                    id="sync-toggle-page"
                  />
                  <div className="w-12 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-brand-navy after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-blue-500 shadow-inner"></div>
                </div>
              </div>

              {/* Endpoint Inputs */}
              <div className={`space-y-4 transition-all duration-300 ${settings.syncEnabled ? 'opacity-100' : 'opacity-20 pointer-events-none'}`}>
                <div>
                  <label className="block text-[9px] font-black text-brand-textMuted uppercase tracking-widest mb-2 ml-1">API Endpoint URL</label>
                  <div className="relative">
                    <Activity className="absolute left-4 top-1/2 -translate-y-1/2 text-white/10" size={16} />
                    <input 
                      type="text" 
                      placeholder="https://..."
                      className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-mono text-blue-300 focus:bg-white/10 outline-none transition-all"
                      value={settings.postgresUrl}
                      onChange={e => setSettings({...settings, postgresUrl: e.target.value})}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[9px] font-black text-brand-textMuted uppercase tracking-widest mb-2 ml-1">Access Token</label>
                  <div className="relative">
                    <Shield className="absolute left-4 top-1/2 -translate-y-1/2 text-white/10" size={16} />
                    <input 
                      type="password" 
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-mono text-white focus:bg-white/10 outline-none transition-all"
                      value={settings.postgresKey}
                      onChange={e => setSettings({...settings, postgresKey: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              {syncResult && (
                <div className={`p-4 rounded-xl text-[10px] font-black uppercase tracking-widest text-center animate-in fade-in duration-500 ${syncResult === 'SYNCED' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                  {syncResult === 'SYNCED' ? 'Cloud Handshake Successful' : syncResult === 'FAILED' ? 'Cloud Sync Rejected' : 'Sync is Disabled'}
                </div>
              )}
            </div>
            
            <div className="pt-4 mt-auto">
               <div className="flex items-center gap-2 p-4 bg-blue-500/5 rounded-2xl border border-blue-500/10 text-[9px] text-blue-400/60 font-medium leading-relaxed uppercase tracking-tighter">
                  <AlertTriangle size={14} className="flex-shrink-0" />
                  Offline-first strategy: Data is always saved locally first, then synced to cloud.
               </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default Settings;