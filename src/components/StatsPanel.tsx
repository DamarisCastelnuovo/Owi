import { useState } from 'react'
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
  return !done && days > 30
}

function isDone(c: Client) {
  return c.completedSteps.filter(id => BASE_STEPS.some(s => s.id === id)).length === BASE_STEPS.length
}

function polarToCart(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

function arcPath(cx: number, cy: number, outerR: number, innerR: number, start: number, end: number) {
  // Handle near-full circle to avoid degenerate path
  const clampedEnd = end >= 360 ? 359.999 : end
  const oStart = polarToCart(cx, cy, outerR, start)
  const oEnd   = polarToCart(cx, cy, outerR, clampedEnd)
  const iStart = polarToCart(cx, cy, innerR, start)
  const iEnd   = polarToCart(cx, cy, innerR, clampedEnd)
  const large  = clampedEnd - start > 180 ? 1 : 0
  return [
    `M ${oStart.x} ${oStart.y}`,
    `A ${outerR} ${outerR} 0 ${large} 1 ${oEnd.x} ${oEnd.y}`,
    `L ${iEnd.x} ${iEnd.y}`,
    `A ${innerR} ${innerR} 0 ${large} 0 ${iStart.x} ${iStart.y}`,
    'Z',
  ].join(' ')
}

function DonutChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  const [hovered, setHovered] = useState<number | null>(null)
  const total = data.reduce((s, d) => s + d.value, 0)

  if (total === 0) return <p className="text-gray-400 text-sm text-center py-8">Sin datos</p>

  const cx = 110, cy = 110, outerR = 90, innerR = 58
  let currentAngle = 0

  const segments = data
    .filter(d => d.value > 0)
    .map((d, i) => {
      const angle = (d.value / total) * 360
      const seg = { ...d, startAngle: currentAngle, endAngle: currentAngle + angle, index: i }
      currentAngle += angle
      return seg
    })

  const hov = hovered !== null ? segments[hovered] ?? null : null

  return (
    <div className="flex flex-col sm:flex-row items-center gap-8">
      <div className="relative flex-shrink-0 w-64 h-64">
        <svg viewBox="0 0 220 220" className="w-full h-full">
          {/* bg ring when empty */}
          <circle cx={cx} cy={cy} r={(outerR + innerR) / 2} fill="none" stroke="#f3f4f6" strokeWidth={outerR - innerR} />
          {segments.map((seg, i) => (
            <path
              key={seg.label}
              d={arcPath(cx, cy, outerR, innerR, seg.startAngle, seg.endAngle)}
              fill={seg.color}
              opacity={hovered === null || hovered === i ? 1 : 0.35}
              className="cursor-pointer transition-opacity duration-150"
              style={{ filter: hovered === i ? 'brightness(1.12)' : undefined }}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
          {hov ? (
            <>
              <span className="text-3xl font-bold text-gray-800">{hov.value}</span>
              <span
                className="text-xs font-medium mt-0.5 px-3 text-center leading-tight"
                style={{ color: hov.color }}
              >
                {hov.label}
              </span>
              <span className="text-xs text-gray-400 mt-0.5">
                {Math.round((hov.value / total) * 100)}%
              </span>
            </>
          ) : (
            <>
              <span className="text-3xl font-bold text-gray-800">{total}</span>
              <span className="text-xs text-gray-400 mt-0.5">clientes</span>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {segments.map((seg, i) => (
          <div
            key={seg.label}
            className={`flex items-center gap-3 px-3 py-2 rounded-xl cursor-default transition-colors ${
              hovered === i ? 'bg-gray-100' : 'hover:bg-gray-50'
            }`}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
          >
            <span className="w-3.5 h-3.5 rounded-full flex-shrink-0" style={{ backgroundColor: seg.color }} />
            <span className="text-sm text-gray-700 min-w-[90px]">{seg.label}</span>
            <span className="text-sm font-bold text-gray-800">{seg.value}</span>
            <span className="text-xs text-gray-400">({Math.round((seg.value / total) * 100)}%)</span>
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
              style={{ width: d.value > 0 ? `${(d.value / max) * 100}%` : '0%', backgroundColor: d.color }}
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
    { label: 'En proceso', value: activeCount, color: '#9333ea' },
    { label: 'Completados', value: completedCount, color: '#22c55e' },
    { label: 'Atrasados', value: overdueCount, color: '#ef4444' },
  ]

  const stepData = BASE_STEPS.map(step => ({
    label: step.label,
    value: clients.filter(c => c.currentStepId === step.id).length,
    color: '#9333ea',
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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total clientes', value: total, color: 'text-gray-800', bg: 'bg-gray-50' },
          { label: 'En proceso', value: activeCount, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Completados', value: completedCount, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Promedio días activo', value: avgDays, color: 'text-teal-600', bg: 'bg-teal-50' },
        ].map(card => (
          <div key={card.label} className={`${card.bg} rounded-2xl p-5`}>
            <p className={`text-3xl font-bold ${card.color}`}>{card.value}</p>
            <p className="text-xs text-gray-500 mt-1">{card.label}</p>
          </div>
        ))}
      </div>

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

      {recentlyActive.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
            Clientes activos más recientes
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
                      overdue ? 'bg-red-100 text-red-600' : 'bg-purple-100 text-purple-700'
                    }`}>
                      {overdue ? `Atrasado ${days - 30}d` : `Día háb. ${days}`}
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
