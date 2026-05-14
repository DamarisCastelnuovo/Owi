import { useState, useEffect } from 'react'
import type { Client } from '../types/client'
import { INITIAL_CLIENTS } from '../data/initialClients'

const STORAGE_KEY = 'owi_clients'

function migrateClient(c: Client): Client {
  // Split old user_admin step into user_admin_app + alta_portal
  const completedSteps = c.completedSteps.flatMap(id =>
    id === 'user_admin' ? ['user_admin_app', 'alta_portal'] : [id]
  )
  const currentStepId = c.currentStepId === 'user_admin' ? 'user_admin_app' : c.currentStepId
  return { ...c, stepComments: c.stepComments ?? {}, completedSteps, currentStepId }
}

function loadClients(): Client[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed: Client[] = JSON.parse(raw)
      if (parsed.length > 0) return parsed.map(migrateClient)
    }
    return INITIAL_CLIENTS
  } catch {
    return INITIAL_CLIENTS
  }
}

function saveClients(clients: Client[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(clients))
}

export function useClients() {
  const [clients, setClients] = useState<Client[]>(loadClients)

  useEffect(() => {
    saveClients(clients)
  }, [clients])

  function addClient(data: Omit<Client, 'id' | 'createdAt' | 'completedSteps' | 'currentStepId' | 'stepComments'>) {
    const client: Client = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      completedSteps: [],
      stepComments: {},
      currentStepId: 'firma_contrato',
    }
    setClients(prev => [...prev, client])
    return client
  }

  function updateClientStep(clientId: string, stepId: string, completed: boolean) {
    setClients(prev => prev.map(c => {
      if (c.id !== clientId) return c
      const completedSteps = completed
        ? Array.from(new Set([...c.completedSteps, stepId]))
        : c.completedSteps.filter(s => s !== stepId)
      return { ...c, completedSteps, currentStepId: stepId }
    }))
  }

  function setCurrentStep(clientId: string, stepId: string) {
    setClients(prev => prev.map(c =>
      c.id === clientId ? { ...c, currentStepId: stepId } : c
    ))
  }

  function updateStepComment(clientId: string, stepId: string, comment: string) {
    setClients(prev => prev.map(c =>
      c.id === clientId
        ? { ...c, stepComments: { ...c.stepComments, [stepId]: comment } }
        : c
    ))
  }

  function deleteClient(clientId: string) {
    setClients(prev => prev.filter(c => c.id !== clientId))
  }

  function updateClient(clientId: string, data: Partial<Client>) {
    setClients(prev => prev.map(c => c.id === clientId ? { ...c, ...data } : c))
  }

  return { clients, addClient, updateClientStep, setCurrentStep, updateStepComment, deleteClient, updateClient }
}
