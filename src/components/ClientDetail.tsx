import { ArrowLeft, Calendar, Building2 } from 'lucide-react'
import { ONBOARDING_STEPS } from '../data/steps'
import { StepTimeline } from './StepTimeline'
import type { Client } from '../types/client'
import { daysSince, formatDate } from '../utils/dates'

interface Props {
  client: Client
  onBack: () => void
  onToggleStep: (stepId: string, completed: boolean) => void
  onSetCurrent: (stepId: string) => void
  onUpdateComment: (stepId: string, comment: string) => void
}

export function ClientDetail({ client, onBack, onToggleStep, onSetCurrent, onUpdateComment }: Props) {
  const days = daysSince(client.startDate)
  const baseSteps = ONBOARDING_STEPS.filter(s => !s.optional)
  const completed = client.completedSteps.filter(id => baseSteps.some(s => s.id === id)).length
  const total = baseSteps.length
  const progress = Math.round((completed / total) * 100)
  const isDone = completed === total
  const currentStep = ONBOARDING_STEPS.find(s => s.id === client.currentStepId)
  const isOverdue = !isDone && !!currentStep && !currentStep.optional && days > currentStep.day
  const daysLeft = Math.max(0, 30 - days)

  return (
    <div>
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-4 transition-colors"
      >
        <ArrowLeft size={16} />
        Volver al dashboard
      </button>

      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-xl font-bold text-gray-800">{client.name}</h2>
            <div className="flex items-center gap-1.5 text-gray-500 mt-1">
              <Building2 size={14} />
              <span className="text-sm">{client.company}</span>
            </div>
          </div>
          <div className="text-right flex items-center gap-2">
            {isOverdue && (
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
              </span>
            )}
            {isDone ? (
              <span className="inline-block bg-green-100 text-green-700 text-sm font-semibold px-3 py-1 rounded-full">
                Completado ✓
              </span>
            ) : isOverdue ? (
              <span className="inline-block bg-red-100 text-red-600 text-sm font-semibold px-3 py-1 rounded-full">
                Atrasado {days - (currentStep?.day ?? 30)}d
              </span>
            ) : (
              <span className="inline-block bg-purple-100 text-purple-700 text-sm font-semibold px-3 py-1 rounded-full">
                Día {days} de 30
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-5">
          <div className="text-center p-3 bg-gray-50 rounded-xl">
            <p className="text-2xl font-bold text-gray-800">{days}</p>
            <p className="text-xs text-gray-500 mt-0.5">Días activo</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-xl">
            <p className="text-2xl font-bold text-gray-800">{completed}/{total}</p>
            <p className="text-xs text-gray-500 mt-0.5">Pasos completados</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-xl">
            <p className={`text-2xl font-bold ${isOverdue ? 'text-red-500' : 'text-gray-800'}`}>
              {isDone ? '—' : daysLeft}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">Días restantes</p>
          </div>
        </div>

        <div className="mt-4">
          <div className="flex justify-between text-xs text-gray-500 mb-1.5">
            <span>Progreso del alta</span>
            <span className="font-medium">{progress}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${isDone ? 'bg-green-500' : isOverdue ? 'bg-red-400' : 'bg-purple-500'}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-1.5 mt-3 text-xs text-gray-400">
          <Calendar size={12} />
          <span>Inicio: {formatDate(client.startDate)}</span>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-4">
          Proceso de Alta
        </h3>
        <p className="text-xs text-gray-400 mb-4">
          Hacé clic en cada paso para marcarlo como completado · Tocá la burbuja para agregar un comentario
        </p>
        <StepTimeline
          client={client}
          onToggleStep={onToggleStep}
          onSetCurrent={onSetCurrent}
          onUpdateComment={onUpdateComment}
        />
      </div>
    </div>
  )
}
