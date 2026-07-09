import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Phone, Lock, Save } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

export function ProfilePage() {
  const { profile, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isPasswordSection, setIsPasswordSection] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSaveProfile = async () => {
    if (!profile) return;
    setLoading(true);
    setMessage('');

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          phone,
        })
        .eq('id', profile.id);

      if (error) throw error;
      await refreshProfile();
      setMessage('Профіль оновлено!');
    } catch (err) {
      setMessage('Помилка оновлення профілю');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 8) {
      setMessage('Пароль має містити мінімум 8 символів');
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage('Паролі не співпадають');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setMessage('Пароль змінено!');
      setNewPassword('');
      setConfirmPassword('');
      setIsPasswordSection(false);
    } catch (err) {
      setMessage('Помилка зміни паролю');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50 to-teal-50">
      <header className="bg-white/80 backdrop-blur-lg border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button onClick={() => navigate(-1)} className="text-slate-600 hover:text-slate-800">
              ← Назад
            </button>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-lg flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-slate-800">Профіль</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-teal-500 to-cyan-600 px-6 py-8">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-xl font-bold text-white text-center">
              {profile?.full_name || 'Користувач'}
            </h1>
            <p className="text-teal-100 text-center text-sm">{profile?.email}</p>
          </div>

          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">ПІБ</label>
              <div className="relative">
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Телефон</label>
              <div className="relative">
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+380"
                  className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              </div>
            </div>

            <button
              onClick={handleSaveProfile}
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-xl hover:from-teal-600 hover:to-cyan-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
            >
              <Save className="w-5 h-5" />
              Зберегти
            </button>

            <div className="pt-6 border-t border-slate-200">
              <button
                onClick={() => setIsPasswordSection(!isPasswordSection)}
                className="w-full flex items-center justify-between py-2 text-slate-700 hover:text-slate-900"
              >
                <span className="flex items-center gap-2">
                  <Lock className="w-5 h-5 text-slate-400" />
                  Змінити пароль
                </span>
                <span className="text-slate-400">{isPasswordSection ? '▲' : '▼'}</span>
              </button>

              {isPasswordSection && (
                <div className="mt-4 space-y-4">
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Новий пароль"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Підтверддіть пароль"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  <button
                    onClick={handleChangePassword}
                    disabled={loading}
                    className="w-full py-3 bg-slate-700 text-white rounded-xl hover:bg-slate-800 disabled:opacity-50"
                  >
                    Змінити пароль
                  </button>
                </div>
              )}
            </div>

            {message && (
              <div className="p-3 bg-teal-50 border border-teal-200 rounded-lg text-teal-700 text-sm text-center">
                {message}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
