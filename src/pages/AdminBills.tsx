import { useState, useEffect } from 'react'
import { supabase, Bill, Profile } from '../lib/supabase'

export default function AdminBills() {
  const [bills, setBills] = useState<(Bill & { profiles: Profile })[]>([])
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [filter, setFilter] = useState<'all' | 'paid' | 'unpaid'>('all')

  const [newBill, setNewBill] = useState({
    user_id: '',
    month: '',
    amount: '',
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)

    const [billsRes, usersRes] = await Promise.all([
      supabase.from('bills').select('*, profiles(*)').order('created_at', { ascending: false }),
      supabase.from('profiles').select('*'),
    ])

    if (billsRes.data) setBills(billsRes.data as (Bill & { profiles: Profile })[])
    if (usersRes.data) setUsers(usersRes.data as Profile[])

    setLoading(false)
  }

  const handleCreateBill = async () => {
    if (!newBill.user_id || !newBill.month || !newBill.amount) return

    await supabase.from('bills').insert({
      user_id: newBill.user_id,
      month: newBill.month,
      amount: Number(newBill.amount),
      status: 'unpaid',
    })

    setNewBill({ user_id: '', month: '', amount: '' })
    setShowModal(false)
    fetchData()
  }

  const handleMarkPaid = async (billId: string) => {
    await supabase.from('bills').update({ status: 'paid' }).eq('id', billId)
    fetchData()
  }

  const filteredBills = bills.filter(b => filter === 'all' || b.status === filter)

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      paid: 'bg-green-100 text-green-700',
      unpaid: 'bg-red-100 text-red-700',
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {status === 'paid' ? 'Сплачено' : 'Не сплачено'}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  const currentMonth = new Date().toISOString().slice(0, 7)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Рахунки</h2>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Новий рахунок
        </button>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg ${filter === 'all' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700'}`}
        >
          Всі
        </button>
        <button
          onClick={() => setFilter('unpaid')}
          className={`px-4 py-2 rounded-lg ${filter === 'unpaid' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700'}`}
        >
          Неоплачені
        </button>
        <button
          onClick={() => setFilter('paid')}
          className={`px-4 py-2 rounded-lg ${filter === 'paid' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700'}`}
        >
          Сплачені
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Користувач</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Місяць</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Сума</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Статус</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Дії</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredBills.map(bill => (
              <tr key={bill.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div>
                    <p className="font-medium">{bill.profiles?.full_name || 'Невідомо'}</p>
                    <p className="text-sm text-gray-500">кв. {bill.profiles?.apartment_number}</p>
                  </div>
                </td>
                <td className="px-6 py-4">{bill.month}</td>
                <td className="px-6 py-4 font-medium">{Number(bill.amount).toLocaleString()} грн</td>
                <td className="px-6 py-4">{getStatusBadge(bill.status)}</td>
                <td className="px-6 py-4">
                  {bill.status === 'unpaid' && (
                    <button
                      onClick={() => handleMarkPaid(bill.id)}
                      className="text-green-600 hover:text-green-700 text-sm font-medium"
                    >
                      Позначити сплаченим
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Новий рахунок</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Користувач</label>
                <select
                  value={newBill.user_id}
                  onChange={e => setNewBill({ ...newBill, user_id: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Оберіть користувача</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.full_name} (кв. {u.apartment_number})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Місяць</label>
                <input
                  type="month"
                  value={newBill.month}
                  onChange={e => setNewBill({ ...newBill, month: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Сума (грн)</label>
                <input
                  type="number"
                  value={newBill.amount}
                  onChange={e => setNewBill({ ...newBill, amount: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="1500"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Скасувати
              </button>
              <button
                onClick={handleCreateBill}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Створити
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
