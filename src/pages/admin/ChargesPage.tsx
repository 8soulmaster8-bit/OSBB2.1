import { useState, useEffect } from 'react';
import { Calculator, FileText, Download, Plus } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

export function ChargesPage() {
  const { profile } = useAuth();
  const [apartments, setApartments] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));

  // Tariffs (simplified - could be stored in DB)
  const [tariffs, setTariffs] = useState({
    water: 45.50,
    electricity: 4.32,
    gas: 12.80,
    heating: 38.00,
    maintenance: 15.00,
    garbage: 25.00,
  });

  useEffect(() => {
    loadApartments();
  }, []);

  async function loadApartments() {
    if (!profile?.tenant_id) return;
    setLoading(true);
    try {
      const { data } = await supabase
        .from('profiles')
        .select('apartment')
        .eq('tenant_id', profile.tenant_id)
        .not('apartment', 'is', null);
      const apts = [...new Set(data?.map(p => p.apartment) || [])].sort();
      setApartments(apts);
    } finally {
      setLoading(false);
    }
  }

  async function generateCharges() {
    if (!profile?.tenant_id) return;
    setLoading(true);
    try {
      for (const apartment of apartments) {
        // Get latest meter readings
        const { data: readings } = await supabase
          .from('meter_readings')
          .select('*')
          .eq('tenant_id', profile.tenant_id)
          .eq('apartment', apartment)
          .order('reading_date', { ascending: false })
          .limit(4);

        const waterReading = readings?.find(r => r.meter_type === 'water');
        const elecReading = readings?.find(r => r.meter_type === 'electricity');
        const gasReading = readings?.find(r => r.meter_type === 'gas');
        const heatingReading = readings?.find(r => r.meter_type === 'heating');

        const waterUsage = waterReading ? waterReading.value - (waterReading.previous_value || 0) : 0;
        const elecUsage = elecReading ? elecReading.value - (elecReading.previous_value || 0) : 0;
        const gasUsage = gasReading ? gasReading.value - (gasReading.previous_value || 0) : 0;
        const heatingUsage = heatingReading ? heatingReading.value - (heatingReading.previous_value || 0) : 0;

        const charges = {
          water: waterUsage * tariffs.water,
          electricity: elecUsage * tariffs.electricity,
          gas: gasUsage * tariffs.gas,
          heating: heatingUsage * tariffs.heating,
          maintenance: tariffs.maintenance,
          garbage: tariffs.garbage,
        };

        const total = Object.values(charges).reduce((a, b) => a + b, 0);

        // Check if charge already exists
        const { data: existing } = await supabase
          .from('charges')
          .select('id')
          .eq('tenant_id', profile.tenant_id)
          .eq('apartment', apartment)
          .eq('period', month)
          .maybeSingle();

        if (existing) {
          await supabase
            .from('charges')
            .update({
              water_amount: charges.water,
              electricity_amount: charges.electricity,
              gas_amount: charges.gas,
              heating_amount: charges.heating,
              maintenance_amount: charges.maintenance,
              garbage_amount: charges.garbage,
              total_amount: total,
            })
            .eq('id', existing.id);
        } else {
          await supabase.from('charges').insert({
            tenant_id: profile.tenant_id,
            apartment,
            period: month,
            water_amount: charges.water,
            electricity_amount: charges.electricity,
            gas_amount: charges.gas,
            heating_amount: charges.heating,
            maintenance_amount: charges.maintenance,
            garbage_amount: charges.garbage,
            total_amount: total,
          });
        }
      }
      alert('Нарахування згенеровано!');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50 to-teal-50">
      <header className="bg-white/80 backdrop-blur-lg border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <a href="/admin/dashboard" className="text-slate-600 hover:text-slate-800">← Назад</a>
              <h1 className="text-xl font-bold text-slate-800">Нарахування</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">Період</label>
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="lg:col-span-2 flex items-end">
            <button
              onClick={generateCharges}
              disabled={loading || apartments.length === 0}
              className="px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-xl hover:from-teal-600 hover:to-cyan-700 disabled:opacity-50 flex items-center gap-2"
            >
              <Calculator className="w-5 h-5" />
              Згенерувати нарахування
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 mb-8">
          <h3 className="font-semibold text-slate-800 mb-4">Тарифи</h3>
          <div className="grid sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {Object.entries(tariffs).map(([key, value]) => (
              <div key={key}>
                <label className="block text-xs text-slate-500 mb-1">
                  {key === 'water' && 'Вода (м³)'}
                  {key === 'electricity' && 'Електрика (кВт)'}
                  {key === 'gas' && 'Газ (м³)'}
                  {key === 'heating' && 'Опалення'}
                  {key === 'maintenance' && 'Утримання'}
                  {key === 'garbage' && 'Сміття'}
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={value}
                  onChange={(e) => setTariffs(prev => ({ ...prev, [key]: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            ))}
          </div>
        </div>

        <a
          href="/admin/invoices"
          className="inline-flex items-center gap-2 px-6 py-3 bg-slate-700 text-white rounded-xl hover:bg-slate-800"
        >
          <FileText className="w-5 h-5" />
          Переглянути квитанції
        </a>
      </main>
    </div>
  );
}
