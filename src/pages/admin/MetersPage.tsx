import { useState, useEffect } from 'react';
import { Plus, Search, Save, Droplets, Zap, Flame, Thermometer } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

interface Meter {
  id: string;
  apartment: string;
  meter_type: 'water' | 'electricity' | 'gas' | 'heating';
  previous_value: number;
  current_value: number;
  last_reading_date: string;
}

interface MeterReading {
  apartment: string;
  meter_type: string;
  previous_value: number;
  value: string;
}

export function MetersPage() {
  const { profile } = useAuth();
  const [readings, setReadings] = useState<MeterReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    loadMeters();
  }, []);

  async function loadMeters() {
    if (!profile?.tenant_id) return;
    setLoading(true);
    try {
      // Get all apartments with profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('apartment')
        .eq('tenant_id', profile.tenant_id)
        .not('apartment', 'is', null);

      // Get latest meter readings for each apartment
      const apartments = [...new Set(profiles?.map(p => p.apartment) || [])];
      const meterTypes = ['water', 'electricity', 'gas', 'heating'];

      const readingsData: MeterReading[] = [];
      for (const apartment of apartments) {
        for (const meter_type of meterTypes) {
          const { data: lastReading } = await supabase
            .from('meter_readings')
            .select('*')
            .eq('tenant_id', profile.tenant_id)
            .eq('apartment', apartment)
            .eq('meter_type', meter_type)
            .order('reading_date', { ascending: false })
            .limit(1)
            .maybeSingle();

          readingsData.push({
            apartment,
            meter_type,
            previous_value: lastReading?.value || 0,
            value: '',
          });
        }
      }
      setReadings(readingsData);
    } finally {
      setLoading(false);
    }
  }

  async function saveReading(reading: MeterReading) {
    if (!profile?.tenant_id || !reading.value) return;
    const key = `${reading.apartment}-${reading.meter_type}`;
    setSaving(key);
    try {
      const value = parseFloat(reading.value);
      if (isNaN(value) || value < reading.previous_value) {
        alert('Значення має бути більше попереднього');
        return;
      }

      await supabase.from('meter_readings').insert({
        tenant_id: profile.tenant_id,
        apartment: reading.apartment,
        meter_type: reading.meter_type,
        value,
        previous_value: reading.previous_value,
        reading_date: new Date().toISOString(),
      });

      // Update previous value
      setReadings(prev => prev.map(r =>
        r.apartment === reading.apartment && r.meter_type === reading.meter_type
          ? { ...r, previous_value: value, value: '' }
          : r
      ));
    } finally {
      setSaving(null);
    }
  }

  const groupedReadings = readings.reduce((acc, r) => {
    if (!acc[r.apartment]) acc[r.apartment] = [];
    acc[r.apartment].push(r);
    return acc;
  }, {} as Record<string, MeterReading[]>);

  const meterIcons: Record<string, React.ReactNode> = {
    water: <Droplets className="w-4 h-4 text-blue-500" />,
    electricity: <Zap className="w-4 h-4 text-yellow-500" />,
    gas: <Flame className="w-4 h-4 text-orange-500" />,
    heating: <Thermometer className="w-4 h-4 text-red-500" />,
  };

  const meterLabels: Record<string, string> = {
    water: 'Вода',
    electricity: 'Електрика',
    gas: 'Газ',
    heating: 'Опалення',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50 to-teal-50">
      <header className="bg-white/80 backdrop-blur-lg border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <a href="/admin/dashboard" className="text-slate-600 hover:text-slate-800">← Назад</a>
              <h1 className="text-xl font-bold text-slate-800">Показники лічильників</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : (
          <div className="grid gap-6">
            {Object.entries(groupedReadings).map(([apartment, meters]) => (
              <div key={apartment} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="bg-gradient-to-r from-teal-500 to-cyan-600 px-4 py-3">
                  <h3 className="text-lg font-semibold text-white">Квартира {apartment}</h3>
                </div>
                <div className="p-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {meters.map((meter) => (
                    <div key={`${meter.apartment}-${meter.meter_type}`} className="bg-slate-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        {meterIcons[meter.meter_type]}
                        <span className="font-medium text-slate-700">{meterLabels[meter.meter_type]}</span>
                      </div>
                      <p className="text-xs text-slate-500 mb-2">
                        Попередній: {meter.previous_value}
                      </p>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          placeholder="Нове значення"
                          value={meter.value}
                          onChange={(e) => {
                            setReadings(prev => prev.map(r =>
                              r.apartment === meter.apartment && r.meter_type === meter.meter_type
                                ? { ...r, value: e.target.value }
                                : r
                            ));
                          }}
                          className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                        <button
                          onClick={() => saveReading(meter)}
                          disabled={!meter.value || saving === `${meter.apartment}-${meter.meter_type}`}
                          className="px-3 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 disabled:opacity-50"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
