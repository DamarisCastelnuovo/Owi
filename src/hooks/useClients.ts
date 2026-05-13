import { useState, useEffect } from 'react'
import type { Client } from '../types/client'

const STORAGE_KEY = 'owi_clients'

function loadClients(): Client[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
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

  function addClient(data: Omit<Client, 'id' | 'createdAt' | 'completedSteps' | 'currentStepId'>) {
    const client: Client = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      completedSteps: [],
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

  function deleteClient(clientId: string) {
    setClients(prev => prev.filter(c => c.id !== clientId))
  }

  function updateClient(clientId: string, data: Partial<Client>) {
    setClients(prev => prev.map(c => c.id === clientId ? { ...c, ...data } : c))
  }

  return { clients, addClient, updateClientStep, setCurrentStep, deleteClient, updateClient }
}
