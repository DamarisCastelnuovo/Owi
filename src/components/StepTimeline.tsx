import { useState } from 'react'
import { Check, Clock, MessageCircle } from 'lucide-react'
import { ONBOARDING_STEPS } from '../data/steps'
import type { Client } from '../types/client'
import { daysSince } from '../utils/dates'

interface Props {
  client: Client
  onToggleStep: (stepId: string, completed: boolean) => void
  onSetCurrent: (stepId: string) => void
  onUpdateComment: (stepId: string, comment: string) => void
  compact?: boolean
}

export function StepTimeline({ client, onToggleStep, onSetCurrent, onUpdateComment, compact = false }: Props) {
  const days = daysSince(client.startDate)
  const baseSteps = ONBOARDING_STEPS.filter(s => !s.optional)
  const extraSteps = ONBOARDING_STEPS.filter(s => s.optional)
  const [openCommentStepId, setOpenCommentStepId] = useState<string | null>(null)
  const [draftComment, setDraftComment] = useState('')

  function toggleComment(stepId: string) {
    if (openCommentStepId === stepId) {
      setOpenCommentStepId(null)
    } else {
      setOpenCommentStepId(stepId)
      setDraftComment(client.stepComments?.[stepId] ?? '')
    }
  }

  function saveComment(stepId: string) {
    onUpdateComment(stepId, draftComment.trim())
    setOpenCommentStepId(null)
  }

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
    const hasComment = !!(client.stepComments?.[step.id])
    const isCommentOpen = openCommentStepId === step.id

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
          {!isLast && (
            <div
              className={`w-0.5 flex-1 mt-1 ${isDone ? 'bg-green-300' : 'bg-gray-200'}`}
              style={{ minHeight: compact ? 16 : 24 }}
            />
          )}
        </div>
        <div className={`${compact ? 'pb-2' : 'pb-4'} flex-1 min-w-0`}>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`${compact ? 'text-xs' : 'text-sm'} ${labelColor(status)}`}>
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
            <button
              onClick={() => toggleComment(step.id)}
              className={`p-0.5 rounded transition-colors ${
                hasComment ? 'text-blue-500 hover:text-blue-700' : 'text-gray-300 hover:text-gray-500'
              } ${isCommentOpen ? 'text-blue-600' : ''}`}
              title={hasComment ? 'Ver/editar comentario' : 'Agregar comentario'}
            >
              <MessageCircle size={13} fill={hasComment ? 'currentColor' : 'none'} />
            </button>
          </div>

          {hasComment && !isCommentOpen && (
            <p className="text-xs text-gray-500 mt-1 italic leading-snug">
              {client.stepComments[step.id]}
            </p>
          )}

          {isCommentOpen && (
            <div className="mt-2 flex flex-col gap-1.5">
              <textarea
                value={draftComment}
                onChange={e => setDraftComment(e.target.value)}
                placeholder="Agregar comentario..."
                rows={2}
                className="w-full text-xs border border-gray-300 rounded-lg px-2.5 py-1.5 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoFocus
                onKeyDown={e => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) saveComment(step.id)
                  if (e.key === 'Escape') setOpenCommentStepId(null)
                }}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => saveComment(step.id)}
                  className="text-xs bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Guardar
                </button>
                <button
                  onClick={() => setOpenCommentStepId(null)}
                  className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div>
      <div>
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
