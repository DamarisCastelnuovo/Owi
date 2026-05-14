import { useState, useEffect } from 'react'
import type { Client } from '../types/client'
import { INITIAL_CLIENTS } from '../data/initialClients'

const STORAGE_KEY = 'owi_clients'

// Corrected start dates for seeded clients
const START_DATE_PATCHES: Record<string, string> = {
  'kan-1':  '2025-08-04',  // Valls SA
  'kan-5':  '2025-10-01',  // Vanfull
  'kan-7':  '2025-12-04',  // Serviexpress
  'kan-8':  '2025-12-26',  // Trucker (Tracker Group SRL)
  'kan-9':  '2025-12-16',  // Northbus
  'kan-10': '2026-01-13',  // La Canteria
  'kan-2':  '2026-04-07',  // La Pesceria
  'kan-12': '2026-03-11',  // FP Comunicaciones
  'kan-4':  '2026-04-22',  // Strada
  'kan-13': '2026-05-04',  // Deper
}

function migrateClient(c: Client): Client {
  // Split old user_admin step into user_admin_app + alta_portal
  const completedSteps = c.completedSteps.flatMap(id =>
    id === 'user_admin' ? ['user_admin_app', 'alta_portal'] : [id]
  )
  const currentStepId = c.currentStepId === 'user_admin' ? 'user_admin_app' : c.currentStepId
  const startDate = START_DATE_PATCHES[c.id] ?? c.startDate
  return { ...c, stepComments: c.stepComments ?? {}, completedSteps, currentStepId, startDate }
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
