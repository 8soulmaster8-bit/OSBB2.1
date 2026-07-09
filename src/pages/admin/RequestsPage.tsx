import { useState, useEffect } from 'react';
import { Plus, Wrench, Clock, CircleCheck as CheckCircle, Circle as XCircle, CircleAlert as AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

interface MaintenanceRequest {
  id: string;
  apartment: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'rejected';
  priority: 'low' | 'medium' | 'high';
  created_at: string;
}

export function RequestsPage() {
  const { profile } = useAuth();
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | MaintenanceRequest['status']>('all');

  useEffect(() => {
    loadRequests();
  }, []);

  async function loadRequests() {
    if (!profile?.tenant_id) return;
    setLoading(true);
    try {
      const { data } = await supabase
        .from('maintenance_requests')
        .select('*')
        .eq('tenant_id', profile.tenant_id)
        .order('created_at', { ascending: false });
      setRequests(data || []);
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(id: string, status: MaintenanceRequest['status']) {
    await supabase
      .from('maintenance_requests')
      .update({ status })
      .eq('id', id);
    loadRequests();
  }

  const filteredRequests = filter === 'all'
    ? requests
    : requests.filter(r => r.status === filter);

  const statusConfig: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
    pending: { icon: <Clock className="w-4 h-4" />, color: 'bg-yellow-100 text-yellow-700', label: 'Очікує' },
    in_progress: { icon: <AlertCircle className="w-4 h-4" />, color: 'bg-blue-100 text-blue-700', label: 'В роботі' },
    completed: { icon: <CheckCircle className="w-4 h-4" />, color: 'bg-green-100 text-green-700', label: 'Виконано' },
    rejected: { icon: <XCircle className="w-4 h-4" />, color: 'bg-red-100 text-red-700', label: 'Відхилено' },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50 to-teal-50">
      <header className="bg-white/80 backdrop-blur-lg border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <a href="/admin/dashboard" className="text-slate-600 hover:text-slate-800">← Назад</a>
              <h1 className="text-xl font-bold text-slate-800">Заявки</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg ${filter === 'all' ? 'bg-teal-500 text-white' : 'bg-white text-slate-600'}`}
          >
            Всі ({requests.length})
          </button>
          {Object.entries(statusConfig).map(([key, config]) => {
            const count = requests.filter(r => r.status === key).length;
            return (
              <button
                key={key}
                onClick={() => setFilter(key as MaintenanceRequest['status'])}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                  filter === key ? 'bg-teal-500 text-white' : 'bg-white text-slate-600'
                }`}
              >
                {config.icon}
                {config.label} ({count})
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
            <Wrench className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">Немає заявок</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRequests.map((request) => {
              const config = statusConfig[request.status];
              const priorityColors = {
                low: 'border-l-green-500',
                medium: 'border-l-yellow-500',
                high: 'border-l-red-500',
              };

              return (
                <div
                  key={request.id}
                  className={`bg-white rounded-xl border border-slate-200 border-l-4 ${priorityColors[request.priority]} p-4`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-sm">
                          кв. {request.apartment}
                        </span>
                        <span className={`px-2 py-1 rounded text-sm flex items-center gap-1 ${config.color}`}>
                          {config.icon}
                          {config.label}
                        </span>
                      </div>
                      <h3 className="font-semibold text-slate-800 mb-1">{request.title}</h3>
                      <p className="text-sm text-slate-600">{request.description}</p>
                      <p className="text-xs text-slate-400 mt-2">
                        {new Date(request.created_at).toLocaleString('uk-UA')}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <select
                        value={request.status}
                        onChange={(e) => updateStatus(request.id, e.target.value as MaintenanceRequest['status'])}
                        className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                      >
                        <option value="pending">Очікує</option>
                        <option value="in_progress">В роботі</option>
                        <option value="completed">Виконано</option>
                        <option value="rejected">Відхилено</option>
                      </select>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
