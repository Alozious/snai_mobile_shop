
import React, { useState } from 'react';
import { db } from '../db';
import { User, Role } from '../types';
import { Smartphone, Lock, User as UserIcon, Loader2, ShieldCheck, Briefcase, Calculator, Wrench } from 'lucide-react';

const DEMO_USERS = [
  { username: 'admin', password: 'admin', name: 'SNA! Admin', role: 'Admin' as Role, icon: ShieldCheck, color: 'text-brand-primary' },
  { username: 'manager', password: 'manager', name: 'James Manager', role: 'Manager' as Role, icon: Briefcase, color: 'text-blue-400' },
  { username: 'cashier', password: 'cashier', name: 'Sarah Cashier', role: 'Cashier' as Role, icon: Calculator, color: 'text-emerald-400' },
  { username: 'tech', password: 'tech', name: 'Musa Tech', role: 'Technician' as Role, icon: Wrench, color: 'text-purple-400' },
];

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleQuickLogin = (user: typeof DEMO_USERS[0]) => {
    setUsername(user.username);
    setPassword(user.password);
    performLogin(user.username, user.password);
  };

  const performLogin = (u: string, p: string) => {
    setLoading(true);
    setError('');

    setTimeout(() => {
      const found = DEMO_USERS.find(user => user.username === u && user.password === p);
      if (found) {
        const userData: User = { 
          id: `u-${found.username}`, 
          username: found.username, 
          name: found.name, 
          role: found.role 
        };
        db.auth.setCurrentUser(userData);
        db.audit.add({ userId: userData.id, username: userData.username, action: `Logged into system as ${found.role}` });
        window.location.href = '#/';
        window.location.reload();
      } else {
        setError('Invalid username or password');
        setLoading(false);
      }
    }, 800);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performLogin(username, password);
  };

  return (
    <div className="min-h-screen bg-brand-navy flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-[-15%] left-[-10%] w-[50%] h-[50%] bg-brand-primary/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-15%] right-[-10%] w-[50%] h-[50%] bg-brand-primaryDark/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-4xl flex flex-col md:flex-row bg-brand-navyLight border border-white/10 rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden animate-in fade-in zoom-in duration-700">
        
        {/* LEFT: INFO & QUICK ROLES */}
        <div className="flex-1 p-10 bg-gradient-to-br from-white/[0.03] to-transparent border-r border-white/5">
          <div className="flex items-center gap-4 mb-10">
            <div className="w-14 h-14 bg-brand-primary rounded-2xl flex items-center justify-center text-black font-black text-3xl shadow-2xl shadow-brand-primary/40">
              S
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight leading-tight">SNA! MOBILE</h1>
              <p className="text-brand-textMuted text-[10px] uppercase tracking-[0.2em] font-bold">Smart Management System</p>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-white font-bold text-sm mb-4 flex items-center gap-2">
              <ShieldCheck size={18} className="text-brand-primary" />
              Demo Access Points
            </h2>
            <div className="grid grid-cols-1 gap-3">
              {DEMO_USERS.map((user) => (
                <button
                  key={user.username}
                  onClick={() => handleQuickLogin(user)}
                  className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-brand-primary/30 transition-all group text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2.5 rounded-xl bg-white/5 ${user.color} group-hover:scale-110 transition-transform`}>
                      <user.icon size={20} />
                    </div>
                    <div>
                      <div className="text-white text-xs font-black">{user.name}</div>
                      <div className="text-[10px] text-brand-textMuted font-bold uppercase tracking-wider">{user.role}</div>
                    </div>
                  </div>
                  <div className="text-[10px] font-mono text-white/20 group-hover:text-brand-primary transition-colors pr-2">
                    {user.username}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <p className="text-[10px] text-brand-textMuted leading-relaxed max-w-xs">
            Experience the full business suite including POS, Inventory, and Repairs tracking. 
            Select a role to preview specific permissions.
          </p>
        </div>

        {/* RIGHT: ACTUAL LOGIN FORM */}
        <div className="flex-1 p-10 flex flex-col justify-center bg-white/5">
          <div className="mb-8">
            <h3 className="text-xl font-black text-white mb-1">Welcome Back</h3>
            <p className="text-brand-textMuted text-xs">Enter your credentials to access the shop portal.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-brand-textMuted uppercase mb-2 ml-1">Username</label>
                <div className="relative">
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. admin"
                    className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-white/10 focus:outline-none focus:ring-2 focus:ring-brand-primary/30 transition-all"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-brand-textMuted uppercase mb-2 ml-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                  <input 
                    type="password" 
                    required
                    placeholder="••••••••"
                    className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-white/10 focus:outline-none focus:ring-2 focus:ring-brand-primary/30 transition-all"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-wider text-center animate-pulse">
                {error}
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-4 bg-brand-primary hover:bg-brand-primaryDark disabled:opacity-50 text-black font-black uppercase tracking-[0.2em] rounded-2xl shadow-2xl shadow-brand-primary/20 transition-all flex items-center justify-center gap-3 group"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  SIGN IN
                  <ShieldCheck size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-10 pt-10 border-t border-white/5">
             <div className="flex items-center justify-between">
                <span className="text-[10px] text-white/20 font-bold uppercase tracking-widest">System Status</span>
                <span className="flex items-center gap-1.5 text-[10px] text-emerald-500 font-bold uppercase">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Operational
                </span>
             </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-6 text-[10px] text-brand-textMuted uppercase font-black tracking-widest text-center">
        &copy; 2024 SNA! Mobile Systems • Kampala, Uganda
      </div>
    </div>
  );
};

export default Login;
