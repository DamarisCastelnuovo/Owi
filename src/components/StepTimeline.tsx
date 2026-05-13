import { Check, Clock } from 'lucide-react'
import { ONBOARDING_STEPS } from '../data/steps'
import type { Client } from '../types/client'
import { daysSince } from '../utils/dates'

interface Props {
  client: Client
  onToggleStep: (stepId: string, completed: boolean) => void
  onSetCurrent: (stepId: string) => void
  compact?: boolean
}

export function StepTimeline({ client, onToggleStep, onSetCurrent, compact = false }: Props) {
  const days = daysSince(client.startDate)
  const baseSteps = ONBOARDING_STEPS.filter(s => !s.optional)
  const extraSteps = ONBOARDING_STEPS.filter(s => s.optional)

  function getStepStatus(stepId: string, stepDay: number) {
    if (client.completedSteps.includes(stepId)) return 'done'
    if (client.currentStepId === stepId) return 'current'
    if (days > stepDay) return 'overdue'
    return 'pending'
  }

  const stepColor = (status: string) => {
    if (status === 'done')    return 'bg-green-500 border-green-500 text-white'
    if (status === 'current') return 'bg-blue-500 border-blue-500 text-white'
    if (status === 'overdue') return 'bg-red-400 border-red-400 text-white'
    return 'bg-white border-gray-300 text-gray-400'
  }

  const labelColor = (status: string) => {
    if (status === 'done')    return 'text-green-700'
    if (status === 'current') return 'text-blue-700 font-semibold'
    if (status === 'overdue') return 'text-red-600'
    return 'text-gray-500'
  }

  function renderStep(step: typeof ONBOARDING_STEPS[0], isLast: boolean) {
    const status = getStepStatus(step.id, step.day)
    const isDone = status === 'done'

    return (
      <div key={step.id} className="flex gap-3 group">
        <div className="flex flex-col items-center">
          <button
            onClick={() => {
              onToggleStep(step.id, !isDone)
              if (!isDone) onSetCurrent(step.id)
            }}
            className={`w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${stepColor(status)} hover:scale-110`}
            title={isDone ? 'Marcar como pendiente' : 'Marcar como completado'}
          >
            {isDone ? <Check size={14} /> : status === 'current' ? <Clock size={12} /> : null}
          </button>
          {!isLast && <div className={`w-0.5 flex-1 mt-1 ${isDone ? 'bg-green-300' : 'bg-gray-200'}`} style={{ minHeight: compact ? 16 : 24 }} />}
        </div>
        <div className={`pb-${compact ? 2 : 4} flex-1 min-w-0`}>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-${compact ? 'xs' : 'sm'} ${labelColor(status)}`}>
              {step.emoji && <span className="mr-1">{step.emoji}</span>}
              {step.label}
            </span>
            <span className="text-xs text-gray-400">Día {step.day}</span>
            {status === 'overdue' && !isDone && (
              <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">Atrasado</span>
            )}
            {status === 'current' && (
              <span className="text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full">En curso</span>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className={compact ? 'space-y-0' : 'space-y-0'}>
        {baseSteps.map((step, i) => renderStep(step, i === baseSteps.length - 1 && extraSteps.length === 0))}
      </div>
      {extraSteps.length > 0 && (
        <div className="mt-3 pt-3 border-t border-dashed border-gray-300">
          <p className="text-xs text-gray-400 mb-2 uppercase tracking-wide">Etapas opcionales</p>
          {extraSteps.map((step, i) => renderStep(step, i === extraSteps.length - 1))}
        </div>
      )}
    </div>
  )
}
