'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Plus, Trash2, ChevronRight, AlertCircle } from 'lucide-react'
import type { MetricasFaturamento, GastoItem } from '@/lib/types'
import ModalGasto from './ModalGasto'
import ModalDevedoras from './ModalDevedoras'

// ── Helpers ────────────────────────────────────────────────────────

const fmtData = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

const fmtBR = (iso: string) => {
  const [a, m, d] = iso.split('-')
  return `${d}/${m}/${a}`
}

const fmtBRL = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

// Calcula períodos para os atalhos
const periodoHoje = () => { const t = fmtData(new Date()); return { inicio: t, fim: t } }

const periodoSemana = () => {
  const d = new Date()
  const ini = new Date(d); ini.setDate(d.getDate() - d.getDay())
  const fim = new Date(ini); fim.setDate(ini.getDate() + 6)
  return { inicio: fmtData(ini), fim: fmtData(fim) }
}

const periodoMes = () => {
  const d = new Date()
  const ini = new Date(d.getFullYear(), d.getMonth(), 1)
  const fim = new Date(d.getFullYear(), d.getMonth() + 1, 0)
  return { inicio: fmtData(ini), fim: fmtData(fim) }
}

const ATALHOS = [
  { label: 'Hoje', get: periodoHoje },
  { label: 'Esta semana', get: periodoSemana },
  { label: 'Este mês', get: periodoMes },
]

// ── Card de métrica ────────────────────────────────────────────────

type Cor = 'neutro' | 'verde' | 'ambar' | 'vermelho'

function CardMetrica({
  label, valor, cor = 'neutro', subtexto,
}: {
  label: string
  valor: number
  cor?: Cor
  subtexto?: string
}) {
  const estilos: Record<Cor, { card: string; valor: string }> = {
    neutro:   { card: 'bg-white border-stone-200',   valor: 'text-stone-800' },
    verde:    { card: 'bg-emerald-50 border-emerald-200', valor: 'text-emerald-700' },
    ambar:    { card: 'bg-amber-50 border-amber-200',    valor: 'text-amber-600' },
    vermelho: { card: 'bg-red-50 border-red-200',        valor: 'text-red-600' },
  }
  const { card, valor: corValor } = estilos[cor]

  return (
    <div className={`border rounded-2xl px-5 py-4 ${card}`}>
      <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide leading-none">
        {label}
      </p>
      <p className={`text-xl font-bold mt-2 tabular-nums leading-none ${corValor}`}>
        {fmtBRL(valor)}
      </p>
      {subtexto && <p className="text-xs text-stone-400 mt-1.5">{subtexto}</p>}
    </div>
  )
}

// ── Componente principal ───────────────────────────────────────────

