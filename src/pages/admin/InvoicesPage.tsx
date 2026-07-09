import { useState, useEffect } from 'react';
import { Download, FileText, Printer } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

interface Charge {
  id: string;
  apartment: string;
  period: string;
  water_amount: number;
  electricity_amount: number;
  gas_amount: number;
  heating_amount: number;
  maintenance_amount: number;
  garbage_amount: number;
  total_amount: number;
  paid: boolean;
}

export function InvoicesPage() {
  const { profile } = useAuth();
  const [charges, setCharges] = useState<Charge[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState(new Date().toISOString().slice(0, 7));

  useEffect(() => {
    loadCharges();
  }, [selectedPeriod]);

  async function loadCharges() {
    if (!profile?.tenant_id) return;
    setLoading(true);
    try {
      const { data } = await supabase
        .from('charges')
        .select('*')
        .eq('tenant_id', profile.tenant_id)
        .eq('period', selectedPeriod)
        .order('apartment');
      setCharges(data || []);
    } finally {
      setLoading(false);
    }
  }

  function downloadInvoice(charge: Charge) {
    // Create invoice content
    const content = generateInvoiceContent(charge);
    const blob = new Blob([content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice-${charge.apartment}-${charge.period}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function generateInvoiceContent(charge: Charge) {
    return `
<!DOCTYPE html>
<html lang="uk">
<head>
  <meta charset="UTF-8">
  <title>Квитанція ${charge.apartment}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    h1 { color: #0d9488; border-bottom: 2px solid #0d9488; padding-bottom: 10px; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }
    th { background: #f1f5f9; }
    .total { font-weight: bold; font-size: 1.2em; color: #0d9488; }
    .header { display: flex; justify-content: space-between; margin-bottom: 30px; }
    .qr { width: 150px; height: 150px; background: #f1f5f9; display: flex; align-items: center; justify-content: center; margin-top: 20px; }
  </style>
</head>
<body>
  <h1>Квитанція на оплату</h1>
  <div class="header">
    <div>
      <p><strong>ОСББ</strong></p>
      <p>Період: ${charge.period}</p>
      <p>Квартира: ${charge.apartment}</p>
    </div>
    <div class="qr">
      <small>QR-код для оплати</small>
    </div>
  </div>
  <table>
    <tr><th>Послуга</th><th>Сума, грн</th></tr>
    <tr><td>Водопостачання</td><td>${charge.water_amount.toFixed(2)}</td></tr>
    <tr><td>Електрика</td><td>${charge.electricity_amount.toFixed(2)}</td></tr>
    <tr><td>Газ</td><td>${charge.gas_amount.toFixed(2)}</td></tr>
    <tr><td>Опалення</td><td>${charge.heating_amount.toFixed(2)}</td></tr>
    <tr><td>Утримання будинку</td><td>${charge.maintenance_amount.toFixed(2)}</td></tr>
    <tr><td>Вивезення сміття</td><td>${charge.garbage_amount.toFixed(2)}</td></tr>
    <tr class="total"><td>ВСЬОГО</td><td>${charge.total_amount.toFixed(2)}</td></tr>
  </table>
  <p style="margin-top: 30px; font-size: 12px; color: #64748b;">
    IBAN: UA00 0000 0000 0000 0000 0000 0000 | Одержувач: ОСББ "НАЗВА"
  </p>
</body>
</html>
    `;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50 to-teal-50">
      <header className="bg-white/80 backdrop-blur-lg border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <a href="/admin/dashboard" className="text-slate-600 hover:text-slate-800">← Назад</a>
              <h1 className="text-xl font-bold text-slate-800">Квитанції</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">Період</label>
          <input
            type="month"
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : charges.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">Немає нарахувань за цей період</p>
            <a href="/admin/charges" className="text-teal-600 hover:text-teal-700">
              Згенерувати нарахування
            </a>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Квартира</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Вода</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Електрика</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Газ</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Опалення</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-slate-600">Всього</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {charges.map((charge) => (
                  <tr key={charge.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium">
                      <span className="px-2 py-1 bg-teal-100 text-teal-700 rounded text-sm">
                        {charge.apartment}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{charge.water_amount.toFixed(2)}</td>
                    <td className="px-4 py-3 text-slate-600">{charge.electricity_amount.toFixed(2)}</td>
                    <td className="px-4 py-3 text-slate-600">{charge.gas_amount.toFixed(2)}</td>
                    <td className="px-4 py-3 text-slate-600">{charge.heating_amount.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right font-bold text-slate-800">
                      {charge.total_amount.toFixed(2)} грн
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => downloadInvoice(charge)}
                        className="p-2 text-teal-600 hover:text-teal-700 hover:bg-teal-50 rounded-lg"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
