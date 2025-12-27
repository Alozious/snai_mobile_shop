
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Wrench, 
  Truck, 
  BarChart3, 
  Users as UsersIcon, 
  Settings as SettingsIcon, 
  LogOut, 
  Search, 
  Plus,
  Bell,
  User as UserIcon,
  ChevronDown,
  Cloud,
  CloudOff,
  RefreshCw
} from 'lucide-react';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import POS from './pages/POS';
import Repairs from './pages/Repairs';
import Suppliers from './pages/Suppliers';
import Reports from './pages/Reports';
import Users from './pages/Users';
import Settings from './pages/Settings';
import Login from './pages/Login';
import { db } from './db';
import { User } from './types';

const SidebarItem = ({ to, icon: Icon, label, active }: { to: string, icon: React.ElementType, label: string, active: boolean }) => (
  <Link
    to={to}
    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
      active 
        ? 'bg-brand-primary text-black font-semibold shadow-lg shadow-brand-primary/20' 
        : 'text-brand-sidebarText hover:bg-white/5'
    }`}
  >
    <Icon size={20} strokeWidth={active ? 2.5 : 2} />
    <span className="text-sm">{label}</span>
  </Link>
);

const AppContent = () => {
  const location = useLocation();
  const [user, setUser] = useState<User | null>(db.auth.getCurrentUser());
  const [globalSearch, setGlobalSearch] = useState('');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'SYNCED' | 'SYNCING' | 'FAILED' | 'OFFLINE'>('SYNCED');

  // Background Sync Effect
  useEffect(() => {
    if (!user) return;
    const syncInterval = setInterval(async () => {
      if (syncStatus === 'SYNCING') return;
      setSyncStatus('SYNCING');
      const result = await db.sync.performSync();
      setSyncStatus(result as any);
    }, 15000); // Attempt sync every 15 seconds

    return () => clearInterval(syncInterval);
  }, [syncStatus, user]);

  const handleLogout = () => {
    db.auth.setCurrentUser(null);
    setUser(null);
  };

  if (!user) {
    return <Login onLoginSuccess={setUser} />;
  }

  return (
    <div className="flex h-screen w-full overflow-hidden text-slate-800">
      {/* SIDEBAR */}
      <aside className="w-64 bg-gradient-to-b from-brand-navy to-[#121633] flex-shrink-0 flex flex-col p-4 no-print border-r border-white/5">
        <div className="bg-brand-navyLight p-4 rounded-2xl flex items-center gap-3 mb-8 border border-white/5">
          <div className="w-11 h-11 rounded-xl bg-brand-primary flex items-center justify-center text-black font-extrabold text-xl shadow-lg shadow-brand-primary/30">
            S
          </div>
          <div>
            <div className="text-white font-bold tracking-tight">SNA! MOBILE</div>
            <div className="text-[10px] text-brand-textMuted uppercase tracking-widest font-medium">Phones • Repairs • Accs</div>
          </div>
        </div>

        <nav className="flex flex-col gap-1 flex-1">
          <SidebarItem to="/" icon={LayoutDashboard} label="Dashboard" active={location.pathname === '/'} />
          <SidebarItem to="/inventory" icon={Package} label="Inventory" active={location.pathname === '/inventory'} />
          <SidebarItem to="/pos" icon={ShoppingCart} label="Sales (POS)" active={location.pathname === '/pos'} />
          <SidebarItem to="/repairs" icon={Wrench} label="Repairs" active={location.pathname === '/repairs'} />
          <SidebarItem to="/suppliers" icon={Truck} label="Suppliers" active={location.pathname === '/suppliers'} />
          <SidebarItem to="/reports" icon={BarChart3} label="Reports" active={location.pathname === '/reports'} />
          <SidebarItem to="/users" icon={UsersIcon} label="Users & Roles" active={location.pathname === '/users'} />
          <SidebarItem to="/settings" icon={SettingsIcon} label="Settings" active={location.pathname === '/settings'} />
        </nav>

        <div className="mt-auto px-2 py-4">
           <div className="text-[10px] text-brand-textMuted uppercase font-black tracking-widest opacity-50">
             &copy; 2024 SNA! Mobile Systems
           </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-auto bg-[#f4f6fb] relative">
        {/* TOPBAR */}
        <header className="sticky top-0 z-10 p-4 no-print">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-3 flex items-center justify-between gap-4">
            <div className="flex-1 max-w-xl relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Search products, sales, customers..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary text-sm bg-slate-50/50"
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-100">
                {syncStatus === 'SYNCING' && <RefreshCw size={14} className="text-blue-500 animate-spin" />}
                {syncStatus === 'SYNCED' && <Cloud size={14} className="text-emerald-500" />}
                {syncStatus === 'FAILED' && <CloudOff size={14} className="text-red-500" />}
                {syncStatus === 'OFFLINE' && <CloudOff size={14} className="text-slate-300" />}
                <span className="text-[10px] font-black uppercase tracking-tight text-slate-400 hidden lg:block">
                  {syncStatus === 'SYNCING' ? 'Syncing...' : syncStatus === 'SYNCED' ? 'Cloud Synced' : syncStatus === 'FAILED' ? 'Sync Error' : 'Offline'}
                </span>
              </div>

              <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors relative">
                <Bell size={20} />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
              </button>
              
              <div className="h-8 w-px bg-slate-200 mx-2"></div>

              <div className="relative">
                <button 
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 border border-slate-200">
                    <UserIcon size={20} />
                  </div>
                  <div className="hidden sm:block text-left mr-1">
                    <div className="text-xs font-bold text-slate-800 leading-none">{user?.name}</div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase mt-1">{user?.role}</div>
                  </div>
                  <ChevronDown size={14} className={`text-slate-400 transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} />
                </button>

                {showProfileMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowProfileMenu(false)}></div>
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 z-20 py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="px-4 py-2 border-b border-slate-50 mb-1">
                        <div className="text-xs font-bold text-slate-500 uppercase">My Account</div>
                      </div>
                      <Link 
                        to="/settings" 
                        className="flex items-center gap-3 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
                        onClick={() => setShowProfileMenu(false)}
                      >
                        <SettingsIcon size={16} /> Profile Settings
                      </Link>
                      <button 
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors mt-1"
                      >
                        <LogOut size={16} /> Logout
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        <div className="p-4 pt-0">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/pos" element={<POS />} />
            <Route path="/repairs" element={<Repairs />} />
            <Route path="/suppliers" element={<Suppliers />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/users" element={<Users />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
};

export default function App() {
  return (
    <HashRouter>
      <AppContent />
    </HashRouter>
  );
}
