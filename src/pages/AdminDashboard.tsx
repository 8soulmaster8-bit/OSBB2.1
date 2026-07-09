import { useState, useEffect } from 'react'
import { supabase, Profile, Bill, Request as RequestType } from '../lib/supabase'

interface AdminStats {
  totalUsers: number
  totalBills: number
  unpaidBills: number
  totalRequests: number
  newRequests: number
  totalRevenue: number
  pendingRevenue: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [recentUsers, setRecentUsers] = useState<Profile[]>([])
  const [recentRequests, setRecentRequests] = useState<RequestType[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    setLoading(true)

    const [usersRes, billsRes, requestsRes] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact' }).order('created_at', { ascending: false }).limit(5),
      supabase.from('bills').select('*'),
      supabase.from('requests').select('*, profiles(full_name, apartment_number)').order('created_at', { ascending: false }).limit(10),
    ])

    const users = (usersRes.data || []) as Profile[]
    const bills = (billsRes.data || []) as Bill[]
    const requests = (requestsRes.data || []) as RequestType[]

    setRecentUsers(users)
    setRecentRequests(requests)

    const paidBills = bills.filter(b => b.status === 'paid')
    const unpaidBills = bills.filter(b => b.status === 'unpaid')

    setStats({
      totalUsers: usersRes.count || users.length,
      totalBills: bills.length,
      unpaidBills: unpaidBills.length,
      totalRequests: requests.length,
      newRequests: requests.filter(r => r.status === 'new').length,
      totalRevenue: paidBills.reduce((sum, b) => sum + Number(b.amount), 0),
      pendingRevenue: unpaidBills.reduce((sum, b) => sum + Number(b.amount), 0),
    })

    setLoading(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      new: 'bg-blue-100 text-blue-700',
      in_progress: 'bg-yellow-100 text-yellow-700',
      completed: 'bg-green-100 text-green-700',
    }
    const labels: Record<string, string> = {
      new: 'Нова',
      in_progress: 'В роботі',
      completed: 'Виконано',
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {labels[status]}
      </span>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Панель управління</h2>
        <p className="text-gray-500">Огляд системи ОСББ</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-blue-500">
          <p className="text-sm text-gray-500">Користувачів</p>
          <p className="text-3xl font-bold text-gray-900">{stats?.totalUsers || 0}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-red-500">
          <p className="text-sm text-gray-500">Неоплачені рахунки</p>
          <p className="text-3xl font-bold text-gray-900">{stats?.unpaidBills || 0}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-yellow-500">
          <p className="text-sm text-gray-500">Нові заявки</p>
          <p className="text-3xl font-bold text-gray-900">{stats?.newRequests || 0}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-green-500">
          <p className="text-sm text-gray-500">До сплати</p>
          <p className="text-3xl font-bold text-gray-900">{stats?.pendingRevenue?.toLocaleString() || 0} грн</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">Останні користувачі</h3>
          {recentUsers.length === 0 ? (
            <p className="text-gray-500 text-center py-4">Немає користувачів</p>
          ) : (
            <div className="space-y-3">
              {recentUsers.map(user => (
                <div key={user.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{user.full_name}</p>
                    <p className="text-sm text-gray-500">кв. {user.apartment_number}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                    {user.role === 'admin' ? 'Адмін' : 'Користувач'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">Останні заявки</h3>
          {recentRequests.length === 0 ? (
            <p className="text-gray-500 text-center py-4">Немає заявок</p>
          ) : (
            <div className="space-y-3">
              {recentRequests.map(req => (
                <div key={req.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{req.topic}</p>
                    <p className="text-sm text-gray-500 truncate max-w-xs">{req.description}</p>
                  </div>
                  {statusBadge(req.status)}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
