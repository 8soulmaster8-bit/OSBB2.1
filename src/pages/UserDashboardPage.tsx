import { useEffect, useState } from 'react';
import { Building2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useOsbbData } from '../hooks/useOsbbData';
import { ResidentCabinet } from '../components/OsbbComponents';
import { UserMenu } from '../components/UserMenu';
import {
  getMeterIcon,
  getMeterLabel,
  getMeterColor,
  getMeterUnit,
  getStatusIcon,
  getStatusColor,
} from '../utils/osbbHelpers';
import type { Profile } from '../types/database';

export function UserDashboardPage() {
  const { profile } = useAuth();
  const {
    residents,
    meters,
    meterReadings,
    receipts,
    requests,
    loading,
    handleSubmitReading,
    handleAddMeter,
    handleDeleteMeter,
    handlePayReceipt,
    handleDeleteReceipt,
    handleAddRequest,
    handleDeleteRequest,
  } = useOsbbData();

  // Row Level Security ensures a resident only ever receives their own row
  // in `residents`, so we can safely auto-select it — no manual profile
  // picker needed once the person is authenticated.
  const [selectedResident, setSelectedResident] = useState<Profile | null>(null);

  useEffect(() => {
    if (!selectedResident && profile) {
      const own = residents.find((r) => r.id === profile.id) || profile;
      setSelectedResident(own);
    }
  }, [residents, profile, selectedResident]);

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
                <p className="text-xs text-slate-500">Кабінет мешканця</p>
              </div>
            </div>

            <UserMenu />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ResidentCabinet
          residents={residents}
          meters={meters}
          meterReadings={meterReadings}
          receipts={receipts}
          requests={requests}
          selectedResident={selectedResident}
          setSelectedResident={setSelectedResident}
          onSubmitReading={handleSubmitReading}
          onAddMeter={handleAddMeter}
          onDeleteMeter={handleDeleteMeter}
          onPayReceipt={handlePayReceipt}
          onDeleteReceipt={handleDeleteReceipt}
          onAddRequest={handleAddRequest}
          onDeleteRequest={handleDeleteRequest}
          getMeterIcon={getMeterIcon}
          getMeterLabel={getMeterLabel}
          getMeterColor={getMeterColor}
          getMeterUnit={getMeterUnit}
          getStatusIcon={getStatusIcon}
          getStatusColor={getStatusColor}
        />
      </main>
    </div>
  );
}
