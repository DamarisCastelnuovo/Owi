import { Calendar, ChevronRight, Trash2 } from 'lucide-react'
import { ONBOARDING_STEPS } from '../data/steps'
import type { Client } from '../types/client'
import { daysSince, formatDate } from '../utils/dates'

interface Props {
  client: Client
  onClick: () => void
  onDelete: () => void
}

export function ClientCard({ client, onClick, onDelete }: Props) {
  const days = daysSince(client.startDate)
  const baseSteps = ONBOARDING_STEPS.filter(s => !s.optional)
  const completed = client.completedSteps.filter(id => baseSteps.some(s => s.id === id)).length
  const total = baseSteps.length
  const progress = Math.round((completed / total) * 100)
  const currentStep = ONBOARDING_STEPS.find(s => s.id === client.currentStepId)
  const isDone = completed === total
  const isOverdue = !isDone && !!currentStep && !currentStep.optional && days > currentStep.day

  const statusColor = isDone
    ? 'bg-green-50 border-green-200'
    : isOverdue
    ? 'bg-red-50 border-red-200'
    : 'bg-white border-gray-200'

  const badgeColor = isDone
    ? 'bg-green-100 text-green-700'
    : isOverdue
    ? 'bg-red-100 text-red-600'
    : days > 20
    ? 'bg-yellow-100 text-yellow-700'
    : 'bg-blue-100 text-blue-700'

  const badgeText = isDone ? 'Completado' : isOverdue ? 'Atrasado' : `Día ${days}`

  return (
    <div
      className={`rounded-xl border ${statusColor} p-4 cursor-pointer hover:shadow-md transition-all group`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-gray-800 truncate">{client.name}</h3>
            {isOverdue && (
              <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
              </span>
            )}
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badgeColor}`}>{badgeText}</span>
          </div>
          <p className="text-sm text-gray-500 truncate">{client.company}</p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={e => { e.stopPropagation(); onDelete() }}
            className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
          >
            <Trash2 size={14} />
          </button>
          <ChevronRight size={16} className="text-gray-400" />
        </div>
      </div>

      <div className="mt-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-gray-500">{completed}/{total} pasos</span>
          <span className="text-xs font-medium text-gray-600">{progress}%</span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${isDone ? 'bg-green-500' : isOverdue ? 'bg-red-400' : 'bg-blue-500'}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {!isDone && currentStep && (
        <p className="text-xs text-gray-500 mt-2 truncate">
          <span className="text-gray-400">En curso:</span> {currentStep.label}
        </p>
      )}

      <div className="flex items-center gap-1 mt-2 text-xs text-gray-400">
        <Calendar size={11} />
        <span>Inicio: {formatDate(client.startDate)}</span>
      </div>
    </div>
  )
}
