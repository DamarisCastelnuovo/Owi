import { useState, useEffect } from 'react'
import type { Client } from '../types/client'
import { INITIAL_CLIENTS } from '../data/initialClients'
import { supabase } from '../lib/supabase'

const START_DATE_PATCHES: Record<string, string> = {
  'kan-1':  '2025-08-04',
  'kan-5':  '2025-10-01',
  'kan-7':  '2025-12-04',
  'kan-8':  '2025-12-26',
  'kan-9':  '2025-12-16',
  'kan-10': '2026-01-13',
  'kan-2':  '2026-04-07',
  'kan-12': '2026-03-11',
  'kan-4':  '2026-04-22',
  'kan-13': '2026-05-04',
}

function migrateClient(c: Client): Client {
  const completedSteps = c.completedSteps.flatMap(id =>
    id === 'user_admin' ? ['user_admin_app', 'alta_portal'] : [id]
  )
  const currentStepId = c.currentStepId === 'user_admin' ? 'user_admin_app' : c.currentStepId
  const startDate = START_DATE_PATCHES[c.id] ?? c.startDate
  return {
    ...c,
    stepComments: c.stepComments ?? {},
    stepStartDates: c.stepStartDates ?? {},
    stepCompletedDates: c.stepCompletedDates ?? {},
    completedSteps,
    currentStepId,
    startDate,
  }
}

const STORAGE_KEY = 'owi_clients'

function readLocalStorage(): Client[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed: Client[] = JSON.parse(raw)
    return parsed.length > 0 ? parsed.map(migrateClient) : null
  } catch {
    return null
  }
}

async function dbUpsert(client: Client) {
  await supabase
    .from('clients')
    .upsert({ id: client.id, data: client, updated_at: new Date().toISOString() })
}

async function dbDelete(clientId: string) {
  await supabase.from('clients').delete().eq('id', clientId)
}

export function useClients() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Load initial data
    supabase.from('clients').select('data').then(async ({ data, error }) => {
      // If localStorage has data, it takes priority — migrate it to Supabase
      const localData = readLocalStorage()
      if (localData) {
        await Promise.all(
          localData.map(c =>
            supabase.from('clients').upsert({ id: c.id, data: c, updated_at: new Date().toISOString() })
          )
        )
        localStorage.removeItem(STORAGE_KEY)
        setClients(localData)
      } else if (error || !data || data.length === 0) {
        // Supabase empty and no localStorage → seed from initial clients
        await Promise.all(
          INITIAL_CLIENTS.map(c =>
            supabase.from('clients').upsert({ id: c.id, data: c, updated_at: new Date().toISOString() })
          )
        )
        setClients(INITIAL_CLIENTS)
      } else {
        setClients(data.map(row => migrateClient(row.data as Client)))
      }
      setLoading(false)
    })

    // Real-time subscription
    const channel = supabase
      .channel('clients-sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'clients' },
        payload => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const updated = migrateClient((payload.new as { data: Client }).data)
            setClients(prev => {
              const exists = prev.some(c => c.id === updated.id)
              return exists
                ? prev.map(c => c.id === updated.id ? updated : c)
                : [...prev, updated]
            })
          } else if (payload.eventType === 'DELETE') {
            const deletedId = (payload.old as { id: string }).id
            setClients(prev => prev.filter(c => c.id !== deletedId))
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  function addClient(data: Omit<Client, 'id' | 'createdAt' | 'completedSteps' | 'currentStepId' | 'stepComments' | 'stepStartDates' | 'stepCompletedDates'>) {
    const client: Client = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      completedSteps: [],
      stepComments: {},
      stepStartDates: { firma_contrato: new Date().toISOString() },
      stepCompletedDates: {},
      currentStepId: 'firma_contrato',
    }
    setClients(prev => [...prev, client])
    dbUpsert(client)
    return client
  }

  function updateClientStep(clientId: string, stepId: string, completed: boolean) {
    const now = new Date().toISOString()
    setClients(prev => {
      const next = prev.map(c => {
        if (c.id !== clientId) return c
        const completedSteps = completed
          ? Array.from(new Set([...c.completedSteps, stepId]))
          : c.completedSteps.filter(s => s !== stepId)
        const stepCompletedDates = completed
          ? { ...c.stepCompletedDates, [stepId]: now }
          : Object.fromEntries(Object.entries(c.stepCompletedDates).filter(([k]) => k !== stepId))
        return { ...c, completedSteps, stepCompletedDates, currentStepId: stepId }
      })
      const changed = next.find(c => c.id === clientId)
      if (changed) dbUpsert(changed)
      return next
    })
  }

  function setCurrentStep(clientId: string, stepId: string) {
    const now = new Date().toISOString()
    setClients(prev => {
      const next = prev.map(c =>
        c.id === clientId
          ? { ...c, currentStepId: stepId, stepStartDates: { ...c.stepStartDates, [stepId]: now } }
          : c
      )
      const changed = next.find(c => c.id === clientId)
      if (changed) dbUpsert(changed)
      return next
    })
  }

  function updateStepComment(clientId: string, stepId: string, comment: string) {
    setClients(prev => {
      const next = prev.map(c =>
        c.id === clientId
          ? { ...c, stepComments: { ...c.stepComments, [stepId]: comment } }
          : c
      )
      const changed = next.find(c => c.id === clientId)
      if (changed) dbUpsert(changed)
      return next
    })
  }

  function deleteClient(clientId: string) {
    setClients(prev => prev.filter(c => c.id !== clientId))
    dbDelete(clientId)
  }

  function updateClient(clientId: string, data: Partial<Client>) {
    setClients(prev => {
      const next = prev.map(c => c.id === clientId ? { ...c, ...data } : c)
      const changed = next.find(c => c.id === clientId)
      if (changed) dbUpsert(changed)
      return next
    })
  }

  return { clients, loading, addClient, updateClientStep, setCurrentStep, updateStepComment, deleteClient, updateClient }
}
