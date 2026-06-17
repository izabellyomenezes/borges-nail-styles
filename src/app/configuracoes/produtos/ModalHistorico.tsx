'use client'

import { useState, useEffect } from 'react'
import { X, ArrowDown, ArrowUp } from 'lucide-react'
import type { ProdutoItem, MovimentacaoItem } from '@/lib/types'

interface Props {
  produto: ProdutoItem
  onFechar: () => void
}

const fmtBR = (iso: string) => {
  const [a, m, d] = iso.split('-')
  return `${d}/${m}/${a}`
}

const fmtQtd = (v: number) =>
  v % 1 === 0 ? String(Math.round(v)) : v.toFixed(2).replace('.', ',')

export default function ModalHistorico({ produto, onFechar }: Props) {
  const [movimentacoes, setMovimentacoes] = useState<MovimentacaoItem[]>([])
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    fetch(`/api/produtos/${produto.id}/movimentacoes`)
      .then(r => r.json())
      .then(dados => { setMovimentacoes(dados); setCarregando(false) })
  }, [produto.id])

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl shadow-xl flex flex-col max-h-[85dvh]">

        <div className="flex items-center justify-between px-6 py-5 border-b border-stone-100 shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-stone-800">Histórico de movimentações</h2>
            <p className="text-sm text-stone-500 mt-0.5">{produto.nome}</p>
          </div>
          <button onClick={onFechar} className="p-2 rounded-xl hover:bg-stone-100 min-h-[44px] min-w-[44px] flex items-center justify-center">
            <X size={20} />
          </button>
        </div>

        {/* Saldo atual */}
        <div className="px-6 py-3 bg-stone-50 border-b border-stone-100 shrink-0 flex items-center justify-between">
          <span className="text-sm text-stone-500">Estoque atual</span>
          <span className={`text-lg font-bold tabular-nums ${produto.quantidade_atual < 0 ? 'text-red-600' : 'text-stone-800'}`}>
            {fmtQtd(produto.quantidade_atual)}
          </span>
        </div>

        {/* Lista de movimentações */}
        <div className="overflow-y-auto flex-1">
          {carregando ? (
            <p className="text-sm text-stone-400 py-10 text-center">Carregando…</p>
          ) : movimentacoes.length === 0 ? (
            <p className="text-sm text-stone-400 py-10 text-center">
              Nenhuma movimentação registrada.
            </p>
          ) : (
            <div className="divide-y divide-stone-100">
              {movimentacoes.map(m => (
                <div key={m.id} className="flex items-center gap-4 px-6 py-4">
                  {/* Ícone e tipo */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    m.tipo === 'entrada' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
                  }`}>
                    {m.tipo === 'entrada'
                      ? <ArrowDown size={14} />
                      : <ArrowUp size={14} />
                    }
                  </div>

                  {/* Data e observação */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-stone-700 font-medium capitalize">{m.tipo}</p>
                    {m.observacao && (
                      <p className="text-xs text-stone-400 truncate mt-0.5">{m.observacao}</p>
                    )}
                  </div>

                  {/* Data */}
                  <span className="text-xs text-stone-400 shrink-0">{fmtBR(m.data)}</span>

                  {/* Quantidade com sinal */}
                  <span className={`text-sm font-semibold tabular-nums w-16 text-right shrink-0 ${
                    m.tipo === 'entrada' ? 'text-emerald-600' : 'text-red-600'
                  }`}>
                    {m.tipo === 'entrada' ? '+' : '−'}{fmtQtd(m.quantidade)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-stone-100 flex justify-end shrink-0">
          <button
            onClick={onFechar}
            className="px-6 py-2.5 bg-stone-100 text-stone-700 rounded-xl text-sm font-medium hover:bg-stone-200 min-h-[44px] transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}
