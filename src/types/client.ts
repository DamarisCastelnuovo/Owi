export interface Client {
  id: string
  name: string
  company: string
  startDate: string
  currentStepId: string
  completedSteps: string[]
  stepComments: Record<string, string>
  stepStartDates: Record<string, string>
  stepCompletedDates: Record<string, string>
  notes?: string
  createdAt: string
}
