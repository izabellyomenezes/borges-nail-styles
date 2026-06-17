'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Plus, Pencil, Trash2, X as IconX } from 'lucide-react'
import type { GastoItem } from '@/lib/types'
import ModalGasto from './ModalGasto'

type ModalEstado =
  | { tipo: 'nenhum' }
  | { tipo: 'criar' }
  | { tipo: 'editar'; gasto: GastoItem }

const fmtBRL = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const fmtData = (iso: string) => {
  const [a, m, d] = iso.split('-')
  return `${d}/${m}/${a}`
}

export default function GastosPage() {
  const [gastos, setGastos] = useState<GastoItem[]>([])
  const [carregando, setCarregando] = useState(true)

  // Filtros de período (aplicados via API)
  const [inicio, setInicio] = useState('')
  const [fim, setFim] = useState('')
  // Filtro de categoria aplicado no cliente sobre o resultado já carregado
  const [categoriaFiltro, setCategoriaFiltro] = useState('')

  const [modal, setModal] = useState<ModalEstado>({ tipo: 'nenhum' })
  // id do gasto aguardando confirmação de exclusão
  const [confirmandoExclusao, setConfirmandoExclusao] = useState<string | null>(null)
  const [excluindo, setExcluindo] = useState(false)

  // Busca gastos da API; quando inicio+fim informados, filtra por período
  const buscar = useCallback(async (ini: string, fi: string) => {
    setCarregando(true)
    try {
      const url = ini && fi
        ? `/api/gastos?inicio=${ini}&fim=${fi}`
        : '/api/gastos'
      const res = await fetch(url)
      setGastos(await res.json())
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => { buscar('', '') }, [buscar])

  // Lista de categorias únicas presentes nos gastos carregados (para o select de filtro)
  const categoriasDisponiveis = useMemo(() => {
    const unicas = Array.from(
      new Set(gastos.map(g => g.categoria).filter((c): c is string => Boolean(c)))
    ).sort()
    return unicas
  }, [gastos])

  // Filtragem por categoria feita no cliente
  const gastosFiltrados = useMemo(() => {
    if (!categoriaFiltro) return gastos
    return gastos.filter(g => g.categoria === categoriaFiltro)
  }, [gastos, categoriaFiltro])

  const totalFiltrado = useMemo(
    () => gastosFiltrados.reduce((acc, g) => acc + g.valor, 0),
    [gastosFiltrados],
  )

  const aplicarFiltro = () => {
    setCategoriaFiltro('')
    buscar(inicio, fim)
  }

  const limparFiltros = () => {
    setInicio('')
    setFim('')
    setCategoriaFiltro('')
    buscar('', '')
  }

  const fecharModal = () => setModal({ tipo: 'nenhum' })

  const aoSalvar = () => {
    fecharModal()
    buscar(inicio, fim)
  }

  const excluir = async (id: string) => {
    setExcluindo(true)
    try {
      await fetch(`/api/gastos/${id}`, { method: 'DELETE' })
      setConfirmandoExclusao(null)
      buscar(inicio, fim)
    } finally {
      setExcluindo(false)
    }
  }

  const filtroPeriodoAtivo = inicio && fim
  const filtroAtivo = filtroPeriodoAtivo || categoriaFiltro

  return (
    <div className="flex flex-col gap-6 max-w-3xl">

      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-stone-800">Gastos</h1>
          <p className="text-sm text-stone-500 mt-0.5">
            {filtroAtivo
              ? `${gastosFiltrados.length} ${gastosFiltrados.length === 1 ? 'resultado' : 'resultados'} com filtro ativo`
              : `${gastos.length} ${gastos.length === 1 ? 'gasto cadastrado' : 'gastos cadastrados'}`}
          </p>
        </div>
        <button
          onClick={() => setModal({ tipo: 'criar' })}
          className="flex items-center gap-2 px-5 py-2.5 bg-stone-800 text-white rounded-xl text-sm font-medium hover:bg-stone-700 min-h-[44px] transition-colors"
        >
          <Plus size={18} />
          Novo gasto
        </button>
      </div>

      {/* Painel de filtros */}
      <div className="bg-white border border-stone-200 rounded-2xl px-5 py-4 flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 min-w-[140px] flex-1">
          <span className="text-xs font-medium text-stone-500 uppercase tracking-wide">Data início</span>
          <input
            type="date"
            value={inicio}
            onChange={e => setInicio(e.target.value)}
            className="px-3 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-stone-400 min-h-[44px]"
          />
        </label>

        <label className="flex flex-col gap-1 min-w-[140px] flex-1">
          <span className="text-xs font-medium text-stone-500 uppercase tracking-wide">Data fim</span>
          <input
            type="date"
            value={fim}
            onChange={e => setFim(e.target.value)}
            className="px-3 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-stone-400 min-h-[44px]"
          />
        </label>

        {/* Categoria: select com categorias presentes nos gastos carregados */}
        <label className="flex flex-col gap-1 min-w-[160px] flex-1">
          <span className="text-xs font-medium text-stone-500 uppercase tracking-wide">Categoria</span>
          <select
            value={categoriaFiltro}
            onChange={e => setCategoriaFiltro(e.target.value)}
            className="px-3 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-stone-400 min-h-[44px] bg-white"
          >
            <option value="">Todas</option>
            {categoriasDisponiveis.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </label>

        <div className="flex gap-2">
          <button
            onClick={aplicarFiltro}
            className="px-5 py-2.5 bg-stone-800 text-white rounded-xl text-sm font-medium hover:bg-stone-700 min-h-[44px] transition-colors"
          >
            Filtrar
          </button>
          {filtroAtivo && (
            <button
              onClick={limparFiltros}
              className="px-4 py-2.5 border border-stone-200 text-stone-600 rounded-xl text-sm font-medium hover:bg-stone-50 min-h-[44px] flex items-center gap-1.5 transition-colors"
            >
              <IconX size={14} />
              Limpar
            </button>
          )}
        </div>
      </div>

      {/* Lista de gastos */}
      {carregando ? (
        <p className="text-sm text-stone-400 py-8 text-center">Carregando…</p>
      ) : gastosFiltrados.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-stone-200 rounded-2xl text-stone-400">
          {filtroAtivo ? (
            <>
              <p className="text-sm">Nenhum gasto encontrado com os filtros aplicados.</p>
              <button
                onClick={limparFiltros}
                className="mt-3 text-sm text-stone-600 underline underline-offset-2"
              >
                Limpar filtros
              </button>
            </>
          ) : (
            <>
              <p className="text-sm">Nenhum gasto cadastrado.</p>
              <button
                onClick={() => setModal({ tipo: 'criar' })}
                className="mt-3 text-sm text-stone-600 underline underline-offset-2"
              >
                Registrar primeiro gasto
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden">
          {/* Cabeçalho da tabela */}
          <div className="grid grid-cols-[auto_1fr_auto_auto_auto] items-center gap-4 px-5 py-2.5 bg-stone-50 border-b border-stone-100">
            <span className="text-xs font-semibold text-stone-400 uppercase tracking-wide w-24">Data</span>
            <span className="text-xs font-semibold text-stone-400 uppercase tracking-wide">Descrição</span>
            <span className="text-xs font-semibold text-stone-400 uppercase tracking-wide w-28">Categoria</span>
            <span className="text-xs font-semibold text-stone-400 uppercase tracking-wide w-28 text-right">Valor</span>
            <span className="w-24" />
          </div>

          <div className="divide-y divide-stone-100">
            {gastosFiltrados.map(g => (
              <div key={g.id}>
                {confirmandoExclusao === g.id ? (
                  /* Linha de confirmação de exclusão */
                  <div className="flex items-center justify-between px-5 py-4 bg-red-50 min-h-[64px] gap-4">
                    <p className="text-sm text-red-700 font-medium">
                      Excluir "{g.descricao}"?
                    </p>
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => setConfirmandoExclusao(null)}
                        className="px-4 py-2 rounded-xl text-sm font-medium text-stone-600 hover:bg-stone-100 min-h-[44px] transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={() => excluir(g.id)}
                        disabled={excluindo}
                        className="px-4 py-2 rounded-xl text-sm font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-40 min-h-[44px] transition-colors"
                      >
                        {excluindo ? 'Excluindo…' : 'Confirmar'}
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Linha normal */
                  <div className="grid grid-cols-[auto_1fr_auto_auto_auto] items-center gap-4 px-5 py-4 min-h-[64px]">
                    <span className="text-sm text-stone-500 tabular-nums w-24">{fmtData(g.data)}</span>
                    <span className="text-sm font-medium text-stone-800 truncate">{g.descricao}</span>
                    <span className="w-28">
                      {g.categoria ? (
                        <span className="text-xs font-medium bg-stone-100 text-stone-600 px-2.5 py-1 rounded-lg">
                          {g.categoria}
                        </span>
                      ) : (
                        <span className="text-xs text-stone-300">—</span>
                      )}
                    </span>
                    <span className="text-sm font-semibold text-stone-800 tabular-nums w-28 text-right">
                      {fmtBRL(g.valor)}
                    </span>
                    <div className="flex items-center gap-1 w-24 justify-end">
                      <button
                        onClick={() => { setConfirmandoExclusao(null); setModal({ tipo: 'editar', gasto: g }) }}
                        className="p-2.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                        title="Editar"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => setConfirmandoExclusao(g.id)}
                        className="p-2.5 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                        title="Excluir"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Rodapé com total */}
          <div className="flex items-center justify-between px-5 py-4 bg-stone-50 border-t border-stone-200">
            <span className="text-sm font-medium text-stone-500">
              Total{categoriaFiltro ? ` · ${categoriaFiltro}` : ''}
              {filtroPeriodoAtivo ? ` · ${fmtData(inicio)} a ${fmtData(fim)}` : ''}
            </span>
            <span className="text-base font-bold text-stone-800 tabular-nums">
              {fmtBRL(totalFiltrado)}
            </span>
          </div>
        </div>
      )}

      {/* Modal criar/editar */}
      {modal.tipo === 'criar' && (
        <ModalGasto gasto={null} onSalvar={aoSalvar} onFechar={fecharModal} />
      )}
      {modal.tipo === 'editar' && (
        <ModalGasto gasto={modal.gasto} onSalvar={aoSalvar} onFechar={fecharModal} />
      )}
    </div>
  )
}
