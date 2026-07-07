import { useState } from 'react';
import type {
  Resident,
  Meter,
  MeterReading,
  Receipt,
  MaintenanceRequest,
  RequestStatus,
} from '../types/database';
import { REQUEST_STATUS_LABELS } from '../types/database';
import {
  Home,
  Settings,
  FileText,
  Wrench,
  User,
  Users,
  Plus,
  Trash2,
  Check,
  Clock,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  Send,
  History,
  CreditCard,
  ChevronDown,
  ChevronUp,
  Hammer,
  TrendingUp,
  AlertTriangle,
  Receipt as ReceiptIcon,
  Calculator,
  Filter,
  X,
  Square,
  Building2,
} from 'lucide-react';

interface ResidentCabinetProps {
  residents: Resident[];
  meters: Meter[];
  meterReadings: MeterReading[];
  receipts: Receipt[];
  requests: MaintenanceRequest[];
  selectedResident: Resident | null;
  setSelectedResident: (r: Resident | null) => void;
  onSubmitReading: (meterId: string, reading: number) => void;
  onAddMeter: (e: React.FormEvent<HTMLFormElement>, residentId?: string) => void;
  onDeleteMeter: (id: string) => void;
  onPayReceipt: (id: string) => void;
  onDeleteReceipt: (id: string) => void;
  onAddRequest: (e: React.FormEvent<HTMLFormElement>, residentId?: string) => void;
  onDeleteRequest: (id: string) => void;
  getMeterIcon: (type: string, className?: string) => React.ReactNode;
  getMeterLabel: (type: string) => string;
  getMeterColor: (type: string) => string;
  getMeterUnit: (type: string) => string;
  getStatusIcon: (status: string) => React.ReactNode;
  getStatusColor: (status: string) => string;
}

