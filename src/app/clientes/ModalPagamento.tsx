'use client'

import { useState } from 'react'
import { X } from 'lucide-react'

interface Props {
  clienteId: string
  clienteNome: string
  onSalvar: () => void
  onFechar: () => void
}

const hoje = () => new Date().toISOString().split('T')[0]

export default function ModalPagamento({ clienteId, clienteNome, onSalvar, onFechar }: Props) {
  const [valor, setValor] = useState('')
  const [data, setData] = useState(hoje)
  const [observacoes, setObservacoes] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  const salvar = async () => {
    const v = parseFloat(valor.replace(',', '.'))
    if (!valor.trim() || isNaN(v) || v <= 0) { setErro('Informe um valor válido.'); return }
    if (!data) { setErro('Informe a data.'); return }

    setSalvando(true)
    setErro('')
    try {
      const res = await fetch(`/api/clientes/${clienteId}/pagamento`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ valor: v, data, observacoes: observacoes.trim() || null }),
      })
      if (!res.ok) { setErro('Erro ao registrar pagamento.'); return }
      onSalvar()
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl shadow-xl">

        <div className="flex items-center justify-between px-6 py-5 border-b border-stone-100">
          <div>
            <h2 className="text-lg font-semibold text-stone-800">Registrar pagamento</h2>
            <p className="text-sm text-stone-500 mt-0.5">{clienteNome}</p>
          </div>
          <button onClick={onFechar} className="p-2 rounded-xl hover:bg-stone-100 min-h-[44px] min-w-[44px] flex items-center justify-center">
            <X size={20} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
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
                autoFocus
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
            <span className="text-sm font-medium text-stone-700">Observações</span>
            <textarea
              value={observacoes}
              onChange={e => setObservacoes(e.target.value)}
              placeholder="Ex: pagamento referente às sessões de maio"
              rows={3}
              className="px-3 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-stone-400 resize-none"
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
            {salvando ? 'Salvando…' : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  )
}
