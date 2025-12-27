
import React, { useState } from 'react';
import { db } from '../db';
import { User } from '../types';
import { Lock, User as UserIcon, Loader2, ShieldCheck } from 'lucide-react';

interface LoginProps {
  onLoginSuccess: (user: User) => void;
}

const Login = ({ onLoginSuccess }: LoginProps) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const performLogin = (u: string, p: string) => {
    setLoading(true);
    setError('');

    // Hardcoded single user requirement
    const VALID_EMAIL = 'admin@snai.com';
    const VALID_PASS = 'password123';

    setTimeout(() => {
      if (u.toLowerCase() === VALID_EMAIL && p === VALID_PASS) {
        const userData: User = { 
          id: 'u-admin', 
          username: u, 
          name: 'SNA! Administrator', 
          role: 'Admin' 
        };
        db.auth.setCurrentUser(userData);
        db.audit.add({ userId: userData.id, username: userData.username, action: 'Authorized access to management system' });
        onLoginSuccess(userData);
      } else {
        setError('Invalid email or password');
        setLoading(false);
      }
    }, 1000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performLogin(username, password);
  };

  return (
    <div className="min-h-screen bg-brand-navy flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background Ambience */}
      <div className="absolute top-[-15%] left-[-10%] w-[50%] h-[50%] bg-brand-primary/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-15%] right-[-10%] w-[50%] h-[50%] bg-brand-primaryDark/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md bg-brand-navyLight border border-white/10 rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden animate-in fade-in zoom-in duration-700">
        
        {/* LOGIN FORM */}
        <div className="p-10 flex flex-col justify-center">
          <div className="flex flex-col items-center mb-10 text-center">
            <div className="w-20 h-20 bg-brand-primary rounded-3xl flex items-center justify-center text-black font-black text-4xl shadow-2xl shadow-brand-primary/40 mb-6">
              S
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight leading-tight">SNA! MOBILE</h1>
            <p className="text-brand-textMuted text-[10px] uppercase tracking-[0.2em] font-bold mt-2">Management Portal</p>
          </div>

          <div className="mb-8 text-center">
            <h3 className="text-xl font-black text-white mb-1">Authentication</h3>
            <p className="text-brand-textMuted text-xs">Please sign in to your administrative account.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-brand-textMuted uppercase mb-2 ml-1">Email Address</label>
                <div className="relative">
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                  <input 
                    type="email" 
                    required
                    placeholder="admin@snai.com"
                    className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-white/10 focus:outline-none focus:ring-2 focus:ring-brand-primary/30 transition-all font-medium"
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
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-wider text-center animate-in fade-in slide-in-from-top-2">
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
             <div className="flex items-center justify-center">
                <span className="flex items-center gap-1.5 text-[10px] text-emerald-500/60 font-bold uppercase tracking-[0.1em]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Secure Node Online
                </span>
             </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-6 text-[10px] text-brand-textMuted uppercase font-black tracking-widest text-center opacity-40">
        &copy; 2024 SNA! Mobile Systems • Kampala, Uganda
      </div>
    </div>
  );
};

export default Login;
