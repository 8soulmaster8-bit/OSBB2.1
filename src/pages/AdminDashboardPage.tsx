import { Building2, Users, FileText, Settings, Wrench, CreditCard } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserMenu } from '../components/UserMenu';
import { useNavigate } from 'react-router-dom';

export function AdminDashboardPage() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const cards = [
    { icon: <Users className="w-6 h-6" />, title: 'Жителі', description: 'Управління жителями', path: '/admin/residents' },
    { icon: <FileText className="w-6 h-6" />, title: 'Нарахування', description: 'Виставлення рахунків', path: '/admin/charges' },
    { icon: <CreditCard className="w-6 h-6" />, title: 'Квитанції', description: 'Генерація PDF', path: '/admin/invoices' },
    { icon: <Settings className="w-6 h-6" />, title: 'Лічильники', description: 'Облік показників', path: '/admin/meters' },
    { icon: <Wrench className="w-6 h-6" />, title: 'Заявки', description: 'Управління заявками', path: '/admin/requests' },
    { icon: <FileText className="w-6 h-6" />, title: 'Звіти', description: 'Фінансові звіти', path: '/admin/reports' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50 to-teal-50">
      <header className="bg-white/80 backdrop-blur-lg border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg shadow-teal-500/25">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800">ОСББ Управління</h1>
                <p className="text-xs text-slate-500">Кабінет голови ОСББ</p>
              </div>
            </div>
            <UserMenu />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-800">
            Вітаємо, {profile?.full_name || 'Адміністратор'}!
          </h2>
          <p className="text-slate-600 mt-1">Панель управління ОСББ</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((card) => (
            <div
              key={card.path}
              onClick={() => navigate(card.path)}
              className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg hover:border-teal-300 transition-all cursor-pointer group"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform">
                {card.icon}
              </div>
              <h3 className="text-lg font-semibold text-slate-800 mb-1">{card.title}</h3>
              <p className="text-sm text-slate-500">{card.description}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
