export type TenantStatus = 'trial' | 'active' | 'past_due' | 'suspended';
export type SubscriptionPlan = 'basic' | 'pro' | 'enterprise';
export type SubscriptionStatus = 'trial' | 'active' | 'past_due' | 'canceled' | 'unpaid';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  city: string;
  address?: string;
  contact_email?: string;
  contact_phone?: string;
  apartments_count: number;
  residents_count: number;
  status: TenantStatus;
  edrpou?: string;
  legal_name?: string;
  iban?: string;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  tenant_id: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  price_per_month: number;
  trial_ends_at?: string;
  current_period_start?: string;
  current_period_end?: string;
  created_at: string;
}

export interface Payment {
  id: string;
  tenant_id: string;
  subscription_id?: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  payment_method?: string;
  mono_payment_id?: string;
  invoice_number?: string;
  description?: string;
  paid_at?: string;
  created_at: string;
}

export interface Profile {
  id: string;
  user_id: string;
  tenant_id?: string;
  email: string;
  full_name?: string;
  role: 'admin' | 'user';
  is_super_admin: boolean;
  phone?: string;
  apartment?: string;
  created_at: string;
}

export const PLAN_PRICES: Record<SubscriptionPlan, { monthly: number; yearly: number }> = {
  basic: { monthly: 500, yearly: 5000 },
  pro: { monthly: 1500, yearly: 15000 },
  enterprise: { monthly: 3000, yearly: 30000 },
};

export const PLAN_FEATURES: Record<SubscriptionPlan, string[]> = {
  basic: [
    'До 50 квартир',
    'Облік жителів',
    'Нарахування комунальних',
    'Генерація квитанцій PDF',
    'Email підтримка',
  ],
  pro: [
    'До 200 квартир',
    'Всі функції Basic',
    'Мобільний додаток',
    'Інтеграція банківських API',
    'Автоматичні нарахування',
    'Пріоритетна підтримка',
  ],
  enterprise: [
    'Необмежена кількість квартир',
    'Всі функції Pro',
    'Персональний менеджер',
    'Індивідуальна інтеграція',
    'SLA 99.9%',
    'Тренінг персоналу',
  ],
};
