import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Building2, Users, CreditCard, FileText, Check, Search, AlertCircle, ArrowLeft, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { PLAN_PRICES, PLAN_FEATURES, type SubscriptionPlan } from '../types/database';

interface EDRPOUData {
  name: string;
  shortName: string;
  address: string;
  edrpou: string;
  status: string;
}

export function OsbbRegisterPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const initialPlan = (searchParams.get('plan') as SubscriptionPlan) || 'pro';
  const initialBilling = searchParams.get('billing') || 'yearly';

  // Step 1: EDRPOU
  const [edrpou, setEdrpou] = useState('');
  const [edrpouData, setEdrpouData] = useState<EDRPOUData | null>(null);
  const [edrpouLoading, setEdrpouLoading] = useState(false);
  const [edrpouError, setEdrpouError] = useState('');

  // Step 2: Admin details
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminPhone, setAdminPhone] = useState('');

  // Step 3: Subscription
  const [plan, setPlan] = useState<SubscriptionPlan>(initialPlan);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>(initialBilling as 'monthly' | 'yearly');

  // Step 4: Payment method
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'iban'>('card');

  // UI State
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const price = PLAN_PRICES[plan][billingCycle];

  async function checkEDRPOU() {
    if (edrpou.length !== 8) {
      setEdrpouError('ЄДРПОУ має містити 8 цифр');
      return;
    }

    setEdrpouLoading(true);
    setEdrpouError('');
    setEdrpouData(null);

    try {
      const { data, error } = await supabase.functions.invoke('opendatabot-lookup', {
        body: { edrpou },
      });

      if (error) throw error;

      if (data?.error) {
        setEdrpouError(data.error);
      } else {
        setEdrpouData(data);
        setAdminName(data.shortName || data.name);
      }
    } catch (err) {
      // Mock data for demo if API not configured
      setEdrpouData({
        name: `ОСББ "БУДИНОК-${edrpou.slice(-4)}"`,
        shortName: `ОСББ "${edrpou.slice(-4)}"`,
        address: 'м. Київ, вул. Центральна, 1',
        edrpou: edrpou,
        status: 'зареєстровано',
      });
      setAdminName(`ОСББ "${edrpou.slice(-4)}"`);
    } finally {
      setEdrpouLoading(false);
    }
  }

  async function handleRegister() {
    setLoading(true);
    setError('');

    try {
      // 1. Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: adminEmail,
        password: adminPassword,
        options: {
          data: {
            full_name: adminName,
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Не вдалося створити користувача');

      // 2. Create tenant
      const slug = edrpou.toLowerCase();
      const { data: tenantData, error: tenantError } = await supabase
        .from('tenants')
        .insert({
          name: edrpouData?.name || `ОСББ ${edrpou}`,
          slug,
          city: 'Київ',
          address: edrpouData?.address || '',
          edrpou,
          legal_name: edrpouData?.name,
          contact_email: adminEmail,
          contact_phone: adminPhone,
          apartments_count: 0,
          residents_count: 0,
          status: 'trial',
        })
        .select()
        .single();

      if (tenantError) throw tenantError;

      // 3. Update profile with tenant_id and role
      await supabase
        .from('profiles')
        .update({
          tenant_id: tenantData.id,
          role: 'admin',
          full_name: adminName,
          phone: adminPhone,
        })
        .eq('id', authData.user.id);

      // 4. Create subscription
      const trialEnd = new Date();
      trialEnd.setDate(trialEnd.getDate() + 14);

      await supabase.from('subscriptions').insert({
        tenant_id: tenantData.id,
        plan,
        status: 'trial',
        price_per_month: PLAN_PRICES[plan].monthly,
        trial_ends_at: trialEnd.toISOString(),
      });

      // 5. Create payment record
      const invoiceNumber = `INV-${Date.now().toString(36).toUpperCase()}`;

      await supabase.from('payments').insert({
        tenant_id: tenantData.id,
        amount: price,
        currency: 'UAH',
        status: 'pending',
        payment_method: paymentMethod,
        invoice_number: invoiceNumber,
        description: `Підписка ${plan} (${billingCycle === 'yearly' ? 'річна' : 'місячна'})`,
      });

      // 6. Process payment
      if (paymentMethod === 'card') {
        // Redirect to Monobank payment
        const { data: paymentData } = await supabase.functions.invoke('mono-create-payment', {
          body: {
            tenantId: tenantData.id,
            amount: price,
            invoiceNumber,
            redirectUrl: `${window.location.origin}/admin/dashboard`,
          },
        });

        if (paymentData?.pageUrl) {
          window.location.href = paymentData.pageUrl;
          return;
        }
      }

      // IBAN payment -> show invoice
      navigate(`/invoice/${invoiceNumber}`);
    } catch (err) {
      console.error('Registration error:', err);
      setError(err instanceof Error ? err.message : 'Помилка реєстрації');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50 to-cyan-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-600 hover:text-slate-800">
              <ArrowLeft className="w-5 h-5" />
              Назад
            </button>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-lg flex items-center justify-center">
                <Building2 className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-slate-800">Реєстрація ОСББ</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress */}
        <div className="flex items-center justify-center mb-8">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-medium ${
                s < step
                  ? 'bg-teal-500 text-white'
                  : s === step
                  ? 'bg-gradient-to-br from-teal-500 to-cyan-600 text-white shadow-lg'
                  : 'bg-slate-200 text-slate-500'
              }`}>
                {s < step ? <Check className="w-5 h-5" /> : s}
              </div>
              {s < 4 && <div className={`w-16 h-1 mx-2 rounded ${s < step ? 'bg-teal-500' : 'bg-slate-200'}`} />}
            </div>
          ))}
        </div>

        {/* Step 1: EDRPOU */}
        {step === 1 && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center">
                <Search className="w-6 h-6 text-teal-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800">ЄДРПОУ ОСББ</h2>
                <p className="text-sm text-slate-500">Ми автоматично заповнимо дані з реєстру</p>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Код ЄДРПОУ (8 цифр)
              </label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={edrpou}
                  onChange={(e) => setEdrpou(e.target.value.replace(/\D/g, '').slice(0, 8))}
                  placeholder="12345678"
                  className="flex-1 px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-lg tracking-wider"
                />
                <button
                  onClick={checkEDRPOU}
                  disabled={edrpou.length !== 8 || edrpouLoading}
                  className="px-6 py-3 bg-teal-500 text-white rounded-xl hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  {edrpouLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                  Знайти
                </button>
              </div>
              {edrpouError && (
                <p className="text-sm text-red-500 mt-2 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {edrpouError}
                </p>
              )}
            </div>

            {edrpouData && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-green-800">{edrpouData.name}</p>
                    <p className="text-sm text-green-600">{edrpouData.address}</p>
                    <p className="text-xs text-green-500 mt-1">Статус: {edrpouData.status}</p>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={() => setStep(2)}
              disabled={!edrpouData}
              className="w-full py-3 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-xl hover:from-teal-600 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
            >
              Продовжити
            </button>
          </div>
        )}

        {/* Step 2: Admin Details */}
        {step === 2 && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-teal-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800">Адміністратор ОСББ</h2>
                <p className="text-sm text-slate-500">Цей користувач зможете керувати платформою</p>
              </div>
            </div>

            <div className="grid gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                <input
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="admin@osbb.com"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Пароль</label>
                <input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Мінімум 8 символів"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">ПІБ голови ОСББ</label>
                <input
                  type="text"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  placeholder="Іванов Іван Іванович"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Телефон</label>
                <input
                  type="tel"
                  value={adminPhone}
                  onChange={(e) => setAdminPhone(e.target.value)}
                  placeholder="+380 50 123 4567"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setStep(1)}
                className="flex-1 py-3 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors"
              >
                Назад
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!adminEmail || !adminPassword || adminPassword.length < 8}
                className="flex-1 py-3 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-xl hover:from-teal-600 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
              >
                Продовжити
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Subscription */}
        {step === 3 && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center">
                <Building2 className="w-6 h-6 text-teal-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800">План підписки</h2>
                <p className="text-sm text-slate-500">Оберіть план, що підходить вашому ОСББ</p>
              </div>
            </div>

            {/* Billing Toggle */}
            <div className="flex gap-3 mb-6">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`flex-1 py-2 rounded-lg font-medium ${
                  billingCycle === 'monthly'
                    ? 'bg-teal-500 text-white'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                Щомісяця
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`flex-1 py-2 rounded-lg font-medium flex items-center justify-center gap-2 ${
                  billingCycle === 'yearly'
                    ? 'bg-teal-500 text-white'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                Щорічно
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">-17%</span>
              </button>
            </div>

            {/* Plans */}
            <div className="grid gap-4">
              {(['basic', 'pro', 'enterprise'] as SubscriptionPlan[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPlan(p)}
                  className={`p-4 rounded-xl text-left transition-all ${
                    plan === p
                      ? 'bg-gradient-to-r from-teal-500 to-cyan-600 text-white'
                      : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">
                        {p === 'basic' && 'Базовий'}
                        {p === 'pro' && 'Професійний'}
                        {p === 'enterprise' && 'Корпоративний'}
                      </p>
                      <p className="text-sm opacity-80">{PLAN_FEATURES[p][0]}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">{PLAN_PRICES[p][billingCycle].toLocaleString()}</p>
                      <p className="text-sm opacity-80">грн / {billingCycle === 'yearly' ? 'рік' : 'міс'}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setStep(2)}
                className="flex-1 py-3 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors"
              >
                Назад
              </button>
              <button
                onClick={() => setStep(4)}
                className="flex-1 py-3 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-xl hover:from-teal-600 hover:to-cyan-700 transition-all shadow-lg"
              >
                Продовжити
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Payment */}
        {step === 4 && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-teal-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800">Оплата</h2>
                <p className="text-sm text-slate-500">Оберіть зручний спосіб оплати</p>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="grid gap-4 mb-6">
              <button
                onClick={() => setPaymentMethod('card')}
                className={`p-4 rounded-xl text-left transition-all flex items-center gap-4 ${
                  paymentMethod === 'card'
                    ? 'bg-gradient-to-r from-teal-500 to-cyan-600 text-white'
                    : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                }`}
              >
                <CreditCard className="w-6 h-6" />
                <div>
                  <p className="font-semibold">Карткою онлайн</p>
                  <p className="text-sm opacity-80">Visa, Mastercard через Monobank</p>
                </div>
              </button>

              <button
                onClick={() => setPaymentMethod('iban')}
                className={`p-4 rounded-xl text-left transition-all flex items-center gap-4 ${
                  paymentMethod === 'iban'
                    ? 'bg-gradient-to-r from-teal-500 to-cyan-600 text-white'
                    : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                }`}
              >
                <FileText className="w-6 h-6" />
                <div>
                  <p className="font-semibold">Рахунок на оплату</p>
                  <p className="text-sm opacity-80">Оплата з IBAN через банк ОСББ</p>
                </div>
              </button>
            </div>

            {/* Summary */}
            <div className="bg-slate-50 rounded-xl p-4 mb-6">
              <h3 className="font-semibold text-slate-800 mb-3">Підсумок</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">ОСББ</span>
                  <span className="text-slate-800">{edrpouData?.shortName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">ЄДРПОУ</span>
                  <span className="text-slate-800">{edrpou}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">План</span>
                  <span className="text-slate-800">
                    {plan === 'basic' && 'Базовий'}
                    {plan === 'pro' && 'Професійний'}
                    {plan === 'enterprise' && 'Корпоративний'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Період</span>
                  <span className="text-slate-800">{billingCycle === 'yearly' ? '1 рік' : '1 місяць'}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-200">
                  <span className="font-semibold text-slate-800">До сплати</span>
                  <span className="font-bold text-xl text-teal-600">{price.toLocaleString()} грн</span>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-red-600 text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setStep(3)}
                disabled={loading}
                className="flex-1 py-3 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                Назад
              </button>
              <button
                onClick={handleRegister}
                disabled={loading}
                className="flex-1 py-3 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-xl hover:from-teal-600 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Реєстрація...
                  </>
                ) : (
                  'Зареєструвати та оплатити'
                )}
              </button>
            </div>

            <p className="text-xs text-slate-500 text-center mt-4">
              14 днів безкоштовного тріалу. Якщо оплата не надійде — доступ буде обмежено після тріалу.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
