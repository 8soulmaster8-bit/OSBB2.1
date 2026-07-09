import { useState, useEffect } from 'react';
import { Building2, Plus, Search, Settings, Check, Users, CreditCard } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { UserMenu } from '../components/UserMenu';

export function SuperAdminDashboard() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'tenants' | 'payments'>('tenants');
  const [tenants, setTenants] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const { data: tenantsData } = await supabase
        .from('tenants')
        .select('*')
        .order('created_at', { ascending: false });
      setTenants(tenantsData || []);

      const { data: paymentsData } = await supabase
        .from('payments')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      setPayments(paymentsData || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredTenants = tenants.filter((t) =>
    t.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.city?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <header className="bg-slate-800/80 backdrop-blur-lg border-b border-slate-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                <Settings className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">OSBB Platform</h1>
                <p className="text-xs text-slate-400">Панель супер-адміна</p>
              </div>
            </div>
            <UserMenu />
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <StatCard label="ОСББ" value={tenants.length} color="blue" />
          <StatCard label="Активних" value={tenants.filter(t => t.status === 'active').length} color="green" />
          <StatCard label="Тріал" value={tenants.filter(t => t.status === 'trial').length} color="yellow" />
          <StatCard label="Заблоковано" value={tenants.filter(t => t.status === 'suspended').length} color="red" />
          <StatCard label="Дохід" value={`${payments.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0).toLocaleString()} грн`} color="purple" />
        </div>

        <div className="flex gap-2 mb-6">
          <TabButton active={activeTab === 'tenants'} onClick={() => setActiveTab('tenants')}>
            <Building2 className="w-4 h-4" /> ОСББ
          </TabButton>
          <TabButton active={activeTab === 'payments'} onClick={() => setActiveTab('payments')}>
            <CreditCard className="w-4 h-4" /> Платежі
          </TabButton>
        </div>

        {activeTab === 'tenants' && (
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Пошук ОСББ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white"
              />
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          </div>
        ) : activeTab === 'tenants' ? (
          <div className="grid gap-4">
            {filteredTenants.map((tenant) => (
              <div key={tenant.id} className="bg-slate-800/50 rounded-xl border border-slate-700 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{tenant.name}</h3>
                    <p className="text-sm text-slate-400">{tenant.city}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs ${
                    tenant.status === 'active' ? 'bg-green-500/20 text-green-400' :
                    tenant.status === 'trial' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>
                    {tenant.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-slate-800/50 rounded-xl border border-slate-700">
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
                    <td className="px-4 py-3 text-sm text-white">{new Date(p.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-sm text-white">{p.amount?.toLocaleString()} грн</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs ${
                        p.status === 'paid' ? 'bg-green-500/20 text-green-400' :
                        p.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  const colors: any = { blue: 'from-blue-500 to-cyan-600', green: 'from-green-500 to-emerald-600', yellow: 'from-yellow-500 to-amber-600', red: 'from-red-500 to-rose-600', purple: 'from-purple-500 to-violet-600' };
  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-4">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${colors[color]} flex items-center justify-center text-white`}>
          <Building2 className="w-5 h-5" />
        </div>
        <div>
          <p className="text-2xl font-bold text-white">{value}</p>
          <p className="text-xs text-slate-400">{label}</p>
        </div>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${active ? 'bg-amber-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>
      {children}
    </button>
  );
}
