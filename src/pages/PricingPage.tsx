import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Building2, Users, Zap, Settings, ArrowRight } from 'lucide-react';
import { PLAN_PRICES, PLAN_FEATURES, type SubscriptionPlan } from '../types/database';

export function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const navigate = useNavigate();

  const plans: { id: SubscriptionPlan; name: string; icon: React.ReactNode; popular?: boolean }[] = [
    { id: 'basic', name: 'Базовий', icon: <Building2 className="w-6 h-6" /> },
    { id: 'pro', name: 'Професійний', icon: <Users className="w-6 h-6" />, popular: true },
    { id: 'enterprise', name: 'Корпоративний', icon: <Zap className="w-6 h-6" /> },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50 to-cyan-50">
      <header className="bg-white/80 backdrop-blur-lg border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg shadow-teal-500/25">
                <Settings className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800">OSBB Platform</h1>
                <p className="text-xs text-slate-500">Управління ОСББ нового покоління</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/login')}
              className="px-4 py-2 text-sm font-medium text-teal-600 hover:text-teal-700"
            >
              Увійти
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-slate-800 mb-4">
            Оберіть план для вашого ОСББ
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Просте та прозоре управління будинком. Автоматичні нарахування, генерація квитанцій,
            інтеграція з банками — все в одному місці.
          </p>
        </div>

        <div className="flex items-center justify-center gap-4 mb-12">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              billingCycle === 'monthly'
                ? 'bg-teal-500 text-white'
                : 'bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            Щомісяця
          </button>
          <button
            onClick={() => setBillingCycle('yearly')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              billingCycle === 'yearly'
                ? 'bg-teal-500 text-white'
                : 'bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            Щорічно
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
              -17%
            </span>
          </button>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {plans.map((plan) => {
            const price = PLAN_PRICES[plan.id][billingCycle];
            const features = PLAN_FEATURES[plan.id];

            return (
              <button
                key={plan.id}
                onClick={() => setSelectedPlan(plan.id)}
                className={`relative p-6 rounded-2xl text-left transition-all ${
                  selectedPlan === plan.id
                    ? 'bg-gradient-to-br from-teal-500 to-cyan-600 text-white shadow-xl shadow-teal-500/25 scale-105'
                    : plan.popular
                    ? 'bg-white border-2 border-teal-500 text-slate-800 shadow-lg'
                    : 'bg-white border border-slate-200 text-slate-800 hover:border-teal-300 hover:shadow-md'
                }`}
              >
                {plan.popular && selectedPlan !== plan.id && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-teal-500 to-cyan-600 text-white text-xs font-medium rounded-full">
                    Популярний
                  </div>
                )}

                <div className={`${selectedPlan === plan.id ? 'text-white' : 'text-teal-600'} mb-4`}>
                  {plan.icon}
                </div>

                <h3 className="text-xl font-bold mb-2">{plan.name}</h3>

                <div className="mb-6">
                  <span className="text-4xl font-bold">{price.toLocaleString()}</span>
                  <span className="text-sm opacity-80">
                    {' '}
                    грн / {billingCycle === 'yearly' ? 'рік' : 'міс'}
                  </span>
                </div>

                <ul className="space-y-3">
                  {features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Check className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                        selectedPlan === plan.id ? 'text-white' : 'text-teal-500'
                      }`} />
                      {feature}
                    </li>
                  ))}
                </ul>

                {selectedPlan === plan.id && (
                  <div className="mt-4 pt-4 border-t border-white/20">
                    <span className="text-sm opacity-80">Обрано</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <div className="text-center">
          <button
            disabled={!selectedPlan}
            onClick={() => navigate(`/register?plan=${selectedPlan}&billing=${billingCycle}`)}
            className="px-8 py-4 bg-gradient-to-r from-teal-500 to-cyan-600 text-white font-medium rounded-xl hover:from-teal-600 hover:to-cyan-700 transition-all shadow-lg shadow-teal-500/25 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
          >
            Зареєструвати ОСББ
            <ArrowRight className="w-5 h-5" />
          </button>
          <p className="text-sm text-slate-500 mt-4">
            Безкоштовний тріал 14 днів. Кредитна картка не потрібна.
          </p>
        </div>
      </main>
    </div>
  );
}
