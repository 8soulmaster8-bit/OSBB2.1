import { CreditCard, Clock, Lock, Building2 } from 'lucide-react';
import { useTenant } from '../context/TenantContext';
import type { TenantStatus } from '../types/database';

interface BlockedPageProps {
  reason: TenantStatus;
}

const BLOCK_REASONS: Record<TenantStatus, { title: string; description: string; icon: React.ReactNode }> = {
  trial: {
    title: 'Триал период активен',
    description: 'Ваш бесплатный пробный период еще активен. Если вы видите эту страницу, обратитесь к администратору.',
    icon: <Clock className="w-16 h-16 text-yellow-500" />,
  },
  active: {
    title: 'Доступ активен',
    description: 'Если вы видите эту страницу, обратитесь к администратору.',
    icon: <CreditCard className="w-16 h-16 text-green-500" />,
  },
  past_due: {
    title: 'Подписка просрочена',
    description: 'Оплата за использование платформы не поступила. Пожалуйста, свяжитесь с администратором вашего ОСББ для оплаты подписки.',
    icon: <CreditCard className="w-16 h-16 text-red-500" />,
  },
  suspended: {
    title: 'Доступ заблокирован',
    description: 'Администратор платформы заблокировал доступ к этому ОСББ. Обратитесь в службу поддержки для выяснения причин.',
    icon: <Lock className="w-16 h-16 text-gray-500" />,
  },
};

export function BlockedPage({ reason }: BlockedPageProps) {
  const { tenant } = useTenant();
  const blockInfo = BLOCK_REASONS[reason];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="flex justify-center mb-6">
            {blockInfo.icon}
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            {blockInfo.title}
          </h1>

          <p className="text-gray-600 mb-6 leading-relaxed">
            {blockInfo.description}
          </p>

          {tenant && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-center gap-2 text-gray-500 text-sm">
                <Building2 className="w-4 h-4" />
                <span>ОСББ: {tenant.name}</span>
              </div>
              {tenant.city && (
                <div className="text-gray-400 text-sm mt-1">
                  {tenant.city}
                </div>
              )}
            </div>
          )}

          <div className="text-sm text-gray-400">
            Если вы считаете, что это ошибка, обратитесь в службу поддержки
          </div>
        </div>
      </div>
    </div>
  );
}
