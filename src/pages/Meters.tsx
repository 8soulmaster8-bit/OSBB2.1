import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase, Meter, MeterReading } from '../lib/supabase'

const meterTypeLabels: Record<string, string> = {
  water: 'Вода',
  hot_water: 'Гаряча вода',
  cold_water: 'Холодна вода',
  electricity: 'Електрика',
  gas: 'Газ',
}

export default function Meters() {
  const { profile } = useAuth()
  const [meters, setMeters] = useState<Meter[]>([])
  const [readings, setReadings] = useState<Record<string, MeterReading[]>>({})
  const [loading, setLoading] = useState(true)
  const [newReadings, setNewReadings] = useState<Record<string, string>>({})

  useEffect(() => {
    if (profile) {
      fetchData()
    }
  }, [profile])

  const fetchData = async () => {
    setLoading(true)

    const { data: metersData } = await supabase
      .from('meters')
      .select('*')
      .eq('user_id', profile!.id)

    if (metersData) {
      setMeters(metersData as Meter[])

      const readingsData: Record<string, MeterReading[]> = {}
      for (const meter of metersData) {
        const { data } = await supabase
          .from('meter_readings')
          .select('*')
          .eq('meter_id', meter.id)
          .order('reading_date', { ascending: false })
          .limit(10)
        readingsData[meter.id] = (data || []) as MeterReading[]
      }
      setReadings(readingsData)
    }

    setLoading(false)
  }

  const submitReading = async (meterId: string) => {
    const value = newReadings[meterId]
    if (!value || isNaN(Number(value))) return

    const reading = Number(value)
    await supabase.from('meter_readings').insert({
      meter_id: meterId,
      reading: reading,
      reading_date: new Date().toISOString().split('T')[0],
    })

    await supabase
      .from('meters')
      .update({ current_reading: reading, reading_date: new Date().toISOString().split('T')[0] })
      .eq('id', meterId)

    setNewReadings({ ...newReadings, [meterId]: '' })
    fetchData()
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
      <h2 className="text-2xl font-bold text-gray-900">Лічильники</h2>

      {meters.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <p className="text-gray-500">Лічильників поки немає</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {meters.map(meter => (
            <div key={meter.id} className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold">{meterTypeLabels[meter.type] || meter.type}</h3>
                  <p className="text-sm text-gray-500">
                    Поточні покази: <span className="font-medium text-gray-900">{meter.current_reading}</span>
                  </p>
                  <p className="text-sm text-gray-500">
                    Дата: {new Date(meter.reading_date).toLocaleDateString('uk-UA')}
                  </p>
                </div>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Нові покази"
                    value={newReadings[meter.id] || ''}
                    onChange={e => setNewReadings({ ...newReadings, [meter.id]: e.target.value })}
                    className="px-3 py-2 border rounded-lg w-32 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    onClick={() => submitReading(meter.id)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Подати
                  </button>
                </div>
              </div>

              {readings[meter.id] && readings[meter.id].length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Історія показів</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-gray-500">Покази</th>
                          <th className="px-4 py-2 text-left text-gray-500">Дата</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {readings[meter.id].map(r => (
                          <tr key={r.id}>
                            <td className="px-4 py-2 font-medium">{r.reading}</td>
                            <td className="px-4 py-2 text-gray-500">
                              {new Date(r.reading_date).toLocaleDateString('uk-UA')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