export function ResidentCabinet({
  residents,
  meters,
  meterReadings,
  receipts,
  requests,
  selectedResident,
  setSelectedResident,
  onSubmitReading,
  onDeleteMeter,
  onPayReceipt,
  onDeleteReceipt,
  onAddRequest,
  onDeleteRequest,
  getMeterIcon,
  getMeterLabel,
  getMeterColor,
  getMeterUnit,
  getStatusIcon,
  getStatusColor,
}: ResidentCabinetProps) {
  const [activeTab, setActiveTab] = useState<'meters' | 'bills' | 'requests'>('meters');
  const [expandedMeters, setExpandedMeters] = useState<Record<string, boolean>>({});

  const residentMeters = meters.filter((m) => m.resident_id === selectedResident?.id);
  const residentReceipts = receipts.filter((r) => r.resident_id === selectedResident?.id);
  const residentRequests = requests.filter((r) => r.resident_id === selectedResident?.id);

  const totalDebt = residentReceipts
    .filter((r) => r.status === 'unpaid')
    .reduce((sum, r) => sum + r.amount, 0);

  const getMeterHistory = (meterId: string) => {
    return meterReadings.filter((r) => r.meter_id === meterId).slice(0, 6);
  };

  const toggleMeterExpanded = (meterId: string) => {
    setExpandedMeters((prev) => ({ ...prev, [meterId]: !prev[meterId] }));
  };

  return (
    <div className="space-y-6">
      {!selectedResident ? (
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200 p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-teal-500/25">
              <Home className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Выберите ваш профиль</h2>
            <p className="text-slate-500">Для тестирования выберите жильца из списка</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {residents.map((resident) => (
              <button
                key={resident.id}
                onClick={() => setSelectedResident(resident)}
                className="group p-4 bg-slate-50 hover:bg-gradient-to-br hover:from-teal-50 hover:to-cyan-50 rounded-xl border border-slate-200 hover:border-teal-300 transition-all duration-300 text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md">
                    {resident.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-800 group-hover:text-teal-700 transition-colors">
                      {resident.name}
                    </p>
                    <p className="text-sm text-slate-500">Кв. {resident.apartment}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-teal-500 group-hover:translate-x-1 transition-all" />
                </div>
                {resident.role === 'admin' && (
                  <span className="inline-block mt-2 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                    Админ
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className="bg-gradient-to-r from-teal-600 to-cyan-600 rounded-2xl p-6 shadow-xl shadow-teal-500/25">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center">
                  <User className="w-8 h-8 text-white" />
                </div>
                <div className="text-white">
                  <h2 className="text-2xl font-bold">{selectedResident.name}</h2>
                  <p className="text-teal-100">Квартира {selectedResident.apartment}</p>
                  {selectedResident.phone && (
                    <p className="text-teal-200 text-sm mt-1">{selectedResident.phone}</p>
                  )}
                </div>
              </div>
              <button
                onClick={() => setSelectedResident(null)}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors"
              >
                Сменить профиль
              </button>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="bg-white/10 backdrop-blur rounded-xl p-4 text-center">
                <p className="text-3xl font-bold text-white">{residentMeters.length}</p>
                <p className="text-teal-100 text-sm">Счетчиков</p>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-xl p-4 text-center">
                <p className="text-3xl font-bold text-white">{residentRequests.length}</p>
                <p className="text-teal-100 text-sm">Заявок</p>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-xl p-4 text-center">
                <p className="text-3xl font-bold text-white">
                  {totalDebt > 0 ? `${totalDebt.toLocaleString()} ₴` : '0 ₴'}
                </p>
                <p className="text-teal-100 text-sm">К оплате</p>
              </div>
            </div>
          </div>

          <div className="flex gap-2 bg-white p-1 rounded-xl shadow-sm border border-slate-200 w-fit">
            <button
              onClick={() => setActiveTab('meters')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-all ${
                activeTab === 'meters'
                  ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-md'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Settings className="w-4 h-4" />
              Счетчики
            </button>
            <button
              onClick={() => setActiveTab('bills')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-all ${
                activeTab === 'bills'
                  ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-md'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              Мои счета
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-all ${
                activeTab === 'requests'
                  ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-md'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Wrench className="w-4 h-4" />
              Заявки на ремонт
            </button>
          </div>

          {activeTab === 'meters' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {residentMeters.length === 0 ? (
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200 p-12 text-center">
                  <Settings className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                  <p className="text-slate-600 text-lg font-medium">Счетчики не найдены</p>
                  <p className="text-slate-400 text-sm mt-1">Обратитесь к администратору для добавления счетчиков</p>
                </div>
              ) : (
                residentMeters.map((meter) => (
                  <MeterCard
                    key={meter.id}
                    meter={meter}
                    readings={getMeterHistory(meter.id)}
                    onSubmit={onSubmitReading}
                    onDelete={onDeleteMeter}
                    isExpanded={expandedMeters[meter.id || '']}
                    onToggleExpand={() => meter && toggleMeterExpanded(meter.id)}
                    getMeterIcon={getMeterIcon}
                    getMeterLabel={getMeterLabel}
                    getMeterColor={getMeterColor}
                    getMeterUnit={getMeterUnit}
                  />
                ))
              )}
            </div>
          )}

          {activeTab === 'bills' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 mb-1">К оплате</h3>
                    <p className="text-sm text-slate-500">Сумма задолженности по всем квитанциям</p>
                  </div>
                  <div className="text-right">
                    <p className="text-4xl font-bold text-slate-800">
                      {totalDebt > 0 ? totalDebt.toLocaleString() : '0'} ₴
                    </p>
                    {totalDebt > 0 && (
                      <button
                        onClick={() => {
                          const unpaid = residentReceipts.find((r) => r.status === 'unpaid');
                          if (unpaid) onPayReceipt(unpaid.id);
                        }}
                        className="mt-3 flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg font-medium hover:from-amber-600 hover:to-orange-600 transition-all shadow-md"
                      >
                        <CreditCard className="w-4 h-4" />
                        Оплатить
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200 p-6">
                <h3 className="text-lg font-bold text-slate-800 mb-4">Архив квитанций</h3>
                {residentReceipts.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">
                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Квитанции не найдены</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-200">
                          <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Период</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Сумма</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Статус</th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-slate-600">Действия</th>
                        </tr>
                      </thead>
                      <tbody>
                        {residentReceipts.map((receipt) => (
                          <tr key={receipt.id} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="py-3 px-4 font-medium text-slate-800">{receipt.month}</td>
                            <td className="py-3 px-4 text-slate-700">{receipt.amount.toLocaleString()} ₴</td>
                            <td className="py-3 px-4">
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                                  receipt.status === 'paid'
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : 'bg-amber-100 text-amber-700'
                                }`}
                              >
                                {receipt.status === 'paid' ? (
                                  <>
                                    <Check className="w-3 h-3" />
                                    Оплачено
                                  </>
                                ) : (
                                  <>
                                    <Clock className="w-3 h-3" />
                                    К оплате
                                  </>
                                )}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              {receipt.status === 'unpaid' && (
                                <button
                                  onClick={() => onPayReceipt(receipt.id)}
                                  className="px-3 py-1.5 bg-teal-500 text-white rounded-lg text-sm font-medium hover:bg-teal-600 transition-colors mr-2"
                                >
                                  Оплатить
                                </button>
                              )}
                              <button
                                onClick={() => onDeleteReceipt(receipt.id)}
                                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'requests' && (
            <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-slate-800">Мои заявки</h3>
                <RequestForm residentId={selectedResident.id} onSubmit={onAddRequest} />
              </div>

              {residentRequests.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <Wrench className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Заявки не найдены</p>
                  <p className="text-sm mt-1">Создайте новую заявку на ремонт</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {residentRequests.map((req) => (
                    <div
                      key={req.id}
                      className="bg-gradient-to-br from-slate-50 to-cyan-50 rounded-xl p-5 border border-slate-200"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                              req.status === 'new'
                                ? 'bg-amber-100'
                                : req.status === 'in_progress'
                                  ? 'bg-blue-100'
                                  : 'bg-emerald-100'
                            }`}
                          >
                            {getStatusIcon(req.status)}
                          </div>
                          <div>
                            <h4 className="font-semibold text-slate-800">{req.topic}</h4>
                            {req.description && (
                              <p className="text-sm text-slate-500 mt-1">{req.description}</p>
                            )}
                            <div className="flex items-center gap-4 mt-3">
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(req.status)}`}
                              >
                                {REQUEST_STATUS_LABELS[req.status]}
                              </span>
                              {req.master && req.status !== 'new' && (
                                <span className="inline-flex items-center gap-1 text-sm text-slate-600">
                                  <Hammer className="w-4 h-4" />
                                  {req.master}
                                </span>
                              )}
                              <span className="text-xs text-slate-400">
                                {new Date(req.created_at).toLocaleDateString('uk-UA')}
                              </span>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => onDeleteRequest(req.id)}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

interface MeterCardProps {
  meter?: Meter;
  readings: MeterReading[];
  onSubmit: (meterId: string, reading: number) => void;
  onDelete: (id: string) => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
  getMeterIcon: (type: string, className?: string) => React.ReactNode;
  getMeterLabel: (type: string) => string;
  getMeterColor: (type: string) => string;
  getMeterUnit: (type: string) => string;
}

function MeterCard({
  meter,
  readings,
  onSubmit,
  onDelete,
  isExpanded,
  onToggleExpand,
  getMeterIcon,
  getMeterLabel,
  getMeterColor,
  getMeterUnit,
}: MeterCardProps) {
  const [newReading, setNewReading] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!meter || !newReading) return;

    const readingValue = parseFloat(newReading);
    if (isNaN(readingValue)) return;

    onSubmit(meter.id, readingValue);
    setNewReading('');
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
  };

  const lastReading = readings[0];
  const previousReading = readings[1];
  const consumption =
    lastReading && previousReading ? lastReading.reading - previousReading.reading : null;

  const unit = meter ? getMeterUnit(meter.type) : '';

  return (
    <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200 overflow-hidden">
      <div className={`bg-gradient-to-r ${meter ? getMeterColor(meter.type) : 'from-slate-500 to-slate-600'} p-5`}>
        <div className="flex items-center gap-3 text-white">
          <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
            {meter ? getMeterIcon(meter.type, 'w-6 h-6') : <Settings className="w-6 h-6" />}
          </div>
          <div>
            <h3 className="text-lg font-bold">{meter ? getMeterLabel(meter.type) : 'Счетчик'}</h3>
            {meter && (
              <p className="text-sm text-white/80">
                Показания на {new Date(meter.reading_date).toLocaleDateString('uk-UA')}
              </p>
            )}
          </div>
        </div>
        {meter && (
          <div className="mt-4 flex items-end justify-between">
            <div>
              <p className="text-4xl font-bold text-white">
                {meter.current_reading.toLocaleString()}
              </p>
              <p className="text-sm text-white/70 mt-1">{unit}</p>
            </div>
            {consumption !== null && consumption > 0 && (
              <div className="text-right">
                <p className="text-sm text-white/80">Расход</p>
                <p className="text-xl font-semibold text-white">+{consumption.toFixed(1)} {unit}</p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="p-5">
        {meter ? (
          <>
            <form onSubmit={handleSubmit} className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">Новые показания</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  step="0.001"
                  value={newReading}
                  onChange={(e) => setNewReading(e.target.value)}
                  placeholder={`Введите показания (${unit})`}
                  className="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
                <button
                  type="submit"
                  className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-lg font-medium hover:from-teal-600 hover:to-cyan-600 transition-all shadow-md"
                >
                  <Send className="w-4 h-4" />
                  Отправить
                </button>
              </div>
              {showSuccess && (
                <p className="mt-2 text-sm text-emerald-600 flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" />
                  Показания успешно отправлены
                </p>
              )}
            </form>

            <div className="border-t border-slate-200 pt-4">
              <button
                onClick={onToggleExpand}
                className="flex items-center justify-between w-full text-sm font-medium text-slate-700 hover:text-teal-600 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <History className="w-4 h-4" />
                  История показаний
                </span>
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>

              {isExpanded && (
                <div className="mt-3 space-y-2">
                  {readings.length > 0 ? (
                    readings.map((reading) => (
                      <div
                        key={reading.id}
                        className="flex items-center justify-between py-2 px-3 bg-slate-50 rounded-lg text-sm"
                      >
                        <span className="text-slate-500">
                          {new Date(reading.reading_date).toLocaleDateString('uk-UA', {
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                        <span className="font-medium text-slate-800">
                          {reading.reading.toLocaleString()} {unit}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500 text-center py-4">История пуста</p>
                  )}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="text-center py-6">
            <Settings className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-500">Счетчик не найден</p>
            <p className="text-sm text-slate-400 mt-1">Обратитесь к администратору</p>
          </div>
        )}

        {meter && (
          <div className="mt-4 pt-4 border-t border-slate-200 flex justify-end">
            <button
              onClick={() => onDelete(meter.id)}
              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

interface AdminPanelProps {
  residents: Resident[];
  meters: Meter[];
  meterReadings: MeterReading[];
  receipts: Receipt[];
  requests: MaintenanceRequest[];
  onAddResident: (e: React.FormEvent<HTMLFormElement>, area?: number) => void;
  onDeleteResident: (id: string) => void;
  onAddMeter: (e: React.FormEvent<HTMLFormElement>, residentId?: string) => void;
  onDeleteMeter: (id: string) => void;
  onAddReceipt: (e: React.FormEvent<HTMLFormElement>, residentId?: string) => void;
  onGenerateBills: (month: string, tariff: number) => Promise<boolean>;
  onPayReceipt: (id: string) => void;
  onDeleteReceipt: (id: string) => void;
  onUpdateRequestStatus: (id: string, status: RequestStatus) => void;
  onAssignMaster: (id: string, master: string) => void;
  onDeleteRequest: (id: string) => void;
  getMeterIcon: (type: string, className?: string) => React.ReactNode;
  getMeterLabel: (type: string) => string;
  getStatusIcon: (status: string) => React.ReactNode;
  getStatusColor: (status: string) => string;
}

export function AdminPanel({
  residents,
  meters,
  receipts,
  requests,
  onAddResident,
  onDeleteResident,
  onAddMeter,
  onDeleteMeter,
  onAddReceipt,
  onGenerateBills,
  onPayReceipt,
  onDeleteReceipt,
  onUpdateRequestStatus,
  onAssignMaster,
  onDeleteRequest,
  getMeterIcon,
  getMeterLabel,
  getStatusIcon,
  getStatusColor,
}: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'apartments' | 'meters' | 'receipts' | 'requests'
  >('dashboard');
  const [debtorFilter, setDebtorFilter] = useState<'all' | 'debtors'>('all');
  const [showBillGenerator, setShowBillGenerator] = useState(false);

  const totalUnpaid = receipts
    .filter((r) => r.status === 'unpaid')
    .reduce((sum, r) => sum + r.amount, 0);
  const newRequests = requests.filter((r) => r.status === 'new').length;
  const inProgressRequests = requests.filter((r) => r.status === 'in_progress').length;

  const debtorResidentIds = new Set(
    receipts.filter((r) => r.status === 'unpaid').map((r) => r.resident_id)
  );

  const filteredResidents = residents.filter((r) =>
    debtorFilter === 'all' ? true : debtorResidentIds.has(r.id)
  );

  const getResidentDebt = (residentId: string) => {
    return receipts
      .filter((r) => r.resident_id === residentId && r.status === 'unpaid')
      .reduce((sum, r) => sum + r.amount, 0);
  };

  const residentDebtorCount = residents.filter((r) => debtorResidentIds.has(r.id)).length;

  return (
    <div className="space-y-6">
      <div className="flex gap-2 bg-white p-1 rounded-xl shadow-sm border border-slate-200 w-fit flex-wrap">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-all ${
            activeTab === 'dashboard'
              ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          Дашборд
        </button>
        <button
          onClick={() => setActiveTab('apartments')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-all ${
            activeTab === 'apartments'
              ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Building2 className="w-4 h-4" />
          Квартиры
        </button>
        <button
          onClick={() => setActiveTab('meters')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-all ${
            activeTab === 'meters'
              ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Settings className="w-4 h-4" />
          Счетчики
        </button>
        <button
          onClick={() => setActiveTab('receipts')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-all ${
            activeTab === 'receipts'
              ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <FileText className="w-4 h-4" />
          Квитанции
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-all ${
            activeTab === 'requests'
              ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Wrench className="w-4 h-4" />
          Заявки
        </button>
      </div>

      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-5 shadow-lg shadow-slate-200/50 border border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg shadow-teal-500/25">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-800">{residents.length}</p>
                  <p className="text-sm text-slate-500">Жильцов</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-lg shadow-slate-200/50 border border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/25">
                  <AlertTriangle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-800">
                    {totalUnpaid > 0 ? `${totalUnpaid.toLocaleString()} ₴` : '0 ₴'}
                  </p>
                  <p className="text-sm text-slate-500">Общий долг</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-lg shadow-slate-200/50 border border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/25">
                  <AlertCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-800">
                    {newRequests + inProgressRequests}
                  </p>
                  <p className="text-sm text-slate-500">Открытых заявок</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-lg shadow-slate-200/50 border border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-red-400 to-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/25">
                  <ReceiptIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-800">{residentDebtorCount}</p>
                  <p className="text-sm text-slate-500">Должников</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200 p-6">
              <h3 className="text-lg font-bold text-slate-800 mb-4">Открытые заявки</h3>
              {requests.filter((r) => r.status !== 'completed').length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <CheckCircle className="w-10 h-10 mx-auto mb-2 text-emerald-400" />
                  <p>Нет открытых заявок</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {requests
                    .filter((r) => r.status !== 'completed')
                    .slice(0, 5)
                    .map((req) => (
                      <div
                        key={req.id}
                        className="flex items-center justify-between p-3 bg-slate-50 rounded-xl"
                      >
                        <div className="flex items-center gap-3">
                          {getStatusIcon(req.status)}
                          <div>
                            <p className="font-medium text-slate-800 text-sm">{req.topic}</p>
                            <p className="text-xs text-slate-500">
                              Кв. {req.residents?.apartment || 'N/A'}
                            </p>
                          </div>
                        </div>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(req.status)}`}
                        >
                          {REQUEST_STATUS_LABELS[req.status]}
                        </span>
                      </div>
                    ))}
                  {requests.filter((r) => r.status !== 'completed').length > 5 && (
                    <button
                      onClick={() => setActiveTab('requests')}
                      className="w-full py-2 text-sm text-teal-600 hover:text-teal-700 font-medium"
                    >
                      Показать все ({requests.filter((r) => r.status !== 'completed').length})
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200 p-6">
              <h3 className="text-lg font-bold text-slate-800 mb-4">Должники</h3>
              {residentDebtorCount === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <CheckCircle className="w-10 h-10 mx-auto mb-2 text-emerald-400" />
                  <p>Нет задолженностей</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {residents
                    .filter((r) => debtorResidentIds.has(r.id))
                    .slice(0, 5)
                    .map((resident) => {
                      const debt = getResidentDebt(resident.id);
                      return (
                        <div
                          key={resident.id}
                          className="flex items-center justify-between p-3 bg-amber-50 rounded-xl"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-amber-200 rounded-lg flex items-center justify-center text-amber-700 font-bold text-sm">
                              {resident.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-medium text-slate-800 text-sm">{resident.name}</p>
                              <p className="text-xs text-slate-500">Кв. {resident.apartment}</p>
                            </div>
                          </div>
                          <span className="font-bold text-amber-700">{debt.toLocaleString()} ₴</span>
                        </div>
                      );
                    })}
                  {residentDebtorCount > 5 && (
                    <button
                      onClick={() => {
                        setDebtorFilter('debtors');
                        setActiveTab('apartments');
                      }}
                      className="w-full py-2 text-sm text-teal-600 hover:text-teal-700 font-medium"
                    >
                      Показать всех ({residentDebtorCount})
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-2xl p-6 border border-teal-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Выставить счета за месяц</h3>
                <p className="text-sm text-slate-600 mt-1">
                  Автоматическое создание квитанций для всех квартир по тарифу за м²
                </p>
              </div>
              <button
                onClick={() => setShowBillGenerator(true)}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-xl font-medium hover:from-teal-600 hover:to-cyan-600 transition-all shadow-lg shadow-teal-500/25"
              >
                <Calculator className="w-5 h-5" />
                Выставить счета
              </button>
            </div>
          </div>
        </div>
      )}

      {showBillGenerator && (
        <BillGeneratorModal
          onGenerate={onGenerateBills}
          onClose={() => setShowBillGenerator(false)}
        />
      )}

      {activeTab === 'apartments' && (
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <h3 className="text-lg font-bold text-slate-800">Все квартиры</h3>
              <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg">
                <button
                  onClick={() => setDebtorFilter('all')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    debtorFilter === 'all'
                      ? 'bg-white text-slate-800 shadow-sm'
                      : 'text-slate-600 hover:text-slate-800'
                  }`}
                >
                  Все ({residents.length})
                </button>
                <button
                  onClick={() => setDebtorFilter('debtors')}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    debtorFilter === 'debtors'
                      ? 'bg-red-100 text-red-700'
                      : 'text-slate-600 hover:text-slate-800'
                  }`}
                >
                  <Filter className="w-3 h-3" />
                  Должники ({residentDebtorCount})
                </button>
              </div>
            </div>
            <ResidentForm onSubmit={onAddResident} />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">
                    Квартира
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Жилец</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">
                    Площадь
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Телефон</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Долг</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-slate-600">
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredResidents.map((resident) => {
                  const debt = getResidentDebt(resident.id);
                  return (
                    <tr
                      key={resident.id}
                      className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${
                        debt > 0 ? 'bg-red-50/50' : ''
                      }`}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-lg flex items-center justify-center text-white font-bold">
                            {resident.apartment}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-slate-800">{resident.name}</p>
                          {resident.role === 'admin' && (
                            <span className="text-xs text-amber-600 font-medium">Админ</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          <Square className="w-4 h-4 text-slate-400" />
                          <span className="text-slate-700">{resident.area} м²</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600">{resident.phone || '-'}</td>
                      <td className="py-3 px-4">
                        {debt > 0 ? (
                          <span className="font-bold text-red-600">{debt.toLocaleString()} ₴</span>
                        ) : (
                          <span className="text-emerald-600 flex items-center gap-1">
                            <Check className="w-4 h-4" />
                            Нет
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => onDeleteResident(resident.id)}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'meters' && (
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-800">Все счетчики</h3>
            <MeterForm
              residentId={residents[0]?.id || ''}
              onSubmit={(e) => onAddMeter(e)}
              residents={residents}
              getMeterLabel={getMeterLabel}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {meters.map((meter) => (
              <div
                key={meter.id}
                className="bg-gradient-to-br from-slate-50 to-cyan-50 rounded-xl p-4 border border-slate-200"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                      {getMeterIcon(meter.type)}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">{getMeterLabel(meter.type)}</p>
                      <p className="text-sm text-slate-500">
                        Кв. {meter.residents?.apartment || 'N/A'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => onDeleteMeter(meter.id)}
                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-200 flex justify-between">
                  <div>
                    <p className="text-2xl font-bold text-slate-800">
                      {meter.current_reading.toLocaleString()}
                    </p>
                    <p className="text-xs text-slate-500">
                      {meter.type.includes('water')
                        ? 'м³'
                        : meter.type === 'electricity'
                          ? 'кВт⋅ч'
                          : 'м³'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-slate-700">
                      {new Date(meter.reading_date).toLocaleDateString('uk-UA')}
                    </p>
                    <p className="text-xs text-slate-500">Дата</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'receipts' && (
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-800">Все квитанции</h3>
            <ReceiptForm
              residentId={residents[0]?.id || ''}
              onSubmit={(e) => onAddReceipt(e)}
              residents={residents}
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">
                    Квартира
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Месяц</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Сумма</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Статус</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-slate-600">
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody>
                {receipts.map((receipt) => (
                  <tr
                    key={receipt.id}
                    className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                  >
                    <td className="py-3 px-4 font-medium text-slate-800">
                      {receipt.residents?.apartment || 'N/A'}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{receipt.month || '-'}</td>
                    <td className="py-3 px-4 text-slate-800 font-medium">
                      {receipt.amount.toLocaleString()} ₴
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          receipt.status === 'paid'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {receipt.status === 'paid' ? 'Оплачено' : 'Не оплачено'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {receipt.status === 'unpaid' && (
                          <button
                            onClick={() => onPayReceipt(receipt.id)}
                            className="px-2 py-1 text-xs text-teal-600 hover:bg-teal-50 rounded transition-colors"
                          >
                            Оплатить
                          </button>
                        )}
                        <button
                          onClick={() => onDeleteReceipt(receipt.id)}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'requests' && (
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-800">Управление заявками</h3>
          </div>

          <div className="space-y-4">
            {requests.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <Wrench className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Заявок нет</p>
              </div>
            ) : (
              requests.map((req) => (
                <div
                  key={req.id}
                  className="bg-gradient-to-br from-slate-50 to-cyan-50 rounded-xl p-5 border border-slate-200"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          req.status === 'new'
                            ? 'bg-amber-100'
                            : req.status === 'in_progress'
                              ? 'bg-blue-100'
                              : 'bg-emerald-100'
                        }`}
                      >
                        {getStatusIcon(req.status)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-semibold text-slate-800">{req.topic}</h4>
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(req.status)}`}
                          >
                            {REQUEST_STATUS_LABELS[req.status]}
                          </span>
                        </div>
                        {req.description && (
                          <p className="text-sm text-slate-500 mt-1">{req.description}</p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-sm text-slate-500 flex-wrap">
                          <span className="inline-flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5" />
                            Кв. {req.residents?.apartment || 'N/A'}
                          </span>
                          <span>{new Date(req.created_at).toLocaleDateString('uk-UA')}</span>
                          {req.master && (
                            <span className="inline-flex items-center gap-1">
                              <Hammer className="w-3.5 h-3.5" />
                              {req.master}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <select
                        value={req.status}
                        onChange={(e) =>
                          onUpdateRequestStatus(req.id, e.target.value as RequestStatus)
                        }
                        className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                      >
                        <option value="new">В обработке</option>
                        <option value="in_progress">Мастер назначен</option>
                        <option value="completed">Выполнено</option>
                      </select>
                      <input
                        type="text"
                        placeholder="Мастер"
                        value={req.master || ''}
                        onChange={(e) => onAssignMaster(req.id, e.target.value)}
                        className="px-3 py-2 border border-slate-200 rounded-lg text-sm w-28 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                      <button
                        onClick={() => onDeleteRequest(req.id)}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function BillGeneratorModal({
  onGenerate,
  onClose,
}: {
  onGenerate: (month: string, tariff: number) => Promise<boolean>;
  onClose: () => void;
}) {
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [tariff, setTariff] = useState('35');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const result = await onGenerate(month, parseFloat(tariff));
    setLoading(false);
    if (result) {
      setSuccess(true);
      setTimeout(onClose, 1500);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-slate-800">Выставить счета за месяц</h3>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Месяц</label>
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Тариф за м² (грн)
            </label>
            <input
              type="number"
              step="0.01"
              value={tariff}
              onChange={(e) => setTariff(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="bg-slate-50 rounded-xl p-4">
            <p className="text-sm text-slate-600">
              Счета будут автоматически созданы для всех квартир. Сумма рассчитывается как:
              <br />
              <span className="font-medium text-slate-800">Площадь квартиры × Тариф</span>
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-slate-600 font-medium hover:bg-slate-50 transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={loading || success}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-xl font-medium hover:from-teal-600 hover:to-cyan-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Обработка...
                </span>
              ) : success ? (
                <span className="flex items-center justify-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Готово!
                </span>
              ) : (
                'Создать счета'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ResidentForm({
  onSubmit,
}: {
  onSubmit: (e: React.FormEvent<HTMLFormElement>, area?: number) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [area, setArea] = useState('50');

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    onSubmit(e, parseFloat(area) || 50);
    setIsOpen(false);
    setArea('50');
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-lg font-medium hover:from-teal-600 hover:to-cyan-600 transition-all shadow-md shadow-teal-500/25"
      >
        <Plus className="w-4 h-4" />
        Добавить квартиру
      </button>

      {isOpen && (
        <form
          onSubmit={handleSubmit}
          className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 p-4 z-10"
        >
          <div className="space-y-3">
            <input
              name="name"
              placeholder="ФИО владельца"
              required
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <input
              name="apartment"
              placeholder="Номер квартиры"
              required
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <div className="flex items-center gap-2">
              <Square className="w-4 h-4 text-slate-400" />
              <input
                type="number"
                placeholder="Площадь (м²)"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                className="flex-1 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <input
              name="phone"
              placeholder="Телефон"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <select
              name="role"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="resident">Жилец</option>
              <option value="admin">Админ</option>
            </select>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50"
              >
                Отмена
              </button>
              <button
                type="submit"
                className="flex-1 px-3 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600"
              >
                Добавить
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}

function MeterForm({
  residentId,
  onSubmit,
  residents,
  getMeterLabel,
}: {
  residentId: string;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  residents?: Resident[];
  getMeterLabel: (type: string) => string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const meterTypes: Meter['type'][] = ['cold_water', 'hot_water', 'electricity', 'gas'];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-lg font-medium hover:from-teal-600 hover:to-cyan-600 transition-all shadow-md shadow-teal-500/25"
      >
        <Plus className="w-4 h-4" />
        Добавить счетчик
      </button>

      {isOpen && (
        <form
          onSubmit={(e) => {
            onSubmit(e);
            setIsOpen(false);
          }}
          className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 p-4 z-10"
        >
          <div className="space-y-3">
            {residents && (
              <select
                name="resident_id"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                {residents.map((r) => (
                  <option key={r.id} value={r.id}>
                    Кв. {r.apartment} - {r.name}
                  </option>
                ))}
              </select>
            )}
            {!residents && <input type="hidden" name="resident_id" value={residentId} />}
            <select
              name="type"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              {meterTypes.map((type) => (
                <option key={type} value={type}>
                  {getMeterLabel(type)}
                </option>
              ))}
            </select>
            <input
              name="reading"
              type="number"
              step="0.001"
              placeholder="Показания"
              required
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <input
              name="date"
              type="date"
              defaultValue={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50"
              >
                Отмена
              </button>
              <button
                type="submit"
                className="flex-1 px-3 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600"
              >
                Добавить
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}

function ReceiptForm({
  residentId,
  onSubmit,
  residents,
}: {
  residentId: string;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  residents?: Resident[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-lg font-medium hover:from-teal-600 hover:to-cyan-600 transition-all shadow-md shadow-teal-500/25"
      >
        <Plus className="w-4 h-4" />
        Добавить квитанцию
      </button>

      {isOpen && (
        <form
          onSubmit={(e) => {
            onSubmit(e);
            setIsOpen(false);
          }}
          className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 p-4 z-10"
        >
          <div className="space-y-3">
            {residents && (
              <select
                name="resident_id"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                {residents.map((r) => (
                  <option key={r.id} value={r.id}>
                    Кв. {r.apartment} - {r.name}
                  </option>
                ))}
              </select>
            )}
            {!residents && <input type="hidden" name="resident_id" value={residentId} />}
            <input
              name="month"
              type="month"
              defaultValue={currentMonth}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <input
              name="amount"
              type="number"
              step="0.01"
              placeholder="Сумма (грн)"
              required
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <select
              name="status"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="unpaid">Не оплачено</option>
              <option value="paid">Оплачено</option>
            </select>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50"
              >
                Отмена
              </button>
              <button
                type="submit"
                className="flex-1 px-3 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600"
              >
                Добавить
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}

function RequestForm({
  residentId,
  onSubmit,
}: {
  residentId: string;
  onSubmit: (e: React.FormEvent<HTMLFormElement>, residentId?: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-lg font-medium hover:from-teal-600 hover:to-cyan-600 transition-all shadow-md shadow-teal-500/25"
      >
        <Plus className="w-4 h-4" />
        Новая заявка
      </button>

      {isOpen && (
        <form
          onSubmit={(e) => {
            onSubmit(e, residentId);
            setIsOpen(false);
          }}
          className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 p-4 z-10"
        >
          <div className="space-y-3">
            <input
              name="topic"
              placeholder="Тема заявки (например: Протекает труба)"
              required
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <textarea
              name="description"
              placeholder="Подробное описание проблемы"
              rows={3}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50"
              >
                Отмена
              </button>
              <button
                type="submit"
                className="flex-1 px-3 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600"
              >
                Создать
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
