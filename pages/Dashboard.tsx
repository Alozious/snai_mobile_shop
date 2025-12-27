
import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Wrench, 
  AlertCircle, 
  Box, 
  ArrowUpRight,
  Clock
} from 'lucide-react';
import { db } from '../db';
import { Product, Sale, RepairJob, AuditLog } from '../types';

const KPICard = ({ label, value, sub, icon: Icon, colorClass }: { label: string, value: string, sub: string, icon: React.ElementType, colorClass: string }) => (
  <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-xl ${colorClass}`}>
        <Icon size={22} />
      </div>
      <div className="flex items-center text-emerald-500 text-xs font-bold bg-emerald-50 px-2 py-1 rounded-lg">
        <ArrowUpRight size={14} /> 12%
      </div>
    </div>
    <div className="text-slate-500 text-xs font-semibold mb-1 uppercase tracking-tight">{label}</div>
    <div className="text-2xl font-black text-slate-800 tracking-tight">{value}</div>
    <div className="text-[10px] text-slate-400 mt-2 font-medium">{sub}</div>
  </div>
);

const Dashboard = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [repairs, setRepairs] = useState<RepairJob[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const [s, r, p, l] = await Promise.all([
        db.sales.getAll(),
        db.repairs.getAll(),
        db.products.getAll(),
        db.audit.getAll()
      ]);
      setSales(s);
      setRepairs(r);
      setProducts(p);
      setLogs(l);
      setLoading(false);
    };
    loadData();
  }, []);

  const today = new Date().toISOString().split('T')[0];
  const todaySales = sales
    .filter(s => s.date.startsWith(today))
    .reduce((acc, s) => acc + (s.total ?? 0), 0);
    
  const activeRepairs = repairs.filter(r => r.status !== 'Delivered' && r.status !== 'Cancelled').length;
  const lowStock = products.filter(p => (p.quantity ?? 0) <= (p.reorderLevel ?? 0)).length;
  const totalStockValue = products.reduce((acc, p) => acc + ((p.costPrice ?? 0) * (p.quantity ?? 0)), 0);

  const formatCurrency = (amount: number) => `UGX ${(amount ?? 0).toLocaleString('en-US')}`;

  if (loading) return <div className="p-20 text-center text-slate-400 font-bold">Refreshing Business Intel...</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard 
          label="Today's Sales" 
          value={formatCurrency(todaySales)} 
          sub="Gross revenue today"
          icon={TrendingUp}
          colorClass="bg-brand-primary/10 text-brand-primaryDark"
        />
        <KPICard 
          label="Active Repairs" 
          value={activeRepairs.toString()} 
          sub="In-progress job cards"
          icon={Wrench}
          colorClass="bg-blue-100 text-blue-600"
        />
        <KPICard 
          label="Low Stock Alert" 
          value={lowStock.toString()} 
          sub="Requires urgent reorder"
          icon={AlertCircle}
          colorClass="bg-red-100 text-red-600"
        />
        <KPICard 
          label="Inventory Value" 
          value={formatCurrency(totalStockValue)} 
          sub="Estimated cost value"
          icon={Box}
          colorClass="bg-purple-100 text-purple-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* RECENT ACTIVITY */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Clock size={18} className="text-brand-primary" />
              Recent Activity
            </h3>
            <button className="text-brand-primary text-xs font-bold hover:underline">View Full Audit Log</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-400 font-medium uppercase text-[10px] tracking-widest">
                <tr>
                  <th className="px-6 py-4">Time</th>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {logs.length > 0 ? logs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-700">{log.username}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {log.action}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={3} className="px-6 py-12 text-center text-slate-400 italic">No recent activity detected</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* LOW STOCK LIST */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Box size={18} className="text-red-500" />
              Low Stock Warning
            </h3>
          </div>
          <div className="p-2 space-y-1">
            {products.filter(p => (p.quantity ?? 0) <= (p.reorderLevel ?? 0)).map(p => (
              <div key={p.id} className="p-3 rounded-xl border border-slate-100 flex justify-between items-center hover:bg-slate-50 transition-colors">
                <div className="min-w-0">
                  <div className="text-sm font-bold text-slate-800 truncate">{p.name}</div>
                  <div className="text-[10px] text-slate-400 uppercase font-medium">{p.sku}</div>
                </div>
                <div className="text-right ml-4">
                  <div className={`text-sm font-black ${(p.quantity ?? 0) === 0 ? 'text-red-600' : 'text-amber-600'}`}>
                    {(p.quantity ?? 0)} left
                  </div>
                  <div className="text-[10px] text-slate-400">lvl: {(p.reorderLevel ?? 0)}</div>
                </div>
              </div>
            ))}
            {lowStock === 0 && (
              <div className="p-12 text-center text-slate-400 text-sm">All items well stocked</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
