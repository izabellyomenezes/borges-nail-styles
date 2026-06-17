'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Search, Check, UserPlus } from 'lucide-react'
import type { Cliente, Servico } from '@/lib/types'

interface Props {
  dataInicial?: string
  horarioInicial?: string
  onSalvar: () => void
  onFechar: () => void
}

export default function ModalNovoAgendamento({ dataInicial, horarioInicial, onSalvar, onFechar }: Props) {
  const [data, setData] = useState(dataInicial ?? '')
  const [horario, setHorario] = useState(horarioInicial ?? '09:00')
  const [observacoes, setObservacoes] = useState('')

  // --- Campo de cliente ---
  const [buscaTexto, setBuscaTexto] = useState('')
  const [sugestoes, setSugestoes] = useState<Cliente[]>([])
  const [mostrarSugestoes, setMostrarSugestoes] = useState(false)
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null)
  const [modoNovoCliente, setModoNovoCliente] = useState(false)
  const [novoNome, setNovoNome] = useState('')
  const [novoCelular, setNovoCelular] = useState('')
  const inputBuscaRef = useRef<HTMLInputElement>(null)

  // --- Serviços ---
  const [servicos, setServicos] = useState<Servico[]>([])
  const [selecionados, setSelecionados] = useState<string[]>([])

  const [salvando, setSalvando] = useState(false)

  // Carrega lista de serviços ao abrir o modal
  useEffect(() => {
    fetch('/api/servicos').then(r => r.json()).then(setServicos)
  }, [])

  // Debounce para autocomplete de clientes
  useEffect(() => {
    if (modoNovoCliente || buscaTexto.length < 1) {
      setSugestoes([])
      return
    }
    const t = setTimeout(async () => {
      const res = await fetch(`/api/clientes?busca=${encodeURIComponent(buscaTexto)}`)
      const dados: Cliente[] = await res.json()
      setSugestoes(dados)
      setMostrarSugestoes(dados.length > 0)
    }, 280)
    return () => clearTimeout(t)
  }, [buscaTexto, modoNovoCliente])

  const escolherCliente = (c: Cliente) => {
    setClienteSelecionado(c)
    setBuscaTexto(c.nome)
    setMostrarSugestoes(false)
  }

  const trocarModo = () => {
    setModoNovoCliente(v => !v)
    setClienteSelecionado(null)
    setBuscaTexto('')
    setNovoNome('')
    setNovoCelular('')
    setSugestoes([])
  }

  const toggleServico = (id: string) =>
    setSelecionados(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id])

  const podeSalvar =
    data &&
    horario &&
    (clienteSelecionado !== null || (modoNovoCliente && novoNome.trim() !== ''))

  const salvar = async () => {
    if (!podeSalvar) return
    setSalvando(true)
    try {
      const body = clienteSelecionado
        ? { cliente_id: clienteSelecionado.id, data, horario, observacoes, servico_ids: selecionados }
        : { cliente_nome: novoNome.trim(), cliente_celular: novoCelular || null, data, horario, observacoes, servico_ids: selecionados }

      await fetch('/api/agendamentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      onSalvar()
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl shadow-xl flex flex-col max-h-[92dvh]">

        {/* Cabeçalho */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-stone-100 shrink-0">
          <h2 className="text-lg font-semibold text-stone-800">Novo agendamento</h2>
          <button onClick={onFechar} className="p-2 rounded-xl hover:bg-stone-100 min-h-[44px] min-w-[44px] flex items-center justify-center">
            <X size={20} />
          </button>
        </div>

        {/* Conteúdo rolável */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

          {/* Data e horário */}
          <div className="grid grid-cols-2 gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-stone-700">Data</span>
              <input
                type="date"
                value={data}
                onChange={e => setData(e.target.value)}
                className="px-3 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-stone-400 min-h-[44px]"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-stone-700">Horário</span>
              <input
                type="time"
                value={horario}
                onChange={e => setHorario(e.target.value)}
                className="px-3 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-stone-400 min-h-[44px]"
              />
            </label>
          </div>

          {/* Cliente */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-stone-700">Cliente</span>
              <button
                onClick={trocarModo}
                className="flex items-center gap-1 text-xs text-stone-500 hover:text-stone-800 py-1"
              >
                <UserPlus size={12} />
                {modoNovoCliente ? 'Buscar existente' : 'Cadastrar novo'}
              </button>
            </div>

            {modoNovoCliente ? (
              <div className="space-y-3">
                <input
                  placeholder="Nome *"
                  value={novoNome}
                  onChange={e => setNovoNome(e.target.value)}
                  className="w-full px-3 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-stone-400 min-h-[44px]"
                />
                <input
                  type="tel"
                  placeholder="Celular"
                  value={novoCelular}
                  onChange={e => setNovoCelular(e.target.value)}
                  className="w-full px-3 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-stone-400 min-h-[44px]"
                />
              </div>
            ) : (
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
                <input
                  ref={inputBuscaRef}
                  placeholder="Buscar por nome..."
                  value={buscaTexto}
                  onChange={e => { setBuscaTexto(e.target.value); setClienteSelecionado(null) }}
                  onFocus={() => sugestoes.length > 0 && setMostrarSugestoes(true)}
                  onBlur={() => setTimeout(() => setMostrarSugestoes(false), 150)}
                  className="w-full pl-9 pr-9 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-stone-400 min-h-[44px]"
                />
                {clienteSelecionado && (
                  <Check size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-600" />
                )}

                {mostrarSugestoes && (
                  <div className="absolute z-20 inset-x-0 mt-1 bg-white border border-stone-200 rounded-xl shadow-lg overflow-hidden">
                    {sugestoes.map(c => (
                      <button
                        key={c.id}
                        onMouseDown={() => escolherCliente(c)}
                        className="w-full px-4 py-3 text-left hover:bg-stone-50 transition-colors"
                      >
                        <div className="text-sm font-medium text-stone-800">{c.nome}</div>
                        {c.celular && <div className="text-xs text-stone-500">{c.celular}</div>}
                      </button>
                    ))}
                  </div>
                )}

                {buscaTexto.length > 0 && !mostrarSugestoes && !clienteSelecionado && sugestoes.length === 0 && (
                  <p className="mt-1 text-xs text-stone-400 px-1">Nenhum cliente encontrado</p>
                )}
              </div>
            )}
          </div>

          {/* Serviços */}
          {servicos.length > 0 && (
            <div>
              <span className="block text-sm font-medium text-stone-700 mb-2">Serviços</span>
              <div className="border border-stone-200 rounded-xl divide-y divide-stone-100 max-h-48 overflow-y-auto">
                {servicos.map(s => (
                  <label key={s.id} className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-stone-50 min-h-[44px]">
                    <input
                      type="checkbox"
                      checked={selecionados.includes(s.id)}
                      onChange={() => toggleServico(s.id)}
                      className="w-4 h-4 rounded accent-stone-800"
                    />
                    <span className="flex-1 text-sm text-stone-700">{s.nome}</span>
                    {s.preco_base != null && (
                      <span className="text-xs text-stone-400">
                        R$ {s.preco_base.toFixed(2).replace('.', ',')}
                      </span>
                    )}
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Observações */}
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-stone-700">Observações</span>
            <textarea
              value={observacoes}
              onChange={e => setObservacoes(e.target.value)}
              placeholder="Detalhes adicionais..."
              rows={3}
              className="px-3 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-stone-400 resize-none"
            />
          </label>
        </div>

        {/* Rodapé */}
        <div className="px-6 py-4 border-t border-stone-100 flex justify-end gap-3 shrink-0">
          <button
            onClick={onFechar}
            className="px-5 py-2.5 rounded-xl text-sm font-medium text-stone-600 hover:bg-stone-100 min-h-[44px]"
          >
            Cancelar
          </button>
          <button
            onClick={salvar}
            disabled={salvando || !podeSalvar}
            className="px-6 py-2.5 bg-stone-800 text-white rounded-xl text-sm font-medium hover:bg-stone-700 disabled:opacity-40 min-h-[44px] transition-colors"
          >
            {salvando ? 'Salvando…' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  )
}
