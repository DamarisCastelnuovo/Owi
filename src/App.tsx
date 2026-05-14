import { useState } from 'react'
import { Plus, Search, ChevronDown, BarChart2, LayoutGrid } from 'lucide-react'
import { useClients } from './hooks/useClients'
import { ClientCard } from './components/ClientCard'
import { ClientDetail } from './components/ClientDetail'
import { AddClientModal } from './components/AddClientModal'
import { GlobalStats } from './components/GlobalStats'
import { StatsPanel } from './components/StatsPanel'
import { ONBOARDING_STEPS } from './data/steps'
import { daysSince } from './utils/dates'

const BASE_STEPS = ONBOARDING_STEPS.filter(s => !s.optional)

export default function App() {
  const { clients, addClient, updateClientStep, setCurrentStep, updateStepComment, deleteClient } = useClients()
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'active' | 'done' | 'overdue'>('all')
  const [stepFilter, setStepFilter] = useState('')
  const [view, setView] = useState<'clients' | 'stats'>('clients')

  const selectedClient = clients.find(c => c.id === selectedClientId) ?? null

  function handleDeleteClient(id: string) {
    if (confirm('¿Eliminar este cliente?')) {
      deleteClient(id)
      if (selectedClientId === id) setSelectedClientId(null)
    }
  }

  const filtered = clients.filter(c => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.company.toLowerCase().includes(search.toLowerCase())
    if (!matchesSearch) return false

    const days = daysSince(c.startDate)
    const completed = c.completedSteps.filter(id => BASE_STEPS.some(s => s.id === id)).length
    const isDone = completed === BASE_STEPS.length
    const currentStepData = ONBOARDING_STEPS.find(s => s.id === c.currentStepId)
    const isOverdue = !isDone && !!currentStepData && !currentStepData.optional && days > currentStepData.day

    if (filter === 'done' && !isDone) return false
    if (filter === 'overdue' && !isOverdue) return false
    if (filter === 'active' && (isDone || isOverdue)) return false
    if (stepFilter && c.currentStepId !== stepFilter) return false

    return true
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="w-full px-6 sm:px-10 lg:px-16 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div>
              <h1 className="text-lg font-bold text-gray-900">Owi</h1>
              <p className="text-xs text-gray-400">Dashboard de altas</p>
            </div>
            {!selectedClient && (
              <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setView('clients')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    view === 'clients' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <LayoutGrid size={14} />
                  Clientes
                </button>
                <button
                  onClick={() => setView('stats')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    view === 'stats' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <BarChart2 size={14} />
                  Estadísticas
                </button>
              </div>
            )}
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">Nuevo cliente</span>
          </button>
        </div>
      </header>

      <main className="w-full px-6 sm:px-10 lg:px-16 py-6">
        {selectedClient ? (
          <ClientDetail
            client={selectedClient}
            onBack={() => setSelectedClientId(null)}
            onToggleStep={(stepId, completed) => updateClientStep(selectedClient.id, stepId, completed)}
            onSetCurrent={(stepId) => setCurrentStep(selectedClient.id, stepId)}
            onUpdateComment={(stepId, comment) => updateStepComment(selectedClient.id, stepId, comment)}
          />
        ) : view === 'stats' ? (
          <StatsPanel clients={clients} />
        ) : (
          <>
            <GlobalStats clients={clients} />

            <div className="flex flex-col sm:flex-row gap-3 mb-3">
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Buscar por nombre o empresa..."
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {(['all', 'active', 'done', 'overdue'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      filter === f
                        ? 'bg-purple-600 text-white'
                        : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {{ all: 'Todos', active: 'En proceso', done: 'Completados', overdue: 'Atrasados' }[f]}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative mb-5 w-full sm:w-72">
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <select
                value={stepFilter}
                onChange={e => setStepFilter(e.target.value)}
                className="w-full appearance-none bg-white border border-gray-300 rounded-lg px-3 py-2 pr-8 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">Todas las etapas</option>
                {BASE_STEPS.map(s => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
            </div>

            {filtered.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-gray-400 text-sm">
                  {clients.length === 0
                    ? 'Todavía no hay clientes. Agregá el primero.'
                    : 'No se encontraron clientes.'}
                </p>
                {clients.length === 0 && (
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="mt-3 text-purple-600 text-sm font-medium hover:underline"
                  >
                    Agregar cliente
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filtered.map(client => (
                  <ClientCard
                    key={client.id}
                    client={client}
                    onClick={() => setSelectedClientId(client.id)}
                    onDelete={() => handleDeleteClient(client.id)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {showAddModal && (
        <AddClientModal
          onAdd={addClient}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  )
}
