'use client'

import { useState } from 'react'
import { X, ArrowDown, ArrowUp } from 'lucide-react'
import type { ProdutoItem } from '@/lib/types'

interface Props {
  produto: ProdutoItem
  onSalvar: (novaQtd: number) => void
  onFechar: () => void
}

const fmtQtd = (v: number) =>
  v % 1 === 0 ? String(Math.round(v)) : v.toFixed(2).replace('.', ',')

const hoje = () => new Date().toISOString().split('T')[0]

export default function ModalMovimentacao({ produto, onSalvar, onFechar }: Props) {
  const [tipo, setTipo] = useState<'entrada' | 'saída'>('entrada')
  const [quantidade, setQuantidade] = useState('')
  const [data, setData] = useState(hoje)
  const [observacao, setObservacao] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  const salvar = async () => {
    const qtd = parseFloat(quantidade.replace(',', '.'))
    if (!quantidade.trim() || isNaN(qtd) || qtd <= 0) {
      setErro('Informe uma quantidade válida.'); return
    }
    if (!data) { setErro('Data obrigatória.'); return }

    setSalvando(true)
    setErro('')
    try {
      const res = await fetch(`/api/produtos/${produto.id}/movimentacao`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo, quantidade: qtd, data, observacao: observacao.trim() || null }),
      })

      if (!res.ok) { setErro('Erro ao registrar movimentação.'); return }

      const { quantidade_atual } = await res.json()
      onSalvar(quantidade_atual)
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl shadow-xl">

        <div className="flex items-center justify-between px-6 py-5 border-b border-stone-100">
          <div>
            <h2 className="text-lg font-semibold text-stone-800">Registrar movimentação</h2>
            <p className="text-sm text-stone-500 mt-0.5">{produto.nome}</p>
          </div>
          <button onClick={onFechar} className="p-2 rounded-xl hover:bg-stone-100 min-h-[44px] min-w-[44px] flex items-center justify-center">
            <X size={20} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Estoque atual */}
          <div className="flex items-center justify-between bg-stone-50 border border-stone-100 rounded-xl px-4 py-3">
            <span className="text-sm text-stone-500">Estoque atual</span>
            <span className={`text-xl font-bold tabular-nums ${produto.quantidade_atual < 0 ? 'text-red-600' : 'text-stone-800'}`}>
              {fmtQtd(produto.quantidade_atual)}
            </span>
          </div>

          {/* Tipo de movimentação */}
          <div>
            <span className="block text-sm font-medium text-stone-700 mb-2">Tipo</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setTipo('entrada')}
                className={`flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all min-h-[44px] ${
                  tipo === 'entrada'
                    ? 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200'
                    : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
                }`}
              >
                <ArrowDown size={16} />
                Entrada
              </button>
              <button
                onClick={() => setTipo('saída')}
                className={`flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all min-h-[44px] ${
                  tipo === 'saída'
                    ? 'bg-red-100 text-red-700 ring-1 ring-red-200'
                    : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
                }`}
              >
                <ArrowUp size={16} />
                Saída
              </button>
            </div>
          </div>

          {/* Quantidade e data */}
          <div className="grid grid-cols-2 gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-stone-700">Quantidade *</span>
              <input
                type="text"
                inputMode="decimal"
                value={quantidade}
                onChange={e => setQuantidade(e.target.value)}
                placeholder="0"
                autoFocus
                className="px-3 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-stone-400 min-h-[44px]"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-stone-700">Data *</span>
              <input
                type="date"
                value={data}
                onChange={e => setData(e.target.value)}
                className="px-3 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-stone-400 min-h-[44px]"
              />
            </label>
          </div>

          {/* Preview do novo saldo */}
          {quantidade.trim() && !isNaN(parseFloat(quantidade.replace(',', '.'))) && (
            <div className="flex items-center justify-between text-sm px-1">
              <span className="text-stone-500">Novo estoque</span>
              <span className="font-semibold text-stone-800 tabular-nums">
                {fmtQtd(
                  produto.quantidade_atual +
                  (tipo === 'entrada' ? 1 : -1) *
                  parseFloat(quantidade.replace(',', '.'))
                )}
              </span>
            </div>
          )}

          {/* Observação */}
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-stone-700">Observação</span>
            <input
              type="text"
              value={observacao}
              onChange={e => setObservacao(e.target.value)}
              placeholder="Ex: Compra mensal, uso em atendimentos…"
              className="px-3 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-stone-400 min-h-[44px]"
            />
          </label>

          {erro && <p className="text-sm text-red-600">{erro}</p>}
        </div>

        <div className="px-6 py-4 border-t border-stone-100 flex justify-end gap-3">
          <button onClick={onFechar} className="px-5 py-2.5 rounded-xl text-sm font-medium text-stone-600 hover:bg-stone-100 min-h-[44px]">
            Cancelar
          </button>
          <button
            onClick={salvar}
            disabled={salvando}
            className="px-6 py-2.5 bg-stone-800 text-white rounded-xl text-sm font-medium hover:bg-stone-700 disabled:opacity-40 min-h-[44px] transition-colors"
          >
            {salvando ? 'Registrando…' : 'Registrar'}
          </button>
        </div>
      </div>
    </div>
  )
}
