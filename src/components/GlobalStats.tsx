import { Users, CheckCircle, AlertCircle, Clock } from 'lucide-react'
import { ONBOARDING_STEPS } from '../data/steps'
import type { Client } from '../types/client'
import { daysSince } from '../utils/dates'

interface Props {
  clients: Client[]
}

export function GlobalStats({ clients }: Props) {
  const baseSteps = ONBOARDING_STEPS.filter(s => !s.optional)
  const total = baseSteps.length

  const stats = clients.reduce(
    (acc, c) => {
      const days = daysSince(c.startDate)
      const completed = c.completedSteps.filter(id => baseSteps.some(s => s.id === id)).length
      const isDone = completed === total
      const isOverdue = !isDone && days > 30

      return {
        total: acc.total + 1,
        done: acc.done + (isDone ? 1 : 0),
        overdue: acc.overdue + (isOverdue ? 1 : 0),
        active: acc.active + (!isDone && !isOverdue ? 1 : 0),
      }
    },
    { total: 0, done: 0, overdue: 0, active: 0 }
  )

  const cards = [
    {
      label: 'Total clientes',
      value: stats.total,
      icon: Users,
      iconBg: 'bg-slate-600',
      cardBg: 'bg-slate-50',
      valueCls: 'text-slate-800',
      sub: 'Base completa',
      subCls: 'text-slate-500',
    },
    {
      label: 'En proceso',
      value: stats.active,
      icon: Clock,
      iconBg: 'bg-purple-600',
      cardBg: 'bg-purple-50',
      valueCls: 'text-purple-700',
      sub: 'Estado operativo',
      subCls: 'text-purple-500',
    },
    {
      label: 'Completados',
      value: stats.done,
      icon: CheckCircle,
      iconBg: 'bg-emerald-500',
      cardBg: 'bg-emerald-50',
      valueCls: 'text-emerald-700',
      sub: 'Bot productivo',
      subCls: 'text-emerald-500',
    },
    {
      label: 'Atrasados',
      value: stats.overdue,
      icon: AlertCircle,
      iconBg: 'bg-orange-500',
      cardBg: 'bg-orange-50',
      valueCls: 'text-orange-700',
      sub: stats.overdue > 0 ? 'Requiere atención' : 'Todo en término',
      subCls: stats.overdue > 0 ? 'text-orange-500' : 'text-emerald-500',
    },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
      {cards.map(card => (
        <div key={card.label} className={`${card.cardBg} rounded-2xl p-5 flex items-start justify-between`}>
          <div>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">{card.label}</p>
            <p className={`text-3xl font-bold ${card.valueCls}`}>{card.value}</p>
            <p className={`text-xs mt-1 font-medium ${card.subCls}`}>{card.sub}</p>
          </div>
          <div className={`${card.iconBg} rounded-xl p-2.5 flex-shrink-0`}>
            <card.icon size={18} className="text-white" />
          </div>
        </div>
      ))}
    </div>
  )
}
