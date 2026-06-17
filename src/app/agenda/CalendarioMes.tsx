'use client'

import type { Agendamento } from '@/lib/types'

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

interface Props {
  dataAtual: Date
  agendamentos: Agendamento[]
  onDiaClick: (data: string) => void
  onAgendamentoClick: (ag: Agendamento) => void
}

const fmtData = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

// Classe de cor conforme status e pagamento
function corChip(ag: Agendamento) {
  if (ag.status === 'cancelado') return 'bg-stone-100 text-stone-400 line-through'
  if (ag.status === 'concluído' && !ag.pago) return 'bg-amber-100 text-amber-700'
  if (ag.status === 'concluído' && ag.pago) return 'bg-emerald-100 text-emerald-700'
  return 'bg-sky-100 text-sky-700' // agendado
}

export default function CalendarioMes({ dataAtual, agendamentos, onDiaClick, onAgendamentoClick }: Props) {
  const ano = dataAtual.getFullYear()
  const mes = dataAtual.getMonth()
  const hoje = fmtData(new Date())

  const primeiroDia = new Date(ano, mes, 1)
  const totalDias = new Date(ano, mes + 1, 0).getDate()

  // Células: null = espaço vazio antes do dia 1
  const celulas: Array<Date | null> = [
    ...Array.from({ length: primeiroDia.getDay() }, () => null),
    ...Array.from({ length: totalDias }, (_, i) => new Date(ano, mes, i + 1)),
  ]

  // Índice: data → agendamentos do dia
  const porData = new Map<string, Agendamento[]>()
  agendamentos.forEach(ag => {
    const lista = porData.get(ag.data) ?? []
    lista.push(ag)
    porData.set(ag.data, lista)
  })

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Rótulos dos dias da semana */}
      <div className="grid grid-cols-7 border-b border-stone-100 mb-0.5">
        {DIAS_SEMANA.map(d => (
          <div key={d} className="py-2 text-center text-xs font-semibold text-stone-400 uppercase tracking-wide">
            {d}
          </div>
        ))}
      </div>

      {/* Grade de dias */}
      <div className="flex-1 grid grid-cols-7 gap-px bg-stone-200 rounded-xl overflow-hidden">
        {celulas.map((dia, i) => {
          if (!dia) return <div key={`_${i}`} className="bg-stone-50" />

          const ds = fmtData(dia)
          const ags = porData.get(ds) ?? []
          const eHoje = ds === hoje

          return (
            <div
              key={ds}
              className="bg-white p-2 cursor-pointer hover:bg-stone-50 transition-colors flex flex-col"
              onClick={() => onDiaClick(ds)}
            >
              {/* Número do dia */}
              <span
                className={`text-sm font-semibold w-7 h-7 flex items-center justify-center rounded-full mb-1 shrink-0 ${
                  eHoje ? 'bg-stone-800 text-white' : 'text-stone-600'
                }`}
              >
                {dia.getDate()}
              </span>

              {/* Chips de agendamento */}
              <div className="flex flex-col gap-0.5 overflow-hidden">
                {ags.slice(0, 3).map(ag => (
                  <button
                    key={ag.id}
                    onClick={e => { e.stopPropagation(); onAgendamentoClick(ag) }}
                    className={`text-left text-xs px-1.5 py-0.5 rounded-md font-medium truncate ${corChip(ag)}`}
                  >
                    {ag.horario} {ag.cliente_nome}
                  </button>
                ))}
                {ags.length > 3 && (
                  <span className="text-xs text-stone-400 px-1">+{ags.length - 3}</span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
