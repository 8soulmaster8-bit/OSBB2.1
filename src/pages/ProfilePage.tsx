import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  ArrowLeft,
  Phone,
  Home,
  Ruler,
  Shield,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { dashboardPathForRole } from '../components/ProtectedRoute';

function initialsOf(fullName: string | undefined) {
  if (!fullName) return '?';
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? '?';
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function ProfilePage() {
  const { user, profile, updatePhone, updatePassword } = useAuth();
  const navigate = useNavigate();

  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [phoneSubmitting, setPhoneSubmitting] = useState(false);
  const [phoneMessage, setPhoneMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPhoneMessage(null);
    if (!phone.trim()) {
      setPhoneMessage({ type: 'error', text: 'Введіть номер телефону' });
      return;
    }
    setPhoneSubmitting(true);
    const { error } = await updatePhone(phone.trim());
    setPhoneSubmitting(false);
    setPhoneMessage(
      error ? { type: 'error', text: error } : { type: 'success', text: 'Номер телефону оновлено' }
    );
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);
    if (newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: 'Пароль повинен містити не менше 6 символів' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'Паролі не співпадають' });
      return;
    }
    setPasswordSubmitting(true);
    const { error } = await updatePassword(newPassword);
    setPasswordSubmitting(false);
    if (error) {
      setPasswordMessage({ type: 'error', text: error });
    } else {
      setPasswordMessage({ type: 'success', text: 'Пароль успішно змінено' });
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50 to-teal-50">
      <header className="bg-white/80 backdrop-blur-lg border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => navigate(dashboardPathForRole(profile?.role))}
              className="flex items-center gap-2 text-slate-500 hover:text-teal-600 transition-colors text-sm font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              До кабінету
            </button>

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg shadow-teal-500/25">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <span className="hidden sm:block font-bold text-slate-800">ОСББ Управління</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200 p-6 sm:p-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center text-white text-xl font-bold shadow-md flex-shrink-0">
              {initialsOf(profile?.full_name)}
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">{profile?.full_name || 'Користувач'}</h1>
              <p className="text-sm text-slate-500">{user?.email}</p>
              <span
                className={`inline-flex items-center gap-1 mt-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  profile?.role === 'admin'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-teal-100 text-teal-700'
                }`}
              >
                <Shield className="w-3 h-3" />
                {profile?.role === 'admin' ? 'Голова ОСББ' : 'Житель'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                <Home className="w-4 h-4 text-slate-500" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Квартира</p>
                <p className="text-sm font-medium text-slate-700">{profile?.apartment_number || '—'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                <Ruler className="w-4 h-4 text-slate-500" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Площа</p>
                <p className="text-sm font-medium text-slate-700">{profile?.square_meters ?? '—'} м²</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200 p-6 sm:p-8">
          <h2 className="text-lg font-bold text-slate-800 mb-1">Контактні дані</h2>
          <p className="text-sm text-slate-500 mb-5">Оновіть номер телефону для зв'язку</p>

          {phoneMessage && (
            <div
              className={`mb-4 flex items-start gap-2 rounded-xl px-4 py-3 text-sm border ${
                phoneMessage.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : 'bg-red-50 border-red-200 text-red-700'
              }`}
            >
              {phoneMessage.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              )}
              <span>{phoneMessage.text}</span>
            </div>
          )}

          <form onSubmit={handlePhoneSubmit} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                <Phone className="w-4 h-4" />
              </span>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+380..."
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              disabled={phoneSubmitting}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-lg font-medium hover:from-teal-600 hover:to-cyan-600 transition-all shadow-md shadow-teal-500/25 disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {phoneSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Зберегти'}
            </button>
          </form>
        </div>

        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200 p-6 sm:p-8">
          <h2 className="text-lg font-bold text-slate-800 mb-1">Зміна пароля</h2>
          <p className="text-sm text-slate-500 mb-5">Мінімум 6 символів</p>

          {passwordMessage && (
            <div
              className={`mb-4 flex items-start gap-2 rounded-xl px-4 py-3 text-sm border ${
                passwordMessage.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : 'bg-red-50 border-red-200 text-red-700'
              }`}
            >
              {passwordMessage.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              )}
              <span>{passwordMessage.text}</span>
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Новий пароль</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    className="w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Підтвердіть пароль</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={passwordSubmitting}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-lg font-medium hover:from-teal-600 hover:to-cyan-600 transition-all shadow-md shadow-teal-500/25 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {passwordSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Змінити пароль'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
