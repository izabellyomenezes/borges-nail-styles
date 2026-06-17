'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import type { ProdutoItem } from '@/lib/types'

interface Props {
  produto: ProdutoItem | null  // null → modo criar
  onSalvar: () => void
  onFechar: () => void
}

export default function ModalProduto({ produto, onSalvar, onFechar }: Props) {
  const editando = produto !== null

  const [nome, setNome] = useState(produto?.nome ?? '')
  const [qtdInicial, setQtdInicial] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  const salvar = async () => {
    if (!nome.trim()) { setErro('Nome obrigatório.'); return }

    if (!editando && qtdInicial.trim()) {
      const v = parseFloat(qtdInicial.replace(',', '.'))
      if (isNaN(v) || v < 0) { setErro('Quantidade inicial inválida.'); return }
    }

    setSalvando(true)
    setErro('')
    try {
      if (editando) {
        const res = await fetch(`/api/produtos/${produto!.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nome: nome.trim() }),
        })
        if (!res.ok) { setErro('Erro ao salvar.'); return }
      } else {
        const qtd = qtdInicial.trim()
          ? parseFloat(qtdInicial.replace(',', '.'))
          : 0
        const res = await fetch('/api/produtos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nome: nome.trim(), quantidade_inicial: qtd }),
        })
        if (!res.ok) { setErro('Erro ao criar.'); return }
      }
      onSalvar()
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl shadow-xl">

        <div className="flex items-center justify-between px-6 py-5 border-b border-stone-100">
          <h2 className="text-lg font-semibold text-stone-800">
            {editando ? 'Editar produto' : 'Novo produto'}
          </h2>
          <button onClick={onFechar} className="p-2 rounded-xl hover:bg-stone-100 min-h-[44px] min-w-[44px] flex items-center justify-center">
            <X size={20} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-stone-700">Nome *</span>
            <input
              type="text"
              value={nome}
              onChange={e => setNome(e.target.value)}
              placeholder="Ex: Esmalte vermelho"
              autoFocus
              className="px-3 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-stone-400 min-h-[44px]"
            />
          </label>

          {/* Quantidade inicial só disponível na criação;
              depois disso, o saldo é controlado via movimentações */}
          {!editando && (
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-stone-700">Quantidade inicial</span>
              <input
                type="text"
                inputMode="decimal"
                value={qtdInicial}
                onChange={e => setQtdInicial(e.target.value)}
                placeholder="0"
                className="px-3 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-stone-400 min-h-[44px]"
              />
              <span className="text-xs text-stone-400">
                Após criar, use "Movimentação" para ajustar o estoque.
              </span>
            </label>
          )}

          {editando && (
            <p className="text-xs text-stone-400 bg-stone-50 border border-stone-100 rounded-xl px-4 py-3">
              O estoque de <strong>{produto!.nome}</strong> é atualizado via movimentações — não é editável diretamente.
            </p>
          )}

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
            {salvando ? 'Salvando…' : editando ? 'Salvar' : 'Criar'}
          </button>
        </div>
      </div>
    </div>
  )
}
