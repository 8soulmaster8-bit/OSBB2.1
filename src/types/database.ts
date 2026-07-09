export interface Profile {
  id: string;
  full_name: string;
  apartment_number: string;
  phone: string | null;
  role: 'user' | 'admin';
  square_meters: number;
  created_at: string;
  tenant_id: string | null;
  is_super_admin: boolean;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  city: string;
  address: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  status: 'trial' | 'active' | 'past_due' | 'suspended';
  apartments_count: number;
  residents_count: number;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  tenant_id: string;
  plan: 'basic' | 'pro' | 'enterprise';
  status: 'trial' | 'active' | 'past_due' | 'canceled' | 'unpaid';
  price_per_month: number;
  current_period_start: string | null;
  current_period_end: string | null;
  trial_ends_at: string | null;
  canceled_at: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  tenant_id: string;
  subscription_id: string | null;
  amount: number;
  currency: string;
  status: 'pending' | 'paid' | 'failed' | 'refunded';
  description: string | null;
  paid_at: string | null;
  stripe_invoice_id: string | null;
  stripe_payment_intent_id: string | null;
  created_at: string;
}

export interface Meter {
  id: string;
  user_id: string;
  tenant_id: string | null;
  type: 'water' | 'hot_water' | 'cold_water' | 'electricity' | 'gas';
  current_reading: number;
  reading_date: string;
  created_at: string;
  profiles?: Profile;
}

export interface MeterReading {
  id: string;
  meter_id: string;
  reading: number;
  reading_date: string;
  submitted_at: string;
  meters?: Meter;
}

export interface Bill {
  id: string;
  user_id: string;
  tenant_id: string | null;
  month: string;
  amount: number;
  status: 'paid' | 'unpaid';
  created_at: string;
  profiles?: Profile;
}

export interface MaintenanceRequest {
  id: string;
  user_id: string;
  tenant_id: string | null;
  topic: string;
  description: string | null;
  status: 'new' | 'in_progress' | 'completed';
  master: string | null;
  created_at: string;
  profiles?: Profile;
}

export type RequestStatus = 'new' | 'in_progress' | 'completed';

export const REQUEST_STATUS_LABELS: Record<RequestStatus, string> = {
  new: 'В обработке',
  in_progress: 'Мастер назначен',
  completed: 'Выполнено',
};

export type TenantStatus = 'trial' | 'active' | 'past_due' | 'suspended';

export const TENANT_STATUS_LABELS: Record<TenantStatus, string> = {
  trial: 'Триал',
  active: 'Активен',
  past_due: 'Просрочен',
  suspended: 'Заблокирован',
};

export type SubscriptionPlan = 'basic' | 'pro' | 'enterprise';

export const SUBSCRIPTION_PLAN_LABELS: Record<SubscriptionPlan, string> = {
  basic: 'Базовый',
  pro: 'Профессиональный',
  enterprise: 'Корпоративный',
};
