import { useAuth } from '../context/AuthContext';
import { Building2, Chrome as Home, FileText, Wrench, Settings, LogOut } from 'lucide-react';

export function UserDashboard() {
  const { profile, signOut } = useAuth();

  const cards = [
    { icon: <Home />, title: 'Моє помешкання', desc: 'Інформація про квартиру', color: 'from-blue-500 to-cyan-600' },
    { icon: <FileText />, title: 'Рахунки', desc: 'Перегляд та оплата', color: 'from-green-500 to-emerald-600' },
    { icon: <Wrench />, title: 'Заявки', desc: 'Подати заявку', color: 'from-amber-500 to-orange-600' },
    { icon: <Settings />, title: 'Лічильники', desc: 'Передати показники', color: 'from-purple-500 to-violet-600' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50 to-teal-50">
      <header className="bg-white/80 backdrop-blur-lg border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-800">ОСББ Управління</h1>
              <p className="text-xs text-slate-500">Кабінет жителя</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-slate-600">{profile?.full_name}</span>
            <button onClick={signOut} className="p-2 text-slate-400 hover:text-slate-600">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-slate-800 mb-6">Вітаємо, {profile?.full_name}!</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map((card) => (
            <div key={card.title} className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-all cursor-pointer group">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform`}>{card.icon}</div>
              <h3 className="text-lg font-semibold text-slate-800">{card.title}</h3>
              <p className="text-sm text-slate-500">{card.desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
