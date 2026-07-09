import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Building2, Settings, LogOut, Users, CreditCard, TrendingUp } from 'lucide-react';

export function SuperAdminPage() {
  const { profile, signOut } = useAuth();
  const [tenants, setTenants] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'tenants' | 'payments'>('tenants');

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      const { data: t } = await supabase.from('tenants').select('*').order('created_at', { ascending: false });
      const { data: p } = await supabase.from('payments').select('*').order('created_at', { ascending: false }).limit(50);
      setTenants(t || []);
      setPayments(p || []);
    } finally { setLoading(false); }
  }

  const stats = {
    total: tenants.length,
    active: tenants.filter(t => t.status === 'active').length,
    trial: tenants.filter(t => t.status === 'trial').length,
    revenue: payments.filter(p => p.status === 'paid').reduce((s, p) => s + (p.amount || 0), 0),
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
              <Settings className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">OSBB Platform</h1>
              <p className="text-xs text-slate-400">Супер-адмін</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-slate-400">{profile?.full_name}</span>
            <button onClick={signOut} className="p-2 text-slate-400 hover:text-white">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard icon={<Building2 />} label="ОСББ" value={stats.total} />
          <StatCard icon={<Users />} label="Активних" value={stats.active} color="green" />
          <StatCard icon={<TrendingUp />} label="Тріал" value={stats.trial} color="yellow" />
          <StatCard icon={<CreditCard />} label="Дохід" value={`${stats.revenue.toLocaleString()} грн`} color="purple" />
        </div>

        <div className="flex gap-2 mb-6">
          <button onClick={() => setTab('tenants')} className={`px-4 py-2 rounded-lg ${tab === 'tenants' ? 'bg-amber-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
            ОСББ
          </button>
          <button onClick={() => setTab('payments')} className={`px-4 py-2 rounded-lg ${tab === 'payments' ? 'bg-amber-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
            Платежі
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12"><div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" /></div>
        ) : tab === 'tenants' ? (
          <div className="bg-slate-800 rounded-xl border border-slate-700">
            <table className="w-full">
              <thead className="bg-slate-700/50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm text-slate-300">Назва</th>
                  <th className="px-4 py-3 text-left text-sm text-slate-300">Місто</th>
                  <th className="px-4 py-3 text-left text-sm text-slate-300">Статус</th>
                </tr>
              </thead>
              <tbody>
                {tenants.map((t) => (
                  <tr key={t.id} className="border-t border-slate-700">
                    <td className="px-4 py-3 text-white">{t.name}</td>
                    <td className="px-4 py-3 text-slate-400">{t.city}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs ${t.status === 'active' ? 'bg-green-500/20 text-green-400' : t.status === 'trial' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>
                        {t.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-slate-800 rounded-xl border border-slate-700">
            <table className="w-full">
              <thead className="bg-slate-700/50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm text-slate-300">Дата</th>
                  <th className="px-4 py-3 text-left text-sm text-slate-300">Сума</th>
                  <th className="px-4 py-3 text-left text-sm text-slate-300">Статус</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-t border-slate-700">
                    <td className="px-4 py-3 text-white">{new Date(p.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-white">{p.amount?.toLocaleString()} грн</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs ${p.status === 'paid' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}

function StatCard({ icon, label, value, color = 'blue' }: { icon: React.ReactNode; label: string; value: string | number; color?: string }) {
  const colors: any = { blue: 'from-blue-500 to-cyan-600', green: 'from-green-500 to-emerald-600', yellow: 'from-yellow-500 to-amber-600', purple: 'from-purple-500 to-violet-600' };
  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colors[color]} flex items-center justify-center text-white`}>{icon}</div>
      <div>
        <p className="text-2xl font-bold text-white">{value}</p>
        <p className="text-sm text-slate-400">{label}</p>
      </div>
    </div>
  );
}
