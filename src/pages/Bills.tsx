import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase, Bill } from '../lib/supabase'

export default function Bills() {
  const { profile } = useAuth()
  const [bills, setBills] = useState<Bill[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (profile) {
      fetchBills()
    }
  }, [profile])

  const fetchBills = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('bills')
      .select('*')
      .eq('user_id', profile!.id)
      .order('created_at', { ascending: false })

    if (data) setBills(data as Bill[])
    setLoading(false)
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      paid: 'bg-green-100 text-green-700',
      unpaid: 'bg-red-100 text-red-700',
    }
    const labels: Record<string, string> = {
      paid: 'Сплачено',
      unpaid: 'Не сплачено',
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {labels[status]}
      </span>
    )
  }

  const unpaidTotal = bills.filter(b => b.status === 'unpaid').reduce((sum, b) => sum + Number(b.amount), 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Рахунки</h2>
        <div className="text-right">
          <p className="text-sm text-gray-500">До сплати</p>
          <p className="text-xl font-bold text-red-600">{unpaidTotal.toLocaleString()} грн</p>
        </div>
      </div>

      {bills.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <p className="text-gray-500">Рахунків поки немає</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Місяць</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Сума</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Статус</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Дата</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {bills.map(bill => (
                <tr key={bill.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap font-medium">{bill.month}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{Number(bill.amount).toLocaleString()} грн</td>
                  <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(bill.status)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                    {new Date(bill.created_at).toLocaleDateString('uk-UA')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
