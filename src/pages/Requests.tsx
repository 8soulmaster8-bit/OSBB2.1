import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase, Request as RequestType } from '../lib/supabase'

const statusLabels: Record<string, string> = {
  new: 'Нова',
  in_progress: 'В роботі',
  completed: 'Виконано',
}

export default function Requests() {
  const { profile } = useAuth()
  const [requests, setRequests] = useState<RequestType[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [topic, setTopic] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (profile) {
      fetchRequests()
    }
  }, [profile])

  const fetchRequests = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('requests')
      .select('*')
      .eq('user_id', profile!.id)
      .order('created_at', { ascending: false })

    if (data) setRequests(data as RequestType[])
    setLoading(false)
  }

  const handleSubmit = async () => {
    if (!topic.trim()) return

    setSubmitting(true)
    await supabase.from('requests').insert({
      user_id: profile!.id,
      topic: topic,
      description: description || null,
      status: 'new',
    })

    setTopic('')
    setDescription('')
    setShowModal(false)
    await fetchRequests()
    setSubmitting(false)
  }

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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Заявки</h2>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Нова заявка
        </button>
      </div>

      {requests.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <p className="text-gray-500">Заявок поки немає</p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
          >
            Створити першу заявку
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map(req => (
            <div key={req.id} className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-semibold">{req.topic}</h3>
                {getStatusBadge(req.status)}
              </div>
              {req.description && (
                <p className="text-gray-600 mb-3">{req.description}</p>
              )}
              <div className="flex gap-4 text-sm text-gray-500">
                <span>Створено: {new Date(req.created_at).toLocaleDateString('uk-UA')}</span>
                {req.master && <span>Майстер: {req.master}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Нова заявка</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Тема</label>
                <input
                  type="text"
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Наприклад: Протікання труби"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Опис</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={4}
                  placeholder="Опишіть проблему детальніше..."
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                Скасувати
              </button>
              <button
                onClick={handleSubmit}
                disabled={!topic.trim() || submitting}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? 'Зачекайте...' : 'Створити'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
