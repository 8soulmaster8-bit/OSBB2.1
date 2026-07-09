import { useState, useEffect } from 'react'
import { supabase, Request as RequestType, Profile } from '../lib/supabase'

const statusLabels: Record<string, string> = {
  new: 'Нова',
  in_progress: 'В роботі',
  completed: 'Виконано',
}

export default function AdminRequests() {
  const [requests, setRequests] = useState<(RequestType & { profiles: Profile })[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'new' | 'in_progress' | 'completed'>('all')
  const [editingRequest, setEditingRequest] = useState<string | null>(null)
  const [masterName, setMasterName] = useState('')

  useEffect(() => {
    fetchRequests()
  }, [])

  const fetchRequests = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('requests')
      .select('*, profiles(*)')
      .order('created_at', { ascending: false })

    if (data) setRequests(data as (RequestType & { profiles: Profile })[])
    setLoading(false)
  }

  const handleStatusChange = async (requestId: string, status: string, master?: string) => {
    const updateData: Record<string, string | undefined> = { status }
    if (master) updateData.master = master

    await supabase.from('requests').update(updateData).eq('id', requestId)
    fetchRequests()
    setEditingRequest(null)
    setMasterName('')
  }

  const filteredRequests = requests.filter(r => filter === 'all' || r.status === filter)

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      new: 'bg-blue-100 text-blue-700',
      in_progress: 'bg-yellow-100 text-yellow-700',
      completed: 'bg-green-100 text-green-700',
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {statusLabels[status]}
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Заявки</h2>
        <div className="text-sm text-gray-500">
          {requests.filter(r => r.status === 'new').length} нових
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg ${filter === 'all' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700'}`}
        >
          Всі
        </button>
        <button
          onClick={() => setFilter('new')}
          className={`px-4 py-2 rounded-lg ${filter === 'new' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
        >
          Нові
        </button>
        <button
          onClick={() => setFilter('in_progress')}
          className={`px-4 py-2 rounded-lg ${filter === 'in_progress' ? 'bg-yellow-600 text-white' : 'bg-gray-100 text-gray-700'}`}
        >
          В роботі
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`px-4 py-2 rounded-lg ${filter === 'completed' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700'}`}
        >
          Виконані
        </button>
      </div>

      <div className="space-y-4">
        {filteredRequests.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <p className="text-gray-500">Заявок немає</p>
          </div>
        ) : (
          filteredRequests.map(req => (
            <div key={req.id} className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-lg font-semibold">{req.topic}</h3>
                    {getStatusBadge(req.status)}
                  </div>
                  <p className="text-sm text-gray-500">
                    {req.profiles?.full_name} • кв. {req.profiles?.apartment_number}
                  </p>
                </div>
                <div className="text-sm text-gray-400">
                  {new Date(req.created_at).toLocaleDateString('uk-UA')}
                </div>
              </div>

              {req.description && (
                <p className="text-gray-600 mb-4">{req.description}</p>
              )}

              {req.master && (
                <p className="text-sm text-gray-500 mb-4">Майстер: {req.master}</p>
              )}

              <div className="flex gap-2 pt-4 border-t">
                {req.status === 'new' && (
                  <>
                    <button
                      onClick={() => {
                        setEditingRequest(req.id)
                        setMasterName('')
                      }}
                      className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 text-sm"
                    >
                      Взяти в роботу
                    </button>
                    <button
                      onClick={() => handleStatusChange(req.id, 'completed')}
                      className="px-3 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 text-sm"
                    >
                      Виконано
                    </button>
                  </>
                )}

                {req.status === 'in_progress' && (
                  <button
                    onClick={() => handleStatusChange(req.id, 'completed')}
                    className="px-3 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 text-sm"
                  >
                    Позначити виконаним
                  </button>
                )}
              </div>

              {editingRequest === req.id && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Призначити майстра
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={masterName}
                      onChange={e => setMasterName(e.target.value)}
                      placeholder="Ім'я майстра"
                      className="flex-1 px-3 py-2 border rounded-lg"
                    />
                    <button
                      onClick={() => handleStatusChange(req.id, 'in_progress', masterName || undefined)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Підтвердити
                    </button>
                    <button
                      onClick={() => setEditingRequest(null)}
                      className="px-4 py-2 border rounded-lg hover:bg-gray-100"
                    >
                      Скасувати
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
