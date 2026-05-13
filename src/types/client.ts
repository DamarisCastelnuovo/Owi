export interface Client {
  id: string
  name: string
  company: string
  startDate: string
  currentStepId: string
  completedSteps: string[]
  notes?: string
  createdAt: string
}
