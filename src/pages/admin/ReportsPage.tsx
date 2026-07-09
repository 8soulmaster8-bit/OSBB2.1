import { useState, useEffect } from 'react';
import { ChartBar as BarChart3, TrendingUp, TrendingDown, DollarSign, Users, Chrome as Home, FileText } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

export function ReportsPage() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    pendingPayments: 0,
    residents: 0,
    apartments: 0,
  });
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    if (!profile?.tenant_id) return;
    setLoading(true);
    try {
      // Get residents count
      const { count: residentsCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', profile.tenant_id);

      // Get apartments count
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('apartment')
        .eq('tenant_id', profile.tenant_id)
        .not('apartment', 'is', null);

      const apartmentsCount = new Set(profilesData?.map(p => p.apartment) || []).size;

      // Get charges for stats
      const { data: charges } = await supabase
        .from('charges')
        .select('*')
        .eq('tenant_id', profile.tenant_id);

      const totalRevenue = charges?.reduce((sum, c) => sum + c.total_amount, 0) || 0;
      const pendingPayments = charges?.filter(c => !c.paid).reduce((sum, c) => sum + c.total_amount, 0) || 0;

      setStats({
        totalRevenue,
        pendingPayments,
        residents: residentsCount || 0,
        apartments: apartmentsCount,
      });

      // Mock monthly data for chart
      setMonthlyData([
        { month: 'Січ', revenue: 45000 },
        { month: 'Лют', revenue: 48000 },
        { month: 'Бер', revenue: 52000 },
        { month: 'Кві', revenue: 49000 },
        { month: 'Тра', revenue: 55000 },
        { month: 'Чер', revenue: totalRevenue / 100 },
      ]);

      // Category breakdown
      const water = charges?.reduce((s, c) => s + c.water_amount, 0) || 0;
      const electricity = charges?.reduce((s, c) => s + c.electricity_amount, 0) || 0;
      const gas = charges?.reduce((s, c) => s + c.gas_amount, 0) || 0;
      const heating = charges?.reduce((s, c) => s + c.heating_amount, 0) || 0;
      const maintenance = charges?.reduce((s, c) => s + c.maintenance_amount, 0) || 0;

      setCategoryData([
        { name: 'Вода', value: water, color: '#0ea5e9' },
        { name: 'Електрика', value: electricity, color: '#eab308' },
        { name: 'Газ', value: gas, color: '#f97316' },
        { name: 'Опалення', value: heating, color: '#ef4444' },
        { name: 'Утримання', value: maintenance, color: '#14b8a6' },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50 to-teal-50">
      <header className="bg-white/80 backdrop-blur-lg border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <a href="/admin/dashboard" className="text-slate-600 hover:text-slate-800">← Назад</a>
              <h1 className="text-xl font-bold text-slate-800">Звіти</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard icon={<DollarSign className="w-5 h-5" />} label="Дохід" value={`${stats.totalRevenue.toLocaleString()} грн`} color="teal" />
              <StatCard icon={<TrendingDown className="w-5 h-5" />} label="Заборгованість" value={`${stats.pendingPayments.toLocaleString()} грн`} color="red" />
              <StatCard icon={<Users className="w-5 h-5" />} label="Жителів" value={stats.residents} color="blue" />
              <StatCard icon={<Home className="w-5 h-5" />} label="Квартир" value={stats.apartments} color="purple" />
            </div>

            {/* Charts */}
            <div className="grid lg:grid-cols-2 gap-6 mb-8">
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <h3 className="font-semibold text-slate-800 mb-4">Динаміка доходів</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="month" stroke="#64748b" />
                      <YAxis stroke="#64748b" />
                      <Tooltip />
                      <Bar dataKey="revenue" fill="#14b8a6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <h3 className="font-semibold text-slate-800 mb-4">Структура нарахувань</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={index} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap gap-4 justify-center mt-4">
                  {categoryData.map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <div className="w-3 h-3 rounded" style={{ backgroundColor: item.color }} />
                      <span className="text-slate-600">{item.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: string }) {
  const colors: any = { teal: 'from-teal-500 to-cyan-600', red: 'from-red-500 to-rose-600', blue: 'from-blue-500 to-indigo-600', purple: 'from-purple-500 to-violet-600' };
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${colors[color]} flex items-center justify-center text-white`}>
          {icon}
        </div>
        <div>
          <p className="text-lg font-bold text-slate-800">{value}</p>
          <p className="text-xs text-slate-500">{label}</p>
        </div>
      </div>
    </div>
  );
}
