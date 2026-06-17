'use client'

import Link from 'next/link'
import { X, AlertCircle, ChevronRight } from 'lucide-react'

interface Devedor {
  id: string
  nome: string
  celular: string | null
  saldo_devedor: number
}

interface Props {
  devedoras: Devedor[]
  onFechar: () => void
}

const fmtBRL = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default function ModalDevedoras({ devedoras, onFechar }: Props) {
  const total = devedoras.reduce((acc, d) => acc + d.saldo_devedor, 0)

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl shadow-xl flex flex-col max-h-[85dvh]">

        {/* Cabeçalho */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-stone-100 shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-stone-800">Clientes com saldo devedor</h2>
            <p className="text-sm text-stone-500 mt-0.5">
              {devedoras.length} {devedoras.length === 1 ? 'cliente' : 'clientes'} · maior saldo primeiro
            </p>
          </div>
          <button
            onClick={onFechar}
            className="p-2 rounded-xl hover:bg-stone-100 min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <X size={20} />
          </button>
        </div>

        {/* Lista completa — rolável */}
        <div className="overflow-y-auto flex-1 divide-y divide-stone-100">
          {devedoras.map((d, i) => (
            <Link
              key={d.id}
              href={`/clientes/${d.id}`}
              onClick={onFechar}
              className="flex items-center justify-between px-6 py-4 hover:bg-amber-50 transition-colors min-h-[60px]"
            >
              <div className="flex items-center gap-3">
                {/* Posição no ranking */}
                <span className="text-xs font-bold text-stone-300 w-5 text-right shrink-0 tabular-nums">
                  {i + 1}
                </span>
                <AlertCircle size={14} className="text-amber-400 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-stone-800">{d.nome}</p>
                  {d.celular && (
                    <p className="text-xs text-stone-400 mt-0.5">{d.celular}</p>
                  )}
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

        {/* Rodapé com total geral */}
        <div className="px-6 py-4 border-t border-stone-200 bg-amber-50 shrink-0 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide">
              Total geral a receber
            </p>
            <p className="text-xl font-bold text-amber-600 tabular-nums mt-0.5">
              {fmtBRL(total)}
            </p>
          </div>
          <button
            onClick={onFechar}
            className="px-6 py-2.5 bg-white text-stone-700 border border-stone-200 rounded-xl text-sm font-medium hover:bg-stone-50 min-h-[44px] transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}
