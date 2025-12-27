
import React, { useState, useEffect } from 'react';
import { db } from '../db';
import { Sale, RepairJob, Product, ShopSettings } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Calendar, Printer, TrendingUp, TrendingDown, Target } from 'lucide-react';

const Reports = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [repairs, setRepairs] = useState<RepairJob[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  
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
      const [salesData, repairsData, prodData, settingsData] = await Promise.all([
        db.sales.getAll(),
        db.repairs.getAll(),
        db.products.getAll(),
        db.settings.get()
      ]);
      setSales(salesData);
      setRepairs(repairsData);
      setProducts(prodData);
      setSettings(settingsData);
    };
    loadData();
  }, []);

  const totalSalesRevenue = sales.reduce((acc, s) => acc + (s.total ?? 0), 0);
  const totalRepairsRevenue = repairs.reduce((acc, r) => acc + (r.paidAmount ?? 0), 0);
  const totalItemsSold = sales.reduce((acc, s) => acc + (s.items?.reduce((sum, item) => sum + (item.quantity ?? 0), 0) ?? 0), 0);

  const last7Days = [...Array(7)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dailyTotal = sales
      .filter(s => s.date.startsWith(dateStr))
      .reduce((acc, s) => acc + (s.total ?? 0), 0);
    return { name: d.toLocaleDateString([], { weekday: 'short' }), total: dailyTotal, fullDate: dateStr };
  }).reverse();

  const printReport = () => {
    const printArea = document.getElementById('print-area');
    if (!printArea) return;

    printArea.innerHTML = `
      <div style="padding: 20mm; font-family: 'Inter', sans-serif; color: #1e293b; background: white;">
        <div style="text-align: center; border-bottom: 2px solid #f1f5f9; padding-bottom: 15px; margin-bottom: 20px;">
          <h1 style="margin: 0; font-size: 24px; font-weight: 900;">${settings.businessName}</h1>
          <p style="margin: 5px 0; color: #64748b; font-size: 12px; font-weight: 600;">BUSINESS PERFORMANCE REPORT</p>
          <p style="margin: 0; color: #94a3b8; font-size: 10px;">Generated on: ${new Date().toLocaleString()}</p>
        </div>

        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 30px;">
          <div style="padding: 15px; border: 1px solid #f1f5f9; border-radius: 12px;">
            <div style="font-size: 10px; font-weight: 800; color: #94a3b8; margin-bottom: 5px; text-transform: uppercase;">Total Sales</div>
            <div style="font-size: 18px; font-weight: 900; color: #10b981;">UGX ${(totalSalesRevenue ?? 0).toLocaleString()}</div>
          </div>
          <div style="padding: 15px; border: 1px solid #f1f5f9; border-radius: 12px;">
            <div style="font-size: 10px; font-weight: 800; color: #94a3b8; margin-bottom: 5px; text-transform: uppercase;">Repair Income</div>
            <div style="font-size: 18px; font-weight: 900; color: #3b82f6;">UGX ${(totalRepairsRevenue ?? 0).toLocaleString()}</div>
          </div>
          <div style="padding: 15px; border: 1px solid #f1f5f9; border-radius: 12px;">
            <div style="font-size: 10px; font-weight: 800; color: #94a3b8; margin-bottom: 5px; text-transform: uppercase;">Items Sold</div>
            <div style="font-size: 18px; font-weight: 900; color: #f59e0b;">${totalItemsSold} Units</div>
          </div>
        </div>

        <h3 style="font-size: 14px; font-weight: 800; border-bottom: 1px solid #f1f5f9; padding-bottom: 10px; margin-bottom: 15px;">RECENT TRANSACTION LOG</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
          <thead>
            <tr style="background: #f8fafc; text-align: left;">
              <th style="padding: 10px; border-bottom: 1px solid #e2e8f0;">Invoice</th>
              <th style="padding: 10px; border-bottom: 1px solid #e2e8f0;">Date</th>
              <th style="padding: 10px; border-bottom: 1px solid #e2e8f0;">Method</th>
              <th style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: right;">Total (UGX)</th>
            </tr>
          </thead>
          <tbody>
            ${sales.slice(0, 15).map(s => `
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 10px; font-weight: 700;">${s.invoiceNumber}</td>
                <td style="padding: 10px;">${new Date(s.date).toLocaleDateString()}</td>
                <td style="padding: 10px;">${s.paymentMethod}</td>
                <td style="padding: 10px; text-align: right; font-weight: 800;">${(s.total ?? 0).toLocaleString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div style="margin-top: 40px; text-align: center; color: #94a3b8; font-size: 10px;">
          <p>${settings.address} • Tel: ${settings.phone}</p>
          <p>Confidential Business Intelligence • SNA! Mobile Systems</p>
        </div>
      </div>
    `;
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">Analytics & Reports</h2>
          <p className="text-xs text-slate-500 font-medium tracking-tight">Insights into business growth and staff performance</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors shadow-sm">
            <Calendar size={14} /> Custom Range
          </button>
          <button 
            onClick={printReport}
            className="flex items-center gap-2 px-5 py-2.5 bg-brand-navy text-white rounded-xl text-xs font-black shadow-lg shadow-brand-navy/20 hover:scale-[1.02] transition-all"
          >
            <Printer size={16} /> Print Full Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform">
            <TrendingUp size={48} className="text-emerald-500" />
          </div>
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">POS Sales Revenue</div>
          <div className="text-2xl font-black text-emerald-600">UGX {(totalSalesRevenue ?? 0).toLocaleString()}</div>
          <div className="mt-3 text-[10px] font-bold text-emerald-500 flex items-center gap-1 bg-emerald-50 w-fit px-2 py-0.5 rounded-lg">
            <Target size={12} /> Target Met
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform">
            <Target size={48} className="text-blue-500" />
          </div>
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Repair Center Income</div>
          <div className="text-2xl font-black text-blue-600">UGX {(totalRepairsRevenue ?? 0).toLocaleString()}</div>
          <div className="mt-3 text-[10px] font-bold text-blue-500 flex items-center gap-1 bg-blue-50 w-fit px-2 py-0.5 rounded-lg">
            <TrendingUp size={12} /> Growing
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform">
            <TrendingUp size={48} className="text-brand-primary" />
          </div>
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Inventory Throughput</div>
          <div className="text-2xl font-black text-brand-primaryDark">{totalItemsSold} Items</div>
          <div className="mt-3 text-[10px] font-bold text-slate-400 flex items-center gap-1 bg-slate-50 w-fit px-2 py-0.5 rounded-lg">
            Sold vs Stocks
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h3 className="font-black text-slate-800 uppercase tracking-tight text-sm">7-Day Revenue Trends</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Cash Inflow Analysis</p>
          </div>
          <span className="text-[10px] font-black text-emerald-500 bg-emerald-50 px-3 py-1.5 rounded-xl uppercase tracking-widest">Growth Observed</span>
        </div>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={last7Days}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 900, fill: '#94a3b8', dy: 10}} />
              <YAxis hide />
              <Tooltip 
                cursor={{fill: '#f8fafc'}}
                contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px'}}
                labelStyle={{fontWeight: 900, color: '#1e293b', marginBottom: '4px'}}
              />
              <Bar dataKey="total" radius={[12, 12, 0, 0]}>
                {last7Days.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={index === 6 ? '#f2a31b' : '#e2e8f0'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h3 className="font-black text-slate-800 uppercase tracking-tight text-sm">Recent Sales Ledger</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Audit Ready Transactions</p>
          </div>
          <button className="text-brand-primary text-xs font-black uppercase tracking-widest hover:text-brand-primaryDark transition-colors">View All Ledger</button>
        </div>
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">
            <tr>
              <th className="px-6 py-4">Transaction ID</th>
              <th className="px-6 py-4 text-center">Qty</th>
              <th className="px-6 py-4">Method</th>
              <th className="px-6 py-4 text-right">Settlement (UGX)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sales.slice(0, 8).map(s => (
              <tr key={s.id} className="text-sm group hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-5">
                  <div className="font-black text-slate-800 leading-tight">{s.invoiceNumber}</div>
                  <div className="text-[10px] text-slate-400 font-bold mt-0.5">{new Date(s.date).toLocaleDateString()} at {new Date(s.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                </td>
                <td className="px-6 py-5 text-center font-bold text-slate-600">{(s.items?.length ?? 0)}</td>
                <td className="px-6 py-5">
                  <span className="px-2.5 py-1 bg-slate-100 rounded-lg text-[10px] font-black uppercase tracking-wider text-slate-500">{s.paymentMethod}</span>
                </td>
                <td className="px-6 py-5 text-right font-black text-slate-800">UGX {(s.total ?? 0).toLocaleString()}</td>
              </tr>
            ))}
            {sales.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic text-xs">No transactions recorded in ledger</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Reports;
