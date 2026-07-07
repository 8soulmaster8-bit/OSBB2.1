import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type {
  Profile,
  Meter,
  MeterReading,
  Bill,
  MaintenanceRequest,
  RequestStatus,
} from '../types/database';

/**
 * Shared data-fetching + mutation hook used by both the admin and the
 * resident dashboards. Row Level Security on the Supabase side makes sure
 * a resident only ever receives their own rows, while an admin (Голова
 * ОСББ) receives everything, so the exact same hook can safely power both
 * dashboards.
 */
export function useOsbbData() {
  const [residents, setResidents] = useState<Profile[]>([]);
  const [meters, setMeters] = useState<Meter[]>([]);
  const [meterReadings, setMeterReadings] = useState<MeterReading[]>([]);
  const [receipts, setReceipts] = useState<Bill[]>([]);
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    const [residentsRes, metersRes, readingsRes, receiptsRes, requestsRes] = await Promise.all([
      supabase.from('profiles').select('*').order('apartment_number'),
      supabase.from('meters').select('*, profiles(*)').order('created_at', { ascending: false }),
      supabase.from('meter_readings').select('*, meters(*)').order('reading_date', { ascending: false }),
      supabase.from('bills').select('*, profiles(*)').order('created_at', { ascending: false }),
      supabase.from('requests').select('*, profiles(*)').order('created_at', { ascending: false }),
    ]);

    if (residentsRes.data) setResidents(residentsRes.data);
    if (metersRes.data) setMeters(metersRes.data);
    if (readingsRes.data) setMeterReadings(readingsRes.data);
    if (receiptsRes.data) setReceipts(receiptsRes.data);
    if (requestsRes.data) setRequests(requestsRes.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const handleDeleteResident = async (id: string) => {
    await supabase.from('profiles').delete().eq('id', id);
    fetchAllData();
  };

  const handleAddMeter = async (e: React.FormEvent<HTMLFormElement>, residentId?: string) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const meter = {
      user_id: (formData.get('user_id') as string) || residentId,
      type: formData.get('type') as Meter['type'],
      current_reading: parseFloat(formData.get('reading') as string) || 0,
      reading_date: (formData.get('date') as string) || new Date().toISOString().split('T')[0],
    };

    const { error } = await supabase.from('meters').insert(meter);
    if (!error) {
      fetchAllData();
      (e.target as HTMLFormElement).reset();
    }
  };

  const handleDeleteMeter = async (id: string) => {
    await supabase.from('meters').delete().eq('id', id);
    fetchAllData();
  };

  const handleSubmitReading = async (meterId: string, reading: number) => {
    const today = new Date().toISOString().split('T')[0];

    await supabase.from('meter_readings').insert({
      meter_id: meterId,
      reading,
      reading_date: today,
    });

    await supabase
      .from('meters')
      .update({ current_reading: reading, reading_date: today })
      .eq('id', meterId);

    fetchAllData();
  };

  const handleAddReceipt = async (e: React.FormEvent<HTMLFormElement>, residentId?: string) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const receipt = {
      user_id: (formData.get('user_id') as string) || residentId,
      month: formData.get('month') as string,
      amount: parseFloat(formData.get('amount') as string) || 0,
      status: formData.get('status') as 'paid' | 'unpaid',
    };

    const { error } = await supabase.from('bills').insert(receipt);
    if (!error) {
      fetchAllData();
      (e.target as HTMLFormElement).reset();
    }
  };

  const handleGenerateBills = async (month: string, tariff: number) => {
    const receiptsToInsert = residents.map((resident) => ({
      user_id: resident.id,
      month,
      amount: Math.round(resident.square_meters * tariff * 100) / 100,
      status: 'unpaid' as const,
    }));

    const { error } = await supabase.from('bills').insert(receiptsToInsert);
    if (!error) {
      fetchAllData();
    }
    return !error;
  };

  const handlePayReceipt = async (id: string) => {
    await supabase.from('bills').update({ status: 'paid' }).eq('id', id);
    fetchAllData();
  };

  const handleDeleteReceipt = async (id: string) => {
    await supabase.from('bills').delete().eq('id', id);
    fetchAllData();
  };

  const handleAddRequest = async (e: React.FormEvent<HTMLFormElement>, residentId?: string) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const request = {
      user_id: (formData.get('user_id') as string) || residentId,
      topic: formData.get('topic') as string,
      description: formData.get('description') as string,
      status: 'new' as const,
    };

    const { error } = await supabase.from('requests').insert(request);
    if (!error) {
      fetchAllData();
      (e.target as HTMLFormElement).reset();
    }
  };

  const handleUpdateRequestStatus = async (id: string, status: RequestStatus) => {
    await supabase.from('requests').update({ status }).eq('id', id);
    fetchAllData();
  };

  const handleAssignMaster = async (id: string, master: string) => {
    await supabase.from('requests').update({ master }).eq('id', id);
    fetchAllData();
  };

  const handleDeleteRequest = async (id: string) => {
    await supabase.from('requests').delete().eq('id', id);
    fetchAllData();
  };

  return {
    residents,
    meters,
    meterReadings,
    receipts,
    requests,
    loading,
    fetchAllData,
    handleDeleteResident,
    handleAddMeter,
    handleDeleteMeter,
    handleSubmitReading,
    handleAddReceipt,
    handleGenerateBills,
    handlePayReceipt,
    handleDeleteReceipt,
    handleAddRequest,
    handleUpdateRequestStatus,
    handleAssignMaster,
    handleDeleteRequest,
  };
}
