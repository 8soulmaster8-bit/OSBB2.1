import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  User,
  Shield,
  Mail,
  Lock,
  Phone,
  Home,
  Ruler,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { dashboardPathForRole } from '../components/ProtectedRoute';

type Mode = 'signin' | 'signup';
type Role = 'resident' | 'admin';

export function AuthPage() {
  const { user, profile, loading, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>('signin');

  // Already-logged-in users shouldn't see the auth page.
  useEffect(() => {
    if (!loading && user && profile) {
      navigate(dashboardPathForRole(profile.role), { replace: true });
    }
  }, [loading, user, profile, navigate]);

  // Sign in fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Sign up fields
  const [role, setRole] = useState<Role>('resident');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [apartment, setApartment] = useState('');
  const [area, setArea] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signupSuccess, setSignupSuccess] = useState<string | null>(null);

  const resetMessages = () => {
    setError(null);
    setSignupSuccess(null);
  };

  const switchMode = (next: Mode) => {
    setMode(next);
    resetMessages();
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    if (!email || !password) {
      setError('Заполните email и пароль');
      return;
    }
    setSubmitting(true);
    const { error } = await signIn(email, password);
    setSubmitting(false);
    if (error) {
      setError(error);
      return;
    }
    // Navigation happens automatically in the useEffect above once the
    // profile has loaded.
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();

    if (!email || !password || !name || !phone || !apartment || !area) {
      setError('Заполните все обязательные поля');
      return;
    }
    if (password.length < 6) {
      setError('Пароль должен содержать не менее 6 символов');
      return;
    }
    const areaNumber = parseFloat(area.replace(',', '.'));
    if (Number.isNaN(areaNumber) || areaNumber <= 0) {
      setError('Укажите корректную площадь квартиры');
      return;
    }

    setSubmitting(true);
    const { error, needsEmailConfirmation } = await signUp({
      email,
      password,
      fullName: name,
      phone,
      apartmentNumber: apartment,
      squareMeters: areaNumber,
    });
    setSubmitting(false);

    if (error) {
      setError(error);
      return;
    }

    if (needsEmailConfirmation) {
      setSignupSuccess('Регистрация почти завершена! Мы отправили письмо для подтверждения на ' + email + '. Подтвердите email и войдите в систему.');
      setMode('signin');
      setPassword('');
    }
    // If no confirmation is required, the AuthContext session updates
    // automatically and the useEffect above redirects to the dashboard.
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50 to-teal-50 flex">
      {/* Branding panel — hidden on small screens, shown from lg breakpoint up */}
      <div className="hidden lg:flex lg:w-[42%] xl:w-[38%] relative overflow-hidden bg-gradient-to-br from-teal-600 via-cyan-600 to-teal-700">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-0 right-0 w-72 h-72 rounded-full bg-white blur-3xl" />
        </div>
        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-white/15 backdrop-blur rounded-xl flex items-center justify-center shadow-lg">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-lg font-bold leading-tight">ОСББ Управління</p>
              <p className="text-xs text-teal-100">Система управління будинком</p>
            </div>
          </div>

          <div className="space-y-8 max-w-sm">
            <h1 className="text-3xl xl:text-4xl font-bold leading-tight">
              Все про ваш будинок — в одному кабінеті
            </h1>
            <p className="text-teal-100 leading-relaxed">
              Показники лічильників, квитанції та заявки на ремонт — для мешканців.
              Повний контроль над будинком — для голови ОСББ.
            </p>

            <div className="space-y-4 pt-2">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-white/15 backdrop-blur flex items-center justify-center flex-shrink-0 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-semibold">Кабінет мешканця</p>
                  <p className="text-sm text-teal-100">Лічильники, квитанції, заявки на ремонт</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-white/15 backdrop-blur flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-semibold">Кабінет голови ОСББ</p>
                  <p className="text-sm text-teal-100">Мешканці, нарахування, контроль заявок</p>
                </div>
              </div>
            </div>
          </div>

          <p className="text-xs text-teal-200">© {new Date().getFullYear()} ОСББ Управління</p>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex-1 flex items-center justify-center px-4 py-10 sm:px-6 lg:px-12">
        <div className="w-full max-w-md">
          {/* Mobile-only logo */}
          <div className="flex lg:hidden items-center gap-3 justify-center mb-8">
            <div className="w-11 h-11 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg shadow-teal-500/25">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-lg font-bold text-slate-800 leading-tight">ОСББ Управління</p>
              <p className="text-xs text-slate-500">Система управління будинком</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200 p-6 sm:p-8">
            <div className="flex gap-2 bg-slate-100 p-1 rounded-xl mb-7">
              <button
                type="button"
                onClick={() => switchMode('signin')}
                className={`flex-1 py-2.5 rounded-lg font-medium text-sm transition-all ${
                  mode === 'signin'
                    ? 'bg-white text-teal-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Вхід
              </button>
              <button
                type="button"
                onClick={() => switchMode('signup')}
                className={`flex-1 py-2.5 rounded-lg font-medium text-sm transition-all ${
                  mode === 'signup'
                    ? 'bg-white text-teal-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Реєстрація
              </button>
            </div>

            <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-800">
                {mode === 'signin' ? 'З поверненням' : 'Створення акаунту'}
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                {mode === 'signin'
                  ? 'Увійдіть, щоб перейти до свого кабінету'
                  : 'Заповніть дані, щоб отримати доступ до кабінету'}
              </p>
            </div>

            {signupSuccess && (
              <div className="mb-5 flex items-start gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl px-4 py-3 text-sm">
                <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>{signupSuccess}</span>
              </div>
            )}

            {error && (
              <div className="mb-5 flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {mode === 'signin' ? (
              <form onSubmit={handleSignIn} className="space-y-4">
                <Field
                  icon={<Mail className="w-4 h-4" />}
                  label="Email"
                  type="email"
                  value={email}
                  onChange={setEmail}
                  placeholder="you@example.com"
                  autoComplete="email"
                />
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Пароль</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                      <Lock className="w-4 h-4" />
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="current-password"
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

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-lg font-medium hover:from-teal-600 hover:to-cyan-600 transition-all shadow-md shadow-teal-500/25 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      Увійти
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleSignUp} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Роль</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRole('resident')}
                      className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border font-medium text-sm transition-all ${
                        role === 'resident'
                          ? 'bg-teal-50 border-teal-400 text-teal-700'
                          : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      <User className="w-4 h-4" />
                      Житель
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('admin')}
                      className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border font-medium text-sm transition-all ${
                        role === 'admin'
                          ? 'bg-teal-50 border-teal-400 text-teal-700'
                          : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      <Shield className="w-4 h-4" />
                      Голова ОСББ
                    </button>
                  </div>
                </div>

                <Field
                  icon={<User className="w-4 h-4" />}
                  label="ПІБ"
                  type="text"
                  value={name}
                  onChange={setName}
                  placeholder="Іваненко Іван Іванович"
                  autoComplete="name"
                />

                <Field
                  icon={<Mail className="w-4 h-4" />}
                  label="Email"
                  type="email"
                  value={email}
                  onChange={setEmail}
                  placeholder="you@example.com"
                  autoComplete="email"
                />

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Пароль</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                      <Lock className="w-4 h-4" />
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Мінімум 6 символів"
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

                <div className="grid grid-cols-2 gap-3">
                  <Field
                    icon={<Phone className="w-4 h-4" />}
                    label="Телефон"
                    type="tel"
                    value={phone}
                    onChange={setPhone}
                    placeholder="+380..."
                    autoComplete="tel"
                  />
                  <Field
                    icon={<Home className="w-4 h-4" />}
                    label="№ квартири"
                    type="text"
                    value={apartment}
                    onChange={setApartment}
                    placeholder="45"
                  />
                </div>

                <Field
                  icon={<Ruler className="w-4 h-4" />}
                  label="Площа квартири, м²"
                  type="number"
                  value={area}
                  onChange={setArea}
                  placeholder="58"
                  step="0.1"
                />

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-lg font-medium hover:from-teal-600 hover:to-cyan-600 transition-all shadow-md shadow-teal-500/25 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      Зареєструватися
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            <p className="text-center text-sm text-slate-500 mt-6">
              {mode === 'signin' ? (
                <>
                  Немає акаунту?{' '}
                  <button
                    onClick={() => switchMode('signup')}
                    className="text-teal-600 font-medium hover:text-teal-700"
                  >
                    Зареєструватися
                  </button>
                </>
              ) : (
                <>
                  Вже є акаунт?{' '}
                  <button
                    onClick={() => switchMode('signin')}
                    className="text-teal-600 font-medium hover:text-teal-700"
                  >
                    Увійти
                  </button>
                </>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

interface FieldProps {
  icon: React.ReactNode;
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
  step?: string;
}

function Field({ icon, label, type, value, onChange, placeholder, autoComplete, step }: FieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">{icon}</span>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          step={step}
          className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
        />
      </div>
    </div>
  );
}
