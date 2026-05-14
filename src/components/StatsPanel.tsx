import { ONBOARDING_STEPS } from '../data/steps'
import type { Client } from '../types/client'
import { daysSince } from '../utils/dates'

interface Props {
  clients: Client[]
}

const BASE_STEPS = ONBOARDING_STEPS.filter(s => !s.optional)

function isOverdue(c: Client) {
  const days = daysSince(c.startDate)
  const done = c.completedSteps.filter(id => BASE_STEPS.some(s => s.id === id)).length === BASE_STEPS.length
  const step = ONBOARDING_STEPS.find(s => s.id === c.currentStepId)
  return !done && !!step && !step.optional && days > step.day
}

function isDone(c: Client) {
  return c.completedSteps.filter(id => BASE_STEPS.some(s => s.id === id)).length === BASE_STEPS.length
}

function DonutChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0)
  if (total === 0) return <p className="text-gray-400 text-sm text-center py-8">Sin datos</p>

  const r = 36
  const C = 2 * Math.PI * r
  let running = 0

  return (
    <div className="flex items-center gap-8">
      <div className="relative flex-shrink-0 w-36 h-36">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <circle cx={50} cy={50} r={r} fill="none" stroke="#f3f4f6" strokeWidth={14} />
          {data.filter(d => d.value > 0).map(d => {
            const arc = (d.value / total) * C
            const offset = running
            running += arc
            return (
              <circle
                key={d.label}
                cx={50} cy={50} r={r}
                fill="none"
                stroke={d.color}
                strokeWidth={14}
                strokeLinecap="butt"
                strokeDasharray={`${arc} ${C}`}
                strokeDashoffset={-offset}
                transform="rotate(-90 50 50)"
              />
            )
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-bold text-gray-800">{total}</span>
          <span className="text-xs text-gray-400">clientes</span>
        </div>
      </div>
      <div className="flex flex-col gap-2.5">
        {data.map(d => (
          <div key={d.label} className="flex items-center gap-2.5">
            <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
            <span className="text-sm text-gray-600">
              {d.label}: <strong className="text-gray-800">{d.value}</strong>
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function HorizontalBars({ data }: { data: { label: string; value: number; color: string }[] }) {
  const max = Math.max(...data.map(d => d.value), 1)
  return (
    <div className="flex flex-col gap-3">
      {data.map(d => (
        <div key={d.label} className="flex items-center gap-3">
          <span className="text-xs text-gray-500 w-40 flex-shrink-0 truncate text-right" title={d.label}>
            {d.label}
          </span>
          <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: d.value > 0 ? `${(d.value / max) * 100}%` : '2%', backgroundColor: d.color, minWidth: d.value > 0 ? undefined : 0 }}
            />
          </div>
          <span className="text-xs font-semibold text-gray-700 w-5 text-right flex-shrink-0">{d.value}</span>
        </div>
      ))}
    </div>
  )
}

export function StatsPanel({ clients }: Props) {
  const total = clients.length
  const completedCount = clients.filter(isDone).length
  const overdueCount = clients.filter(isOverdue).length
  const activeCount = total - completedCount - overdueCount

  const statusData = [
    { label: 'En proceso', value: activeCount, color: '#3b82f6' },
    { label: 'Completados', value: completedCount, color: '#22c55e' },
    { label: 'Atrasados', value: overdueCount, color: '#ef4444' },
  ]

  const stepData = BASE_STEPS.map(step => ({
    label: step.label,
    value: clients.filter(c => c.currentStepId === step.id).length,
    color: '#6366f1',
  }))

  const recentlyActive = clients
    .filter(c => !isDone(c))
    .sort((a, b) => daysSince(a.startDate) - daysSince(b.startDate))
    .slice(0, 5)

  const avgDays = total > 0
    ? Math.round(clients.reduce((s, c) => s + daysSince(c.startDate), 0) / total)
    : 0

  return (
    <div className="space-y-6">
      {/* Summary strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total clientes', value: total, color: 'text-gray-800', bg: 'bg-gray-50' },
          { label: 'En proceso', value: activeCount, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Completados', value: completedCount, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Promedio días activo', value: avgDays, color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map(card => (
          <div key={card.label} className={`${card.bg} rounded-2xl p-5`}>
            <p className={`text-3xl font-bold ${card.color}`}>{card.value}</p>
            <p className="text-xs text-gray-500 mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-5">
            Resumen de estado
          </h3>
          <DonutChart data={statusData} />
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-5">
            Clientes por etapa
          </h3>
          <HorizontalBars data={stepData} />
        </div>
      </div>

      {/* Active clients table */}
      {recentlyActive.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
            Clientes más recientes sin completar
          </h3>
          <div className="divide-y divide-gray-100">
            {recentlyActive.map(c => {
              const step = ONBOARDING_STEPS.find(s => s.id === c.currentStepId)
              const days = daysSince(c.startDate)
              const overdue = isOverdue(c)
              return (
                <div key={c.id} className="py-3 flex items-center gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-800 truncate">{c.company}</p>
                    <p className="text-xs text-gray-400 truncate">{step?.label ?? '—'}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {overdue && (
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
                      </span>
                    )}
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      overdue ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-700'
                    }`}>
                      Día {days}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
