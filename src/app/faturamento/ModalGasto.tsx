'use client'

import { useState } from 'react'
import { X } from 'lucide-react'

interface Props {
  onSalvar: () => void
  onFechar: () => void
}

// Sugestões de categoria para datalist
const CATEGORIAS = ['Material', 'Produtos', 'Aluguel', 'Equipamentos', 'Marketing', 'Transporte', 'Alimentação', 'Outros']

const hoje = () => new Date().toISOString().split('T')[0]

export default function ModalGasto({ onSalvar, onFechar }: Props) {
  const [descricao, setDescricao] = useState('')
  const [valor, setValor] = useState('')
  const [data, setData] = useState(hoje)
  const [categoria, setCategoria] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  const salvar = async () => {
    if (!descricao.trim()) { setErro('Descrição obrigatória.'); return }
    const v = parseFloat(valor.replace(',', '.'))
    if (!valor.trim() || isNaN(v) || v <= 0) { setErro('Informe um valor válido.'); return }
    if (!data) { setErro('Data obrigatória.'); return }

    setSalvando(true)
    setErro('')
    try {
      const res = await fetch('/api/gastos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          descricao: descricao.trim(),
          valor: v,
          data,
          categoria: categoria.trim() || null,
        }),
      })
      if (!res.ok) { setErro('Erro ao salvar gasto.'); return }
      onSalvar()
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl shadow-xl">

        <div className="flex items-center justify-between px-6 py-5 border-b border-stone-100">
          <h2 className="text-lg font-semibold text-stone-800">Adicionar gasto</h2>
          <button onClick={onFechar} className="p-2 rounded-xl hover:bg-stone-100 min-h-[44px] min-w-[44px] flex items-center justify-center">
            <X size={20} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-stone-700">Descrição *</span>
            <input
              type="text"
              value={descricao}
              onChange={e => setDescricao(e.target.value)}
              placeholder="Ex: Esmaltes e bases"
              className="px-3 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-stone-400 min-h-[44px]"
              autoFocus
            />
          </label>

          <div className="grid grid-cols-2 gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-stone-700">Valor (R$) *</span>
              <input
                type="text"
                inputMode="decimal"
                value={valor}
                onChange={e => setValor(e.target.value)}
                placeholder="0,00"
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

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-stone-700">Categoria</span>
            <input
              type="text"
              list="lista-categorias-gasto"
              value={categoria}
              onChange={e => setCategoria(e.target.value)}
              placeholder="Ex: Material"
              className="px-3 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-stone-400 min-h-[44px]"
            />
            <datalist id="lista-categorias-gasto">
              {CATEGORIAS.map(c => <option key={c} value={c} />)}
            </datalist>
          </label>

          {erro && <p className="text-sm text-red-600">{erro}</p>}
        </div>

        <div className="px-6 py-4 border-t border-stone-100 flex justify-end gap-3">
          <button
            onClick={onFechar}
            className="px-5 py-2.5 rounded-xl text-sm font-medium text-stone-600 hover:bg-stone-100 min-h-[44px]"
          >
            Cancelar
          </button>
          <button
            onClick={salvar}
            disabled={salvando}
            className="px-6 py-2.5 bg-stone-800 text-white rounded-xl text-sm font-medium hover:bg-stone-700 disabled:opacity-40 min-h-[44px] transition-colors"
          >
            {salvando ? 'Salvando…' : 'Adicionar'}
          </button>
        </div>
      </div>
    </div>
  )
}
