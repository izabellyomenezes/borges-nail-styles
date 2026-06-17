'use client'

import type { Agendamento } from '@/lib/types'

const HORA_INICIO = 7
const HORA_FIM = 21
const PX_HORA = 80  // mais espaço no modo dia

interface Props {
  dataAtual: Date
  agendamentos: Agendamento[]
  onHorarioClick: (horario: string) => void
  onAgendamentoClick: (ag: Agendamento) => void
}

const fmtData = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

function corBloco(ag: Agendamento) {
  if (ag.status === 'cancelado') return 'bg-stone-100 border-stone-200 text-stone-500'
  if (ag.status === 'concluído' && !ag.pago) return 'bg-amber-50 border-amber-200 text-amber-800'
  if (ag.status === 'concluído' && ag.pago) return 'bg-emerald-50 border-emerald-200 text-emerald-800'
  return 'bg-sky-50 border-sky-200 text-sky-900'
}

const topoHorario = (horario: string) => {
  const [h, m] = horario.split(':').map(Number)
  return ((h - HORA_INICIO) * 60 + m) * (PX_HORA / 60)
}

export default function CalendarioDia({ dataAtual, agendamentos, onHorarioClick, onAgendamentoClick }: Props) {
  const ds = fmtData(dataAtual)
  const ags = agendamentos.filter(ag => ag.data === ds)
  const horas = Array.from({ length: HORA_FIM - HORA_INICIO }, (_, i) => HORA_INICIO + i)

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="flex relative" style={{ height: (HORA_FIM - HORA_INICIO) * PX_HORA }}>
        {/* Coluna de horas */}
        <div className="w-20 shrink-0 relative select-none">
          {horas.map(h => (
            <div
              key={h}
              className="absolute right-3 text-sm text-stone-400 leading-none"
              style={{ top: (h - HORA_INICIO) * PX_HORA - 9 }}
            >
              {String(h).padStart(2, '0')}:00
            </div>
          ))}
        </div>

        {/* Área de agendamentos */}
        <div className="flex-1 relative border-l border-stone-200">
          {/* Faixas clicáveis por hora */}
          {horas.map(h => (
            <div
              key={h}
              className="absolute inset-x-0 border-t border-stone-100 hover:bg-stone-50 transition-colors cursor-pointer"
              style={{ top: (h - HORA_INICIO) * PX_HORA, height: PX_HORA }}
              onClick={() => onHorarioClick(`${String(h).padStart(2, '0')}:00`)}
            />
          ))}

          {/* Blocos de agendamento */}
          {ags.map(ag => (
            <button
              key={ag.id}
              className={`absolute inset-x-2 rounded-xl border px-4 py-3 text-left ${corBloco(ag)}`}
              style={{ top: topoHorario(ag.horario) + 2, minHeight: 44 }}
              onClick={e => { e.stopPropagation(); onAgendamentoClick(ag) }}
            >
              <div className="font-semibold text-sm">
                {ag.horario} — {ag.cliente_nome}
              </div>
              {ag.servicos.length > 0 && (
                <div className="text-xs mt-0.5 opacity-70">
                  {ag.servicos.map(s => s.nome).join(' · ')}
                </div>
              )}
              {ag.status === 'concluído' && !ag.pago && (
                <div className="text-xs mt-1 font-medium text-amber-600">Não pago</div>
              )}
              {ag.status === 'cancelado' && (
                <div className="text-xs mt-1 text-stone-400">Cancelado</div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
