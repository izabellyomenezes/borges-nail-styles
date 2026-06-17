'use client'

import { useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import type { Agendamento } from '@/lib/types'
import CalendarioMes from './CalendarioMes'
import CalendarioSemana from './CalendarioSemana'
import CalendarioDia from './CalendarioDia'
import ModalNovoAgendamento from './ModalNovoAgendamento'
import ModalEditarAgendamento from './ModalEditarAgendamento'

type Modo = 'dia' | 'semana' | 'mês'

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

const fmtData = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

const fmtMes = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`

export default function AgendaView() {
  const [modo, setModo] = useState<Modo>('mês')
  const [dataAtual, setDataAtual] = useState(() => new Date())
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([])
  const [carregando, setCarregando] = useState(false)

  const [modalNovo, setModalNovo] = useState<{ aberto: boolean; data?: string; horario?: string }>({ aberto: false })
  const [modalEditar, setModalEditar] = useState<{ aberto: boolean; ag?: Agendamento }>({ aberto: false })

  // Busca agendamentos conforme o modo e data atual.
  // No modo semana, pode cruzar dois meses — nesse caso buscamos ambos.
  const buscarAgendamentos = useCallback(async () => {
    setCarregando(true)
    try {
      if (modo === 'dia') {
        const res = await fetch(`/api/agendamentos?data=${fmtData(dataAtual)}`)
        setAgendamentos(await res.json())
        return
      }

      if (modo === 'semana') {
        const inicio = new Date(dataAtual)
        inicio.setDate(dataAtual.getDate() - dataAtual.getDay())
        const fim = new Date(inicio)
        fim.setDate(inicio.getDate() + 6)

        const mes1 = fmtMes(inicio)
        const mes2 = fmtMes(fim)

        if (mes1 === mes2) {
          const res = await fetch(`/api/agendamentos?mes=${mes1}`)
          setAgendamentos(await res.json())
        } else {
          const [r1, r2] = await Promise.all([
            fetch(`/api/agendamentos?mes=${mes1}`),
            fetch(`/api/agendamentos?mes=${mes2}`),
          ])
          const [d1, d2] = await Promise.all([r1.json(), r2.json()])
          setAgendamentos([...d1, ...d2])
        }
        return
      }

      // modo mês
      const res = await fetch(`/api/agendamentos?mes=${fmtMes(dataAtual)}`)
      setAgendamentos(await res.json())
    } catch {
      setAgendamentos([])
    } finally {
      setCarregando(false)
    }
  }, [modo, dataAtual])

  useEffect(() => {
    buscarAgendamentos()
  }, [buscarAgendamentos])

  // Navega para frente (+1) ou para trás (-1) conforme o modo
  const navegar = (dir: 1 | -1) => {
    setDataAtual(prev => {
      const d = new Date(prev)
      if (modo === 'mês') {
        d.setDate(1)
        d.setMonth(d.getMonth() + dir)
      } else if (modo === 'semana') {
        d.setDate(d.getDate() + dir * 7)
      } else {
        d.setDate(d.getDate() + dir)
      }
      return d
    })
  }

  const irParaHoje = () => setDataAtual(new Date())

  const tituloPeriodo = () => {
    if (modo === 'mês') return `${MESES[dataAtual.getMonth()]} ${dataAtual.getFullYear()}`

    if (modo === 'semana') {
      const ini = new Date(dataAtual)
      ini.setDate(dataAtual.getDate() - dataAtual.getDay())
      const fim = new Date(ini)
      fim.setDate(ini.getDate() + 6)
      if (ini.getMonth() === fim.getMonth()) {
        return `${ini.getDate()}–${fim.getDate()} de ${MESES[fim.getMonth()]}`
      }
      return `${ini.getDate()} ${MESES[ini.getMonth()]} – ${fim.getDate()} ${MESES[fim.getMonth()]}`
    }

    return `${dataAtual.getDate()} de ${MESES[dataAtual.getMonth()]} de ${dataAtual.getFullYear()}`
  }

  const abrirNovo = (data: string, horario?: string) =>
    setModalNovo({ aberto: true, data, horario })

  const abrirEditar = (ag: Agendamento) =>
    setModalEditar({ aberto: true, ag })

  const aoSalvar = () => {
    buscarAgendamentos()
    setModalNovo({ aberto: false })
    setModalEditar({ aberto: false })
  }

  return (
    <div className="flex flex-col h-full gap-5">

      {/* Barra de controle */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Título + seletor de modo */}
        <h1 className="text-2xl font-semibold text-stone-800 mr-1">Agenda</h1>

        <div className="flex items-center bg-stone-100 rounded-xl p-1 gap-0.5">
          {(['dia', 'semana', 'mês'] as Modo[]).map(m => (
            <button
              key={m}
              onClick={() => setModo(m)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors min-h-[36px] ${
                modo === m ? 'bg-white text-stone-800 shadow-sm' : 'text-stone-500 hover:text-stone-700'
              }`}
            >
              {m.charAt(0).toUpperCase() + m.slice(1)}
            </button>
          ))}
        </div>

        {/* Espaçador */}
        <div className="flex-1" />

        {/* Navegação de período */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => navegar(-1)}
            className="p-2 rounded-xl hover:bg-stone-100 min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={irParaHoje}
            className="px-3 py-1.5 text-sm font-medium text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded-xl min-h-[44px]"
          >
            Hoje
          </button>
          <span className="text-sm font-medium text-stone-700 min-w-[220px] text-center select-none">
            {tituloPeriodo()}
          </span>
          <button
            onClick={() => navegar(1)}
            className="p-2 rounded-xl hover:bg-stone-100 min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Botão novo agendamento */}
        <button
          onClick={() => abrirNovo(fmtData(new Date()))}
          className="flex items-center gap-2 px-5 py-2.5 bg-stone-800 text-white rounded-xl text-sm font-medium hover:bg-stone-700 min-h-[44px] transition-colors"
        >
          <Plus size={18} />
          Novo
        </button>
      </div>

      {/* Legenda de cores */}
      <div className="flex items-center gap-4 text-xs text-stone-500 -mt-2">
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-sky-200 inline-block" />Agendado</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-200 inline-block" />Concluído e pago</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-amber-200 inline-block" />Concluído — não pago</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-stone-200 inline-block" />Cancelado</span>
      </div>

      {/* Calendário */}
      {carregando ? (
        <div className="flex-1 flex items-center justify-center text-stone-400 text-sm">
          Carregando…
        </div>
      ) : modo === 'mês' ? (
        <CalendarioMes
          dataAtual={dataAtual}
          agendamentos={agendamentos}
          onDiaClick={data => abrirNovo(data)}
          onAgendamentoClick={abrirEditar}
        />
      ) : modo === 'semana' ? (
        <CalendarioSemana
          dataAtual={dataAtual}
          agendamentos={agendamentos}
          onHorarioClick={(data, horario) => abrirNovo(data, horario)}
          onAgendamentoClick={abrirEditar}
        />
      ) : (
        <CalendarioDia
          dataAtual={dataAtual}
          agendamentos={agendamentos}
          onHorarioClick={horario => abrirNovo(fmtData(dataAtual), horario)}
          onAgendamentoClick={abrirEditar}
        />
      )}

      {/* Modal: novo agendamento */}
      {modalNovo.aberto && (
        <ModalNovoAgendamento
          dataInicial={modalNovo.data}
          horarioInicial={modalNovo.horario}
          onSalvar={aoSalvar}
          onFechar={() => setModalNovo({ aberto: false })}
        />
      )}

      {/* Modal: editar agendamento */}
      {modalEditar.aberto && modalEditar.ag && (
        <ModalEditarAgendamento
          agendamento={modalEditar.ag}
          onSalvar={aoSalvar}
          onFechar={() => setModalEditar({ aberto: false })}
          onExcluir={aoSalvar}
        />
      )}
    </div>
  )
}
