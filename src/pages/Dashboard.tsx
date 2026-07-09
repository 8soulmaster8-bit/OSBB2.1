import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase, Bill, Meter, Request } from '../lib/supabase'

export default function Dashboard() {
  const { profile } = useAuth()
  const [bills, setBills] = useState<Bill[]>([])
  const [meters, setMeters] = useState<Meter[]>([])
  const [requests, setRequests] = useState<Request[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (profile) {
      fetchData()
    }
  }, [profile])

  const fetchData = async () => {
    setLoading(true)

    const [billsRes, metersRes, requestsRes] = await Promise.all([
      supabase.from('bills').select('*').eq('user_id', profile!.id).order('created_at', { ascending: false }).limit(5),
      supabase.from('meters').select('*').eq('user_id', profile!.id),
      supabase.from('requests').select('*').eq('user_id', profile!.id).order('created_at', { ascending: false }).limit(5),
    ])

    if (billsRes.data) setBills(billsRes.data as Bill[])
    if (metersRes.data) setMeters(metersRes.data as Meter[])
    if (requestsRes.data) setRequests(requestsRes.data as Request[])

    setLoading(false)
  }

  const unpaidTotal = bills.filter(b => b.status === 'unpaid').reduce((sum, b) => sum + Number(b.amount), 0)

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      paid: 'bg-green-100 text-green-700',
      unpaid: 'bg-red-100 text-red-700',
      new: 'bg-blue-100 text-blue-700',
      in_progress: 'bg-yellow-100 text-yellow-700',
      completed: 'bg-green-100 text-green-700',
    }
    const labels: Record<string, string> = {
      paid: 'Сплачено',
      unpaid: 'Не сплачено',
      new: 'Нова',
      in_progress: 'В роботі',
      completed: 'Виконано',
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-700'}`}>
        {labels[status] || status}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Вітаємо, {profile?.full_name || 'Користувач'}!</h2>
        <p className="text-gray-500">Квартира №{profile?.apartment_number}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">До сплати</p>
              <p className="text-2xl font-bold text-gray-900">{unpaidTotal.toLocaleString()} грн</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Лічильників</p>
              <p className="text-2xl font-bold text-gray-900">{meters.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Активних заявок</p>
              <p className="text-2xl font-bold text-gray-900">
                {requests.filter(r => r.status !== 'completed').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">Останні рахунки</h3>
          {bills.length === 0 ? (
            <p className="text-gray-500 text-center py-4">Немає рахунків</p>
          ) : (
            <div className="space-y-3">
              {bills.map(bill => (
                <div key={bill.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{bill.month}</p>
                    <p className="text-sm text-gray-500">{Number(bill.amount).toLocaleString()} грн</p>
                  </div>
                  {getStatusBadge(bill.status)}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">Останні заявки</h3>
          {requests.length === 0 ? (
            <p className="text-gray-500 text-center py-4">Немає заявок</p>
          ) : (
            <div className="space-y-3">
              {requests.map(req => (
                <div key={req.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{req.topic}</p>
                    <p className="text-sm text-gray-500 truncate max-w-xs">{req.description}</p>
                  </div>
                  {getStatusBadge(req.status)}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