export default function FaturamentoPage() {
  const [periodo, setPeriodo] = useState(periodoMes)
  const [metricas, setMetricas] = useState<MetricasFaturamento | null>(null)
  const [gastos, setGastos] = useState<GastoItem[]>([])
  const [carregando, setCarregando] = useState(true)
  const [modalGasto, setModalGasto] = useState(false)
  const [modalDevedoras, setModalDevedoras] = useState(false)
  const [excluindo, setExcluindo] = useState<string | null>(null)

  const buscarDados = useCallback(async () => {
    setCarregando(true)
    try {
      const q = `inicio=${periodo.inicio}&fim=${periodo.fim}`
      const [resM, resG] = await Promise.all([
        fetch(`/api/faturamento?${q}`),
        fetch(`/api/gastos?${q}`),
      ])
      setMetricas(await resM.json())
      setGastos(await resG.json())
    } finally {
      setCarregando(false)
    }
  }, [periodo])

  useEffect(() => { buscarDados() }, [buscarDados])

  // Verifica se um atalho corresponde exatamente ao período selecionado
  const atalhoAtivo = (fn: () => { inicio: string; fim: string }) => {
    const p = fn()
    return periodo.inicio === p.inicio && periodo.fim === p.fim
  }

  const excluirGasto = async (id: string) => {
    setExcluindo(id)
    try {
      await fetch(`/api/gastos/${id}`, { method: 'DELETE' })
      await buscarDados()
    } finally {
      setExcluindo(null)
    }
  }

  const maxRanking = metricas?.servicos_ranking[0]?.quantidade ?? 1

  return (
    <div className="flex flex-col gap-6 pb-10">

      {/* Cabeçalho */}
      <h1 className="text-2xl font-semibold text-stone-800">Faturamento</h1>

      {/* ── Filtro de período ───────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Atalhos */}
        <div className="flex items-center bg-stone-100 rounded-xl p-1 gap-0.5">
          {ATALHOS.map(a => (
            <button
              key={a.label}
              onClick={() => setPeriodo(a.get())}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors min-h-[36px] ${
                atalhoAtivo(a.get)
                  ? 'bg-white text-stone-800 shadow-sm'
                  : 'text-stone-500 hover:text-stone-700'
              }`}
            >
              {a.label}
            </button>
          ))}
        </div>

        {/* Datas customizadas */}
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={periodo.inicio}
            onChange={e => setPeriodo(p => ({ ...p, inicio: e.target.value }))}
            className="px-3 py-2 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-stone-400 min-h-[44px]"
          />
          <span className="text-sm text-stone-400 select-none">até</span>
          <input
            type="date"
            value={periodo.fim}
            onChange={e => setPeriodo(p => ({ ...p, fim: e.target.value }))}
            className="px-3 py-2 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-stone-400 min-h-[44px]"
          />
        </div>
      </div>

      {carregando ? (
        <div className="h-40 flex items-center justify-center text-stone-400 text-sm">
          Carregando…
        </div>
      ) : metricas ? (
        <>
          {/* ── Cards de métricas ───────────────────────────────── */}
          <div className="grid grid-cols-2 xl:grid-cols-5 gap-3">
            <CardMetrica
              label="Total faturado"
              valor={metricas.total_faturado}
              subtexto="Agendamentos concluídos"
            />
            <CardMetrica
              label="Recebido"
              valor={metricas.total_recebido}
              cor="verde"
            />
            <CardMetrica
              label="A receber"
              valor={metricas.total_a_receber}
              cor={metricas.total_a_receber > 0 ? 'ambar' : 'neutro'}
              subtexto={metricas.total_a_receber > 0 ? 'Pendente de pagamento' : undefined}
            />
            <CardMetrica
              label="Gastos"
              valor={metricas.total_gastos}
              cor={metricas.total_gastos > 0 ? 'vermelho' : 'neutro'}
            />
            <CardMetrica
              label="Lucro estimado"
              valor={metricas.lucro_estimado}
              cor={metricas.lucro_estimado >= 0 ? 'verde' : 'vermelho'}
              subtexto="Recebido − gastos"
            />
          </div>

          {/* ── Ranking + Devedores ─────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

            {/* Serviços mais realizados */}
            <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-stone-100">
                <h2 className="text-sm font-semibold text-stone-700">Serviços mais realizados</h2>
                <p className="text-xs text-stone-400 mt-0.5">Agendamentos concluídos no período</p>
              </div>

              {metricas.servicos_ranking.length === 0 ? (
                <p className="text-sm text-stone-400 py-10 text-center px-5">
                  Nenhum serviço concluído no período.
                </p>
              ) : (
                <div className="px-5 py-4 space-y-3.5">
                  {metricas.servicos_ranking.map((s, i) => (
                    <div key={s.nome} className="flex items-center gap-3">
                      {/* Posição */}
                      <span className="text-xs font-semibold text-stone-400 w-5 text-right shrink-0">
                        {i + 1}
                      </span>
                      {/* Nome */}
                      <span className="text-sm text-stone-700 flex-1 truncate">{s.nome}</span>
                      {/* Barra + contador */}
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="w-24 h-1.5 bg-stone-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-stone-500 rounded-full transition-all"
                            style={{ width: `${(s.quantidade / maxRanking) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-stone-600 tabular-nums w-8 text-right">
                          {s.quantidade}×
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Clientes com saldo devedor */}
            <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-stone-100">
                <h2 className="text-sm font-semibold text-stone-700">Clientes com saldo devedor</h2>
                <p className="text-xs text-stone-400 mt-0.5">
                  {metricas.devedores.length > 0
                    ? `${metricas.devedores.length} ${metricas.devedores.length === 1 ? 'cliente' : 'clientes'} · saldo acumulado total`
                    : 'Saldo acumulado total'}
                </p>
              </div>

              {metricas.devedores.length === 0 ? (
                <div className="py-10 text-center px-5">
                  <p className="text-sm font-medium text-emerald-600">Nenhuma pendência!</p>
                  <p className="text-xs text-stone-400 mt-1">Todas as clientes estão em dia.</p>
                </div>
              ) : (
                <>
                  {/* Exibe apenas as 5 primeiras no painel resumido */}
                  <div className="divide-y divide-stone-100">
                    {metricas.devedores.slice(0, 5).map(d => (
                      <Link
                        key={d.id}
                        href={`/clientes/${d.id}`}
                        className="flex items-center justify-between px-5 py-3.5 hover:bg-amber-50 transition-colors min-h-[52px]"
                      >
                        <div className="flex items-center gap-2.5">
                          <AlertCircle size={14} className="text-amber-400 shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-stone-800">{d.nome}</p>
                            {d.celular && <p className="text-xs text-stone-400">{d.celular}</p>}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-sm font-semibold text-amber-600 tabular-nums">
                            {fmtBRL(d.saldo_devedor)}
                          </span>
                          <ChevronRight size={14} className="text-stone-300" />
                        </div>
                      </Link>
                    ))}
                  </div>

                  {/* Botão "Ver todas" aparece quando há mais de 5 devedoras */}
                  {metricas.devedores.length > 5 && (
                    <div className="px-5 py-3 border-t border-stone-100 bg-stone-50">
                      <button
                        onClick={() => setModalDevedoras(true)}
                        className="w-full flex items-center justify-center gap-1.5 text-sm font-medium text-stone-600 hover:text-stone-800 min-h-[44px] transition-colors"
                      >
                        Ver todas ({metricas.devedores.length})
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* ── Gastos do período ───────────────────────────────── */}
          <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
              <div>
                <h2 className="text-sm font-semibold text-stone-700">Gastos do período</h2>
                <p className="text-xs text-stone-400 mt-0.5">
                  {gastos.length === 0
                    ? 'Nenhum gasto registrado'
                    : `${gastos.length} ${gastos.length === 1 ? 'item' : 'itens'} · Total: ${fmtBRL(metricas.total_gastos)}`}
                </p>
              </div>
              <button
                onClick={() => setModalGasto(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-stone-800 text-white rounded-xl text-sm font-medium hover:bg-stone-700 min-h-[44px] transition-colors"
              >
                <Plus size={16} />
                Adicionar
              </button>
            </div>

            {gastos.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-sm text-stone-400">Nenhum gasto registrado neste período.</p>
                <button
                  onClick={() => setModalGasto(true)}
                  className="mt-3 text-sm text-stone-600 underline underline-offset-2"
                >
                  Adicionar primeiro gasto
                </button>
              </div>
            ) : (
              <>
                {/* Cabeçalho da tabela */}
                <div className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-4 px-5 py-2.5 bg-stone-50 border-b border-stone-100">
                  <span className="text-xs font-semibold text-stone-400 uppercase tracking-wide">Data</span>
                  <span className="text-xs font-semibold text-stone-400 uppercase tracking-wide">Descrição</span>
                  <span className="text-xs font-semibold text-stone-400 uppercase tracking-wide text-right">Valor</span>
                  <span className="w-8" />
                </div>

                <div className="divide-y divide-stone-100">
                  {gastos.map(g => (
                    <div key={g.id} className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-4 px-5 py-3.5">
                      <span className="text-sm text-stone-500 tabular-nums whitespace-nowrap">
                        {fmtBR(g.data)}
                      </span>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          {g.categoria && (
                            <span className="text-xs px-2 py-0.5 bg-stone-100 text-stone-500 rounded-full shrink-0">
                              {g.categoria}
                            </span>
                          )}
                          <span className="text-sm text-stone-700 truncate">{g.descricao}</span>
                        </div>
                      </div>

                      <span className="text-sm font-semibold text-stone-700 tabular-nums whitespace-nowrap">
                        {fmtBRL(g.valor)}
                      </span>

                      <button
                        onClick={() => excluirGasto(g.id)}
                        disabled={excluindo === g.id}
                        className="p-2 text-stone-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center disabled:opacity-40"
                        title="Excluir gasto"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </>
      ) : null}

      {/* Modal: adicionar gasto */}
      {modalGasto && (
        <ModalGasto
          onSalvar={() => { setModalGasto(false); buscarDados() }}
          onFechar={() => setModalGasto(false)}
        />
      )}

      {/* Modal: listagem completa de devedoras */}
      {modalDevedoras && metricas && (
        <ModalDevedoras
          devedoras={metricas.devedores}
          onFechar={() => setModalDevedoras(false)}
        />
      )}
    </div>
  )
}
