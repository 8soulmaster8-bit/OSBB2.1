import { useState, useEffect } from 'react';
import { Plus, Search, MoveVertical as MoreVertical, LocationEdit as Edit, Trash2, User, Phone, Mail, Chrome as Home } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

interface Resident {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  apartment: string | null;
  role: string;
}

export function ResidentsPage() {
  const { profile } = useAuth();
  const [residents, setResidents] = useState<Resident[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingResident, setEditingResident] = useState<Resident | null>(null);

  useEffect(() => {
    loadResidents();
  }, []);

  async function loadResidents() {
    if (!profile?.tenant_id) return;
    setLoading(true);
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('tenant_id', profile.tenant_id)
        .order('apartment');
      setResidents(data || []);
    } finally {
      setLoading(false);
    }
  }

  const filteredResidents = residents.filter(r =>
    r.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.apartment?.includes(searchQuery)
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50 to-teal-50">
      <header className="bg-white/80 backdrop-blur-lg border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <a href="/admin/dashboard" className="text-slate-600 hover:text-slate-800">← Назад</a>
              <h1 className="text-xl font-bold text-slate-800">Жителі</h1>
            </div>
            <button
              onClick={() => { setEditingResident(null); setShowModal(true); }}
              className="px-4 py-2 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-lg hover:from-teal-600 hover:to-cyan-700 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Додати жителя
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Пошук за ПІБ або квартирою..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Квартира</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">ПІБ</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Email</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Телефон</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Роль</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filteredResidents.map((resident) => (
                  <tr key={resident.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-teal-100 text-teal-700 rounded text-sm font-medium">
                        {resident.apartment || '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-800">{resident.full_name || '-'}</td>
                    <td className="px-4 py-3 text-slate-600">{resident.email}</td>
                    <td className="px-4 py-3 text-slate-600">{resident.phone || '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs ${
                        resident.role === 'admin' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {resident.role === 'admin' ? 'Адмін' : 'Житель'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => { setEditingResident(resident); setShowModal(true); }}
                          className="p-2 text-slate-400 hover:text-teal-600"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {showModal && (
        <ResidentModal
          resident={editingResident}
          tenantId={profile?.tenant_id}
          onClose={() => setShowModal(false)}
          onSave={loadResidents}
        />
      )}
    </div>
  );
}

function ResidentModal({ resident, tenantId, onClose, onSave }: {
  resident: Resident | null;
  tenantId: string | undefined;
  onClose: () => void;
  onSave: () => void;
}) {
  const [fullName, setFullName] = useState(resident?.full_name || '');
  const [email, setEmail] = useState(resident?.email || '');
  const [phone, setPhone] = useState(resident?.phone || '');
  const [apartment, setApartment] = useState(resident?.apartment || '');
  const [role, setRole] = useState(resident?.role || 'user');
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    if (!tenantId) return;
    setLoading(true);
    try {
      if (resident) {
        await supabase
          .from('profiles')
          .update({ full_name: fullName, phone, apartment, role })
          .eq('id', resident.id);
      } else {
        await supabase
          .from('profiles')
          .insert({
            full_name: fullName,
            email,
            phone,
            apartment,
            role,
            tenant_id: tenantId,
            user_id: crypto.randomUUID(),
          });
      }
      onSave();
      onClose();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
        <h2 className="text-xl font-bold text-slate-800 mb-6">
          {resident ? 'Редагувати жителя' : 'Додати жителя'}
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">ПІБ</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={!!resident}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-slate-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Телефон</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Квартира</label>
            <input
              type="text"
              value={apartment}
              onChange={(e) => setApartment(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Роль</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="user">Житель</option>
              <option value="admin">Адмін</option>
            </select>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-3 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50"
          >
            Скасувати
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex-1 py-3 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-xl hover:from-teal-600 hover:to-cyan-700 disabled:opacity-50"
          >
            Зберегти
          </button>
        </div>
      </div>
    </div>
  );
}
