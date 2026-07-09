import { useState, useEffect } from 'react';
import { Building2, Plus, Search, MoreVertical, Users, Home, CreditCard, Settings, Check, X, CreditCard as Edit, Trash2, Eye } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { UserMenu } from '../components/UserMenu';
import type { Tenant, Subscription, Profile, Payment, TenantStatus, SubscriptionPlan } from '../types/database';

export function SuperAdminDashboard() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'tenants' | 'payments' | 'admins'>('tenants');
  const [tenants, setTenants] = useState<(Tenant & { subscription?: Subscription; admin?: Profile })[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showTenantModal, setShowTenantModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      // Load tenants with subscriptions and admin
      const { data: tenantsData } = await supabase
        .from('tenants')
        .select(`
          *,
          subscriptions (*)
        `)
        .order('created_at', { ascending: false });

      if (tenantsData) {
        // Get admin profiles for each tenant
        const tenantsWithAdmin = await Promise.all(
          tenantsData.map(async (tenant) => {
            const { data: adminProfile } = await supabase
              .from('profiles')
              .select('*')
              .eq('tenant_id', tenant.id)
              .eq('role', 'admin')
              .maybeSingle();

            return {
              ...tenant,
              subscription: tenant.subscriptions?.[0],
              admin: adminProfile,
            };
          })
        );
        setTenants(tenantsWithAdmin);
      }

      // Load payments
      const { data: paymentsData } = await supabase
        .from('payments')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      setPayments(paymentsData || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredTenants = tenants.filter((t) =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    totalTenants: tenants.length,
    activeTenants: tenants.filter((t) => t.status === 'active').length,
    trialTenants: tenants.filter((t) => t.status === 'trial').length,
    suspendedTenants: tenants.filter((t) => t.status === 'suspended').length,
    totalRevenue: payments.filter((p) => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0),
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <header className="bg-slate-800/80 backdrop-blur-lg border-b border-slate-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                <Settings className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">OSBB Platform</h1>
                <p className="text-xs text-slate-400">Панель супер-адміна</p>
              </div>
            </div>

            <UserMenu />
          </div>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <StatCard label="ОСББ" value={stats.totalTenants} icon={<Building2 className="w-5 h-5" />} color="blue" />
          <StatCard label="Активних" value={stats.activeTenants} icon={<Check className="w-5 h-5" />} color="green" />
          <StatCard label="Тріал" value={stats.trialTenants} icon={<Home className="w-5 h-5" />} color="yellow" />
          <StatCard label="Заблоковано" value={stats.suspendedTenants} icon={<X className="w-5 h-5" />} color="red" />
          <StatCard label="Дохід" value={`${stats.totalRevenue.toLocaleString()} грн`} icon={<CreditCard className="w-5 h-5" />} color="purple" />
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <TabButton active={activeTab === 'tenants'} onClick={() => setActiveTab('tenants')}>
            <Building2 className="w-4 h-4" />
            ОСББ
          </TabButton>
          <TabButton active={activeTab === 'payments'} onClick={() => setActiveTab('payments')}>
            <CreditCard className="w-4 h-4" />
            Платежі
          </TabButton>
        </div>

        {/* Search and Actions */}
        {activeTab === 'tenants' && (
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Пошук ОСББ за назвою, містом або slug..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <button
              onClick={() => {
                setSelectedTenant(null);
                setShowTenantModal(true);
              }}
              className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-medium rounded-xl hover:from-amber-600 hover:to-orange-700 transition-all shadow-lg flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Додати ОСББ
            </button>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="text-center py-12">
            <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-400">Завантаження...</p>
          </div>
        ) : activeTab === 'tenants' ? (
          <div className="grid gap-4">
            {filteredTenants.map((tenant) => (
              <TenantCard
                key={tenant.id}
                tenant={tenant}
                onEdit={() => {
                  setSelectedTenant(tenant);
                  setShowTenantModal(true);
                }}
                onManageSubscription={() => {
                  setSelectedTenant(tenant);
                  setShowSubscriptionModal(true);
                }}
                onDelete={() => {
                  setSelectedTenant(tenant);
                  setShowDeleteModal(true);
                }}
              />
            ))}
            {filteredTenants.length === 0 && (
              <div className="text-center py-12 bg-slate-800/50 rounded-xl border border-slate-700">
                <Building2 className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">ОСББ не знайдено</p>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-700/50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">Дата</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">ОСББ</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">Сума</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">Статус</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">Опис</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {payments.map((payment) => {
                  const tenant = tenants.find((t) => t.id === payment.tenant_id);
                  return (
                    <tr key={payment.id} className="hover:bg-slate-700/30">
                      <td className="px-4 py-3 text-sm text-slate-300">
                        {new Date(payment.created_at).toLocaleDateString('uk-UA')}
                      </td>
                      <td className="px-4 py-3 text-sm text-white">{tenant?.name || '—'}</td>
                      <td className="px-4 py-3 text-sm text-white font-medium">
                        {payment.amount.toLocaleString()} {payment.currency}
                      </td>
                      <td className="px-4 py-3">
                        <PaymentStatusBadge status={payment.status} />
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-400">{payment.description || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {payments.length === 0 && (
              <div className="text-center py-8">
                <CreditCard className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                <p className="text-slate-400">Платежів поки немає</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tenant Modal */}
      {showTenantModal && (
        <TenantModal
          tenant={selectedTenant}
          onClose={() => setShowTenantModal(false)}
          onSave={async () => {
            setShowTenantModal(false);
            await loadData();
          }}
        />
      )}

      {/* Subscription Modal */}
      {showSubscriptionModal && selectedTenant && (
        <SubscriptionModal
          tenant={selectedTenant}
          subscription={selectedTenant.subscription}
          onClose={() => setShowSubscriptionModal(false)}
          onSave={async () => {
            setShowSubscriptionModal(false);
            await loadData();
          }}
        />
      )}

      {/* Delete Modal */}
      {showDeleteModal && selectedTenant && (
        <DeleteModal
          tenant={selectedTenant}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={async () => {
            await supabase.from('tenants').delete().eq('id', selectedTenant.id);
            setShowDeleteModal(false);
            await loadData();
          }}
        />
      )}
    </div>
  );
}

function StatCard({ label, value, icon, color }: { label: string; value: string | number; icon: React.ReactNode; color: string }) {
  const colors: Record<string, string> = {
    blue: 'from-blue-500 to-cyan-600',
    green: 'from-green-500 to-emerald-600',
    yellow: 'from-yellow-500 to-amber-600',
    red: 'from-red-500 to-rose-600',
    purple: 'from-purple-500 to-violet-600',
  };

  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-4">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${colors[color]} flex items-center justify-center text-white`}>
          {icon}
        </div>
        <div>
          <p className="text-2xl font-bold text-white">{value}</p>
          <p className="text-xs text-slate-400">{label}</p>
        </div>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
        active
          ? 'bg-amber-500 text-white'
          : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
      }`}
    >
      {children}
    </button>
  );
}

function TenantCard({
  tenant,
  onEdit,
  onManageSubscription,
  onDelete,
}: {
  tenant: Tenant & { subscription?: Subscription; admin?: Profile };
  onEdit: () => void;
  onManageSubscription: () => void;
  onDelete: () => void;
}) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-4 hover:border-amber-500/50 transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              {tenant.name}
              <TenantStatusBadge status={tenant.status} />
            </h3>
            <p className="text-sm text-slate-400">{tenant.city}</p>
            {tenant.address && <p className="text-xs text-slate-500">{tenant.address}</p>}
            <div className="flex gap-4 mt-2 text-xs text-slate-500">
              <span>Slug: {tenant.slug}</span>
              <span>Кв: {tenant.apartments_count}</span>
              <span>Жителів: {tenant.residents_count}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {tenant.subscription && (
            <div className="text-right">
              <PlanBadge plan={tenant.subscription.plan} />
              <p className="text-xs text-slate-500 mt-1">
                {tenant.subscription.price_per_month} грн/міс
              </p>
            </div>
          )}

          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            {showMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 top-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-20 py-1 min-w-[180px]">
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onEdit();
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-white hover:bg-slate-700 flex items-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    Редагувати
                  </button>
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onManageSubscription();
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-white hover:bg-slate-700 flex items-center gap-2"
                  >
                    <CreditCard className="w-4 h-4" />
                    Підписка
                  </button>
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onDelete();
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-red-500/20 flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Видалити
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {tenant.admin && (
        <div className="mt-4 pt-4 border-t border-slate-700 flex items-center gap-3">
          <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center">
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div>
            <p className="text-sm text-white">{tenant.admin.full_name}</p>
            <p className="text-xs text-slate-500">Адміністратор ОСББ</p>
          </div>
        </div>
      )}
    </div>
  );
}

function TenantStatusBadge({ status }: { status: TenantStatus }) {
  const styles: Record<TenantStatus, string> = {
    trial: 'bg-yellow-500/20 text-yellow-400',
    active: 'bg-green-500/20 text-green-400',
    past_due: 'bg-red-500/20 text-red-400',
    suspended: 'bg-slate-500/20 text-slate-400',
  };

  const labels: Record<TenantStatus, string> = {
    trial: 'Тріал',
    active: 'Активен',
    past_due: 'Прострочено',
    suspended: 'Заблоковано',
  };

  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

function PlanBadge({ plan }: { plan: SubscriptionPlan }) {
  const styles: Record<SubscriptionPlan, string> = {
    basic: 'bg-slate-500/20 text-slate-300',
    pro: 'bg-blue-500/20 text-blue-400',
    enterprise: 'bg-purple-500/20 text-purple-400',
  };

  const labels: Record<SubscriptionPlan, string> = {
    basic: 'Базовий',
    pro: 'Професійний',
    enterprise: 'Корпоративний',
  };

  return (
    <span className={`px-2 py-1 rounded-lg text-xs font-medium ${styles[plan]}`}>
      {labels[plan]}
    </span>
  );
}

function PaymentStatusBadge({ status }: { status: Payment['status'] }) {
  const styles: Record<Payment['status'], string> = {
    pending: 'bg-yellow-500/20 text-yellow-400',
    paid: 'bg-green-500/20 text-green-400',
    failed: 'bg-red-500/20 text-red-400',
    refunded: 'bg-slate-500/20 text-slate-400',
  };

  const labels: Record<Payment['status'], string> = {
    pending: 'Очікує',
    paid: 'Сплачено',
    failed: 'Помилка',
    refunded: 'Повернено',
  };

  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

function TenantModal({
  tenant,
  onClose,
  onSave,
}: {
  tenant: Tenant | null;
  onClose: () => void;
  onSave: () => void;
}) {
  const [name, setName] = useState(tenant?.name || '');
  const [slug, setSlug] = useState(tenant?.slug || '');
  const [city, setCity] = useState(tenant?.city || '');
  const [address, setAddress] = useState(tenant?.address || '');
  const [contactEmail, setContactEmail] = useState(tenant?.contact_email || '');
  const [contactPhone, setContactPhone] = useState(tenant?.contact_phone || '');
  const [apartmentsCount, setApartmentsCount] = useState(tenant?.apartments_count || 0);
  const [residentsCount, setResidentsCount] = useState(tenant?.residents_count || 0);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      if (tenant) {
        await supabase
          .from('tenants')
          .update({
            name,
            slug,
            city,
            address: address || null,
            contact_email: contactEmail || null,
            contact_phone: contactPhone || null,
            apartments_count: apartmentsCount,
            residents_count: residentsCount,
          })
          .eq('id', tenant.id);
      } else {
        const { data: newTenant } = await supabase
          .from('tenants')
          .insert({
            name,
            slug,
            city,
            address: address || null,
            contact_email: contactEmail || null,
            contact_phone: contactPhone || null,
            apartments_count: apartmentsCount,
            residents_count: residentsCount,
            status: 'trial',
          })
          .select()
          .single();

        // Create trial subscription for new tenant
        if (newTenant) {
          const trialEnd = new Date();
          trialEnd.setDate(trialEnd.getDate() + 14);

          await supabase.from('subscriptions').insert({
            tenant_id: newTenant.id,
            plan: 'basic',
            status: 'trial',
            price_per_month: 0,
            trial_ends_at: trialEnd.toISOString(),
          });
        }
      }

      onSave();
    } catch (error) {
      console.error('Error saving tenant:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-slate-800 rounded-2xl border border-slate-700 p-6 w-full max-w-lg">
        <h2 className="text-xl font-bold text-white mb-6">
          {tenant ? 'Редагувати ОСББ' : 'Нове ОСББ'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Назва</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Slug (URL)</label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
              required
              pattern="[a-z0-9-]+"
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Місто</label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              required
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Адреса</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Кількість квартир</label>
              <input
                type="number"
                value={apartmentsCount}
                onChange={(e) => setApartmentsCount(parseInt(e.target.value) || 0)}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Кількість жителів</label>
              <input
                type="number"
                value={residentsCount}
                onChange={(e) => setResidentsCount(parseInt(e.target.value) || 0)}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
            <input
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Телефон</label>
            <input
              type="tel"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
            >
              Скасувати
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-lg hover:from-amber-600 hover:to-orange-700 transition-all disabled:opacity-50"
            >
              {loading ? 'Збереження...' : 'Зберегти'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SubscriptionModal({
  tenant,
  subscription,
  onClose,
  onSave,
}: {
  tenant: Tenant;
  subscription?: Subscription;
  onClose: () => void;
  onSave: () => void;
}) {
  const [plan, setPlan] = useState<SubscriptionPlan>(subscription?.plan || 'basic');
  const [status, setStatus] = useState(subscription?.status || 'trial');
  const [pricePerMonth, setPricePerMonth] = useState(subscription?.price_per_month || 0);
  const [trialEnd, setTrialEnd] = useState(subscription?.trial_ends_at?.split('T')[0] || '');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      if (subscription) {
        await supabase
          .from('subscriptions')
          .update({
            plan,
            status,
            price_per_month: pricePerMonth,
            trial_ends_at: trialEnd ? new Date(trialEnd).toISOString() : null,
          })
          .eq('id', subscription.id);
      } else {
        await supabase.from('subscriptions').insert({
          tenant_id: tenant.id,
          plan,
          status,
          price_per_month: pricePerMonth,
          trial_ends_at: trialEnd ? new Date(trialEnd).toISOString() : null,
        });
      }

      // Update tenant status based on subscription status
      const tenantStatus = status === 'active' ? 'active' : status === 'past_due' ? 'past_due' : tenant.status;
      await supabase.from('tenants').update({ status: tenantStatus }).eq('id', tenant.id);

      onSave();
    } catch (error) {
      console.error('Error saving subscription:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-slate-800 rounded-2xl border border-slate-700 p-6 w-full max-w-md">
        <h2 className="text-xl font-bold text-white mb-2">Підписка: {tenant.name}</h2>
        <p className="text-sm text-slate-400 mb-6">ID: {tenant.id}</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">План</label>
            <div className="grid grid-cols-3 gap-2">
              {(['basic', 'pro', 'enterprise'] as SubscriptionPlan[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPlan(p)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    plan === p
                      ? 'bg-amber-500 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {p === 'basic' && 'Базовий'}
                  {p === 'pro' && 'Професійний'}
                  {p === 'enterprise' && 'Корпоративний'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Статус</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="trial">Тріал</option>
              <option value="active">Активна</option>
              <option value="past_due">Прострочена</option>
              <option value="canceled">Скасована</option>
              <option value="unpaid">Неоплачена</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Ціна за місяць (грн)</label>
            <input
              type="number"
              value={pricePerMonth}
              onChange={(e) => setPricePerMonth(parseFloat(e.target.value) || 0)}
              min="0"
              step="0.01"
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Кінець тріалу</label>
            <input
              type="date"
              value={trialEnd}
              onChange={(e) => setTrialEnd(e.target.value)}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
            >
              Скасувати
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-lg hover:from-amber-600 hover:to-orange-700 transition-all disabled:opacity-50"
            >
              {loading ? 'Збереження...' : 'Зберегти'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DeleteModal({
  tenant,
  onClose,
  onConfirm,
}: {
  tenant: Tenant;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const [loading, setLoading] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-slate-800 rounded-2xl border border-slate-700 p-6 w-full max-w-md">
        <h2 className="text-xl font-bold text-white mb-2">Видалити ОСББ?</h2>
        <p className="text-slate-400 mb-6">
          Ви впевнені, що хочете видалити <strong className="text-white">{tenant.name}</strong>?
          Всі дані будуть видалені без можливості відновлення.
        </p>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
          >
            Скасувати
          </button>
          <button
            onClick={async () => {
              setLoading(true);
              await onConfirm();
              setLoading(false);
            }}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all disabled:opacity-50"
          >
            {loading ? 'Видалення...' : 'Видалити'}
          </button>
        </div>
      </div>
    </div>
  );
}
