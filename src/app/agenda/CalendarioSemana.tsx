'use client'

import type { Agendamento } from '@/lib/types'

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const HORA_INICIO = 7
const HORA_FIM = 21
const PX_HORA = 64

interface Props {
  dataAtual: Date
  agendamentos: Agendamento[]
  onHorarioClick: (data: string, horario: string) => void
  onAgendamentoClick: (ag: Agendamento) => void
}

const fmtData = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

function corBloco(ag: Agendamento) {
  if (ag.status === 'cancelado') return 'bg-stone-100 border-stone-200 text-stone-400'
  if (ag.status === 'concluído' && !ag.pago) return 'bg-amber-50 border-amber-200 text-amber-700'
  if (ag.status === 'concluído' && ag.pago) return 'bg-emerald-50 border-emerald-200 text-emerald-700'
  return 'bg-sky-50 border-sky-200 text-sky-800'
}

const topoHorario = (horario: string) => {
  const [h, m] = horario.split(':').map(Number)
  return ((h - HORA_INICIO) * 60 + m) * (PX_HORA / 60)
}

export default function CalendarioSemana({ dataAtual, agendamentos, onHorarioClick, onAgendamentoClick }: Props) {
  // Início da semana = domingo anterior (ou o próprio dia se for domingo)
  const inicio = new Date(dataAtual)
  inicio.setDate(dataAtual.getDate() - dataAtual.getDay())

  const diasDaSemana = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(inicio)
    d.setDate(inicio.getDate() + i)
    return d
  })

  const hoje = fmtData(new Date())
  const horas = Array.from({ length: HORA_FIM - HORA_INICIO }, (_, i) => HORA_INICIO + i)

  const porData = new Map<string, Agendamento[]>()
  agendamentos.forEach(ag => {
    const lista = porData.get(ag.data) ?? []
    lista.push(ag)
    porData.set(ag.data, lista)
  })

  const alturaTotal = (HORA_FIM - HORA_INICIO) * PX_HORA

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      {/* Cabeçalho com dias */}
      <div className="flex border-b border-stone-200 shrink-0">
        <div className="w-14 shrink-0" />
        {diasDaSemana.map((dia, i) => {
          const ds = fmtData(dia)
          return (
            <div key={i} className="flex-1 text-center py-2">
              <div className="text-xs text-stone-400 uppercase tracking-wide">{DIAS_SEMANA[i]}</div>
              <div
                className={`text-sm font-semibold mx-auto mt-0.5 w-8 h-8 flex items-center justify-center rounded-full ${
                  ds === hoje ? 'bg-stone-800 text-white' : 'text-stone-700'
                }`}
              >
                {dia.getDate()}
              </div>
            </div>
          )
        })}
      </div>

      {/* Grade de horários */}
      <div className="flex-1 overflow-y-auto">
        <div className="flex relative" style={{ height: alturaTotal }}>
          {/* Coluna de horas */}
          <div className="w-14 shrink-0 relative select-none">
            {horas.map(h => (
              <div
                key={h}
                className="absolute right-2 text-xs text-stone-400 leading-none"
                style={{ top: (h - HORA_INICIO) * PX_HORA - 7 }}
              >
                {String(h).padStart(2, '0')}h
              </div>
            ))}
          </div>

          {/* Colunas dos dias */}
          {diasDaSemana.map((dia, i) => {
            const ds = fmtData(dia)
            const ags = porData.get(ds) ?? []

            return (
              <div
                key={i}
                className="flex-1 relative border-l border-stone-100 cursor-pointer"
                onClick={() => onHorarioClick(ds, '09:00')}
              >
                {/* Linhas de hora */}
                {horas.map(h => (
                  <div
                    key={h}
                    className="absolute inset-x-0 border-t border-stone-100"
                    style={{ top: (h - HORA_INICIO) * PX_HORA }}
                  />
                ))}

                {/* Agendamentos */}
                {ags.map(ag => (
                  <button
                    key={ag.id}
                    className={`absolute inset-x-0.5 rounded-lg px-1.5 py-1 text-left text-xs font-medium border overflow-hidden ${corBloco(ag)}`}
                    style={{ top: topoHorario(ag.horario) + 1, minHeight: 26 }}
                    onClick={e => { e.stopPropagation(); onAgendamentoClick(ag) }}
                  >
                    <div className="truncate">{ag.horario} {ag.cliente_nome}</div>
                  </button>
                ))}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
