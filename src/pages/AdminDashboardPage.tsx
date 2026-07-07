import { Building2, Shield, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useOsbbData } from '../hooks/useOsbbData';
import { AdminPanel } from '../components/OsbbComponents';
import { getMeterIcon, getMeterLabel, getStatusIcon, getStatusColor } from '../utils/osbbHelpers';

export function AdminDashboardPage() {
  const { profile, signOut } = useAuth();
  const {
    residents,
    meters,
    meterReadings,
    receipts,
    requests,
    loading,
    handleDeleteResident,
    handleAddMeter,
    handleDeleteMeter,
    handleAddReceipt,
    handleGenerateBills,
    handlePayReceipt,
    handleDeleteReceipt,
    handleUpdateRequestStatus,
    handleAssignMaster,
    handleDeleteRequest,
  } = useOsbbData();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Завантаження даних...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50 to-teal-50">
      <header className="bg-white/80 backdrop-blur-lg border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg shadow-teal-500/25">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800">ОСББ Управління</h1>
                <p className="text-xs text-slate-500">Кабінет голови ОСББ</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-amber-100 text-amber-700 rounded-lg text-sm font-medium">
                <Shield className="w-4 h-4" />
                {profile?.full_name || 'Адміністратор'}
              </div>
              <button
                onClick={signOut}
                className="flex items-center gap-2 px-3 py-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Вийти</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AdminPanel
          residents={residents}
          meters={meters}
          meterReadings={meterReadings}
          receipts={receipts}
          requests={requests}
          onDeleteResident={handleDeleteResident}
          onAddMeter={handleAddMeter}
          onDeleteMeter={handleDeleteMeter}
          onAddReceipt={handleAddReceipt}
          onGenerateBills={handleGenerateBills}
          onPayReceipt={handlePayReceipt}
          onDeleteReceipt={handleDeleteReceipt}
          onUpdateRequestStatus={handleUpdateRequestStatus}
          onAssignMaster={handleAssignMaster}
          onDeleteRequest={handleDeleteRequest}
          getMeterIcon={getMeterIcon}
          getMeterLabel={getMeterLabel}
          getStatusIcon={getStatusIcon}
          getStatusColor={getStatusColor}
        />
      </main>
    </div>
  );
}
