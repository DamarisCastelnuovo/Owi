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
      const isOverdue = days > 30 && !isDone

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
    { label: 'Total clientes', value: stats.total, icon: Users, color: 'text-gray-600', bg: 'bg-gray-50' },
    { label: 'En proceso', value: stats.active, icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Completados', value: stats.done, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Atrasados', value: stats.overdue, icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-50' },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      {cards.map(card => (
        <div key={card.label} className={`${card.bg} rounded-xl p-4`}>
          <div className="flex items-center gap-2 mb-2">
            <card.icon size={16} className={card.color} />
            <span className="text-xs text-gray-500">{card.label}</span>
          </div>
          <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
        </div>
      ))}
    </div>
  )
}
