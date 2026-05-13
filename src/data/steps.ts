export interface Step {
  id: string
  label: string
  day: number
  optional?: boolean
  emoji?: string
}

export const ONBOARDING_STEPS: Step[] = [
  { id: 'firma_contrato',        label: 'Firma Contrato',               day: 1  },
  { id: 'pago_cliente',          label: 'Pago del Cliente',             day: 1  },
  { id: 'user_admin',            label: 'User Admin en App y Alta Portal', day: 1 },
  { id: 'primer_contacto_sac',   label: 'Primer Contacto SAC',          day: 2  },
  { id: 'bot_generico',          label: 'Puesta en Marcha Bot Genérico', day: 3 },
  { id: 'relevamiento_sac',      label: 'Relevamiento Funcional SAC',   day: 4  },
  { id: 'creacion_prompt',       label: 'Creación del Prompt Funcional', day: 7 },
  { id: 'entrega_prompt',        label: 'Entrega Prompt al Cliente',    day: 8  },
  { id: 'aprobacion_prompt',     label: 'Aprobación Prompt Cliente',    day: 11 },
  { id: 'maquetado_funcional',   label: 'Maquetado Funcional',          day: 13 },
  { id: 'test_cliente',          label: 'Test Cliente',                 day: 22 },
  { id: 'puesta_produccion',     label: 'Puesta en Producción',         day: 30 },
  { id: 'dias_extra',            label: 'Días Extra (x20)',             day: 50, optional: true },
  { id: 'bot_productivo',        label: 'Bot Productivo',               day: 50, optional: true, emoji: '🚀' },
]
