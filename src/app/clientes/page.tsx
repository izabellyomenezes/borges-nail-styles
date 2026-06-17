'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Search, Plus, AlertCircle, ChevronRight } from 'lucide-react'
import type { ClienteListItem } from '@/lib/types'
import ModalClienteForm from './ModalClienteForm'

const fmtBRL = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default function ClientesPage() {
  const router = useRouter()
  const [busca, setBusca] = useState('')
  const [clientes, setClientes] = useState<ClienteListItem[]>([])
  const [carregando, setCarregando] = useState(true)
  const [modalAberto, setModalAberto] = useState(false)

  const buscarClientes = useCallback(async (termo: string) => {
    setCarregando(true)
    try {
      const url = termo.trim()
        ? `/api/clientes?busca=${encodeURIComponent(termo)}`
        : '/api/clientes'
      const res = await fetch(url)
      setClientes(await res.json())
    } finally {
      setCarregando(false)
    }
  }, [])

  // Busca inicial
  useEffect(() => { buscarClientes('') }, [buscarClientes])

  // Debounce da busca ao digitar
  useEffect(() => {
    const t = setTimeout(() => buscarClientes(busca), 280)
    return () => clearTimeout(t)
  }, [busca, buscarClientes])

  const aoSalvarNova = (id: string) => {
    setModalAberto(false)
    router.push(`/clientes/${id}`)
  }

  const devedores = clientes.filter(c => c.saldo_devedor > 0).length

  return (
    <div className="flex flex-col gap-6 max-w-3xl">

      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-stone-800">Clientes</h1>
          {devedores > 0 && (
            <p className="text-sm text-amber-600 mt-0.5 flex items-center gap-1">
              <AlertCircle size={13} />
              {devedores} {devedores === 1 ? 'cliente com saldo devedor' : 'clientes com saldo devedor'}
            </p>
          )}
        </div>
        <button
          onClick={() => setModalAberto(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-stone-800 text-white rounded-xl text-sm font-medium hover:bg-stone-700 min-h-[44px] transition-colors"
        >
          <Plus size={18} />
          Nova cliente
        </button>
      </div>

      {/* Campo de busca */}
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Buscar por nome…"
          value={busca}
          onChange={e => setBusca(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-stone-400 min-h-[44px] bg-white"
        />
        {busca && (
          <button
            onClick={() => setBusca('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 text-lg leading-none"
          >
            ×
          </button>
        )}
      </div>

      {/* Lista */}
      {carregando ? (
        <p className="text-sm text-stone-400 py-8 text-center">Carregando…</p>
      ) : clientes.length === 0 ? (
        <div className="text-center py-16 text-stone-400">
          <p className="text-sm">{busca ? 'Nenhuma cliente encontrada.' : 'Nenhuma cliente cadastrada ainda.'}</p>
          {!busca && (
            <button onClick={() => setModalAberto(true)} className="mt-3 text-sm text-stone-600 underline underline-offset-2">
              Cadastrar primeira cliente
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden divide-y divide-stone-100">
          {/* Cabeçalho da tabela */}
          <div className="grid grid-cols-[1fr_auto_auto] items-center px-5 py-2.5 bg-stone-50">
            <span className="text-xs font-semibold text-stone-400 uppercase tracking-wide">Nome</span>
            <span className="text-xs font-semibold text-stone-400 uppercase tracking-wide w-36 text-right">Celular</span>
            <span className="text-xs font-semibold text-stone-400 uppercase tracking-wide w-36 text-right pr-1">Saldo</span>
          </div>

          {clientes.map(c => {
            const temDivida = c.saldo_devedor > 0
            return (
              <Link
                key={c.id}
                href={`/clientes/${c.id}`}
                className={`grid grid-cols-[1fr_auto_auto] items-center px-5 py-4 hover:bg-stone-50 transition-colors min-h-[60px] ${
                  temDivida ? 'bg-amber-50/60 hover:bg-amber-50' : ''
                }`}
              >
                <div>
                  <div className={`font-medium text-sm ${temDivida ? 'text-stone-800' : 'text-stone-700'}`}>
                    {c.nome}
                  </div>
                  {c.indicado_por && (
                    <div className="text-xs text-stone-400 mt-0.5">Indicada por {c.indicado_por}</div>
                  )}
                </div>

                <span className="text-sm text-stone-500 w-36 text-right tabular-nums">
                  {c.celular ?? '—'}
                </span>

                <div className="flex items-center gap-1 w-36 justify-end">
                  {temDivida ? (
                    <span className="text-sm font-semibold text-amber-600 tabular-nums">
                      {fmtBRL(c.saldo_devedor)}
                    </span>
                  ) : (
                    <span className="text-sm text-stone-300">—</span>
                  )}
                  <ChevronRight size={16} className="text-stone-300 shrink-0" />
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {/* Total de clientes */}
      {clientes.length > 0 && (
        <p className="text-xs text-stone-400 text-center">
          {clientes.length} {clientes.length === 1 ? 'cliente' : 'clientes'}
        </p>
      )}

      {/* Modal: nova cliente */}
      {modalAberto && (
        <ModalClienteForm
          cliente={null}
          onSalvar={aoSalvarNova}
          onFechar={() => setModalAberto(false)}
        />
      )}
    </div>
  )
}
