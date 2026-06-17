'use client'

import { useState, useEffect, useMemo } from 'react'
import { X, Trash2, Plus, RotateCcw } from 'lucide-react'
import type { Agendamento, Servico, ProdutoItem, AgendamentoProdutoItem } from '@/lib/types'

type Status = 'agendado' | 'concluído' | 'cancelado'

interface Props {
  agendamento: Agendamento
  onSalvar: () => void
  onFechar: () => void
  onExcluir: () => void
}

const fmtBR = (iso: string) => {
  const [a, m, d] = iso.split('-')
  return `${d}/${m}/${a}`
}

const fmtBRL = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const corStatus: Record<Status, string> = {
  agendado: 'bg-sky-100 text-sky-700',
  concluído: 'bg-emerald-100 text-emerald-700',
  cancelado: 'bg-stone-100 text-stone-500',
}

export default function ModalEditarAgendamento({ agendamento, onSalvar, onFechar, onExcluir }: Props) {
  const [status, setStatus] = useState<Status>(agendamento.status)
  const [pago, setPago] = useState(agendamento.pago)
  const [observacoes, setObservacoes] = useState(agendamento.observacoes ?? '')
  const [salvando, setSalvando] = useState(false)
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false)

  // IDs dos serviços selecionados para este agendamento
  const [servicosSelecionados, setServicosSelecionados] = useState<string[]>(
    agendamento.servicos.map(s => s.id),
  )

  // Lista completa de serviços e produtos do salão (carregados ao abrir)
  const [todosServicos, setTodosServicos] = useState<Servico[]>([])
  const [todosProdutos, setTodosProdutos] = useState<ProdutoItem[]>([])
  const [carregando, setCarregando] = useState(true)

  // Produtos vendidos neste atendimento
  const [produtosNoAtendimento, setProdutosNoAtendimento] = useState<AgendamentoProdutoItem[]>([])

  // Formulário para adicionar um produto
  const [addProdutoId, setAddProdutoId] = useState('')
  const [addQtd, setAddQtd] = useState('1')
  const [addPreco, setAddPreco] = useState('')
  const [addErro, setAddErro] = useState('')

  // Valor cobrado: auto-preenchido pelo total calculado, mas editável
  const [valorStr, setValorStr] = useState(
    agendamento.valor_cobrado != null
      ? String(agendamento.valor_cobrado).replace('.', ',')
      : '',
  )
  // Indica se o usuário sobrescreveu o valor manualmente
  const [valorManual, setValorManual] = useState(agendamento.valor_cobrado != null)

  // Carrega serviços, produtos e produtos já vinculados ao agendamento
  useEffect(() => {
    Promise.all([
      fetch('/api/servicos').then(r => r.json()),
      fetch('/api/produtos').then(r => r.json()),
      fetch(`/api/agendamentos/${agendamento.id}`).then(r => r.json()),
    ]).then(([servs, prods, detalhes]) => {
      setTodosServicos(servs)
      setTodosProdutos(prods)
      if (detalhes.produtos?.length) {
        setProdutosNoAtendimento(detalhes.produtos)
      }
      setCarregando(false)
    })
  }, [agendamento.id])

  // Total calculado: soma dos serviços selecionados + produtos adicionados
  const totalServicos = useMemo(
    () => todosServicos
      .filter(s => servicosSelecionados.includes(s.id))
      .reduce((acc, s) => acc + (s.preco_base ?? 0), 0),
    [todosServicos, servicosSelecionados],
  )

  const totalProdutos = useMemo(
    () => produtosNoAtendimento.reduce((acc, p) => acc + p.quantidade * p.preco_unitario, 0),
    [produtosNoAtendimento],
  )

  const totalCalculado = totalServicos + totalProdutos

  // Sincroniza o campo de valor com o total quando não foi editado manualmente
  useEffect(() => {
    if (!valorManual) {
      setValorStr(totalCalculado > 0 ? totalCalculado.toFixed(2).replace('.', ',') : '')
    }
  }, [totalCalculado, valorManual])

  const restaurarTotalCalculado = () => {
    setValorStr(totalCalculado > 0 ? totalCalculado.toFixed(2).replace('.', ',') : '')
    setValorManual(false)
  }

  const toggleServico = (id: string) => {
    setServicosSelecionados(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id],
    )
  }

  // Produtos disponíveis para adicionar (exclui os já adicionados)
  const produtosDisponiveis = todosProdutos.filter(
    p => !produtosNoAtendimento.some(pa => pa.produto_id === p.id),
  )

  const adicionarProduto = () => {
    setAddErro('')
    if (!addProdutoId) { setAddErro('Selecione um produto.'); return }
    const qtd = parseFloat(addQtd.replace(',', '.'))
    if (isNaN(qtd) || qtd <= 0) { setAddErro('Quantidade inválida.'); return }
    const preco = parseFloat(addPreco.replace(',', '.'))
    if (isNaN(preco) || preco < 0) { setAddErro('Preço inválido.'); return }

    const produto = todosProdutos.find(p => p.id === addProdutoId)!
    setProdutosNoAtendimento(prev => [
      ...prev,
      { produto_id: addProdutoId, nome: produto.nome, quantidade: qtd, preco_unitario: preco },
    ])
    // Sincroniza valor cobrado com o novo total
    setValorManual(false)
    setAddProdutoId('')
    setAddQtd('1')
    setAddPreco('')
  }

  const removerProduto = (produtoId: string) => {
    setProdutosNoAtendimento(prev => prev.filter(p => p.produto_id !== produtoId))
  }

  const salvar = async () => {
    // Bloqueia se o usuário selecionou um produto mas não clicou em "Adicionar produto"
    if (addProdutoId) {
      setAddErro('Clique em "+ Adicionar produto" antes de salvar.')
      return
    }
    setSalvando(true)
    try {
      const valor = valorStr.trim() ? parseFloat(valorStr.replace(',', '.')) : null
      await fetch(`/api/agendamentos/${agendamento.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          valor_cobrado: valor,
          pago,
          observacoes,
          servicos: servicosSelecionados,
          produtos: produtosNoAtendimento,
        }),
      })
      onSalvar()
    } finally {
      setSalvando(false)
    }
  }

  const excluir = async () => {
    await fetch(`/api/agendamentos/${agendamento.id}`, { method: 'DELETE' })
    onExcluir()
  }

  // Valor atual como número para comparar com o total
  const valorAtualNum = parseFloat(valorStr.replace(',', '.'))
  const valorDifereDoTotal =
    valorManual && totalCalculado > 0 && !isNaN(valorAtualNum) &&
    Math.abs(valorAtualNum - totalCalculado) > 0.01

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl shadow-xl flex flex-col max-h-[92dvh]">

        {/* Cabeçalho */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-stone-100 shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-stone-800">{agendamento.cliente_nome}</h2>
            <p className="text-sm text-stone-500 mt-0.5">
              {fmtBR(agendamento.data)} às {agendamento.horario}
            </p>
            <span className={`inline-block mt-2 px-2.5 py-0.5 rounded-full text-xs font-medium ${corStatus[status]}`}>
              {status}
            </span>
          </div>
          <button
            onClick={onFechar}
            className="p-2 rounded-xl hover:bg-stone-100 min-h-[44px] min-w-[44px] flex items-center justify-center mt-0.5"
          >
            <X size={20} />
          </button>
        </div>

        {/* Conteúdo rolável */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-6">

          {/* Status */}
          <div>
            <span className="block text-sm font-medium text-stone-700 mb-2">Status</span>
            <div className="grid grid-cols-3 gap-2">
              {(['agendado', 'concluído', 'cancelado'] as Status[]).map(s => (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  className={`py-2.5 rounded-xl text-sm font-medium capitalize transition-all min-h-[44px] ${
                    status === s
                      ? s === 'cancelado'
                        ? 'bg-red-100 text-red-700 ring-1 ring-red-200'
                        : s === 'concluído'
                          ? 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200'
                          : 'bg-stone-800 text-white'
                      : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Serviços — lista de checkboxes */}
          <div>
            <span className="block text-sm font-medium text-stone-700 mb-2">Serviços</span>
            {carregando ? (
              <p className="text-sm text-stone-400">Carregando…</p>
            ) : todosServicos.length === 0 ? (
              <p className="text-sm text-stone-400">Nenhum serviço cadastrado.</p>
            ) : (
              <div className="border border-stone-200 rounded-xl divide-y divide-stone-100 overflow-hidden">
                {todosServicos.map(s => {
                  const selecionado = servicosSelecionados.includes(s.id)
                  return (
                    <button
                      key={s.id}
                      onClick={() => toggleServico(s.id)}
                      className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors min-h-[44px] ${
                        selecionado ? 'bg-stone-50' : 'hover:bg-stone-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {/* Checkbox visual */}
                        <span className={`w-5 h-5 rounded flex items-center justify-center border-2 shrink-0 transition-colors ${
                          selecionado
                            ? 'bg-stone-800 border-stone-800 text-white'
                            : 'border-stone-300'
                        }`}>
                          {selecionado && (
                            <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                              <path d="M1 4L4 7L9 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </span>
                        <span className={`text-sm ${selecionado ? 'text-stone-800 font-medium' : 'text-stone-600'}`}>
                          {s.nome}
                        </span>
                      </div>
                      {s.preco_base != null && (
                        <span className="text-sm text-stone-400 tabular-nums">
                          {fmtBRL(s.preco_base)}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Produtos vendidos no atendimento */}
          <div>
            <span className="block text-sm font-medium text-stone-700 mb-2">Produtos vendidos</span>

            {/* Lista dos produtos já adicionados */}
            {produtosNoAtendimento.length > 0 && (
              <div className="border border-stone-200 rounded-xl divide-y divide-stone-100 overflow-hidden mb-3">
                {produtosNoAtendimento.map(p => (
                  <div key={p.produto_id} className="flex items-center justify-between px-4 py-3 min-h-[48px]">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-stone-800 truncate">{p.nome}</p>
                      <p className="text-xs text-stone-400 tabular-nums">
                        {p.quantidade % 1 === 0 ? p.quantidade : p.quantidade.toFixed(2)} ×{' '}
                        {fmtBRL(p.preco_unitario)} ={' '}
                        <span className="text-stone-600 font-medium">{fmtBRL(p.quantidade * p.preco_unitario)}</span>
                      </p>
                    </div>
                    <button
                      onClick={() => removerProduto(p.produto_id)}
                      className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg ml-3 min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Formulário para adicionar produto */}
            {carregando ? null : produtosDisponiveis.length === 0 && produtosNoAtendimento.length === 0 ? (
              <p className="text-sm text-stone-400">Nenhum produto cadastrado.</p>
            ) : produtosDisponiveis.length > 0 ? (
              <div className="space-y-2">
                <div className="grid grid-cols-[1fr_80px_90px] gap-2">
                  <select
                    value={addProdutoId}
                    onChange={e => setAddProdutoId(e.target.value)}
                    className="px-3 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-stone-400 min-h-[44px] bg-white text-stone-700"
                  >
                    <option value="">Selecionar produto…</option>
                    {produtosDisponiveis.map(p => (
                      <option key={p.id} value={p.id}>{p.nome}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="Qtd"
                    value={addQtd}
                    onChange={e => setAddQtd(e.target.value)}
                    className="px-3 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-stone-400 min-h-[44px] text-center"
                  />
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="R$ unit."
                    value={addPreco}
                    onChange={e => setAddPreco(e.target.value)}
                    className="px-3 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-stone-400 min-h-[44px]"
                  />
                </div>
                <button
                  onClick={adicionarProduto}
                  className="flex items-center gap-2 px-4 py-2.5 border border-stone-200 text-stone-600 rounded-xl text-sm font-medium hover:bg-stone-50 min-h-[44px] transition-colors"
                >
                  <Plus size={15} />
                  Adicionar produto
                </button>
                {addErro && <p className="text-xs text-red-600">{addErro}</p>}
              </div>
            ) : (
              <p className="text-xs text-stone-400">Todos os produtos já foram adicionados.</p>
            )}
          </div>

          {/* Total calculado */}
          {totalCalculado > 0 && (
            <div className="bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-xs text-stone-500 font-medium uppercase tracking-wide">Total calculado</p>
                {totalServicos > 0 && totalProdutos > 0 && (
                  <p className="text-xs text-stone-400 mt-0.5">
                    Serviços {fmtBRL(totalServicos)} + Produtos {fmtBRL(totalProdutos)}
                  </p>
                )}
              </div>
              <span className="text-lg font-bold text-stone-800 tabular-nums">{fmtBRL(totalCalculado)}</span>
            </div>
          )}

          {/* Valor cobrado — editável, auto-preenchido pelo total */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm font-medium text-stone-700">Valor cobrado (R$)</span>
              {/* Botão para restaurar o valor calculado quando o usuário editou manualmente */}
              {valorDifereDoTotal && (
                <button
                  onClick={restaurarTotalCalculado}
                  className="flex items-center gap-1 text-xs text-stone-500 hover:text-stone-700 transition-colors"
                >
                  <RotateCcw size={11} />
                  Usar total calculado
                </button>
              )}
            </div>
            <input
              type="text"
              inputMode="decimal"
              placeholder="0,00"
              value={valorStr}
              onChange={e => { setValorStr(e.target.value); setValorManual(true) }}
              className="w-full px-3 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-stone-400 min-h-[44px]"
            />
          </div>

          {/* Pagamento */}
          <div>
            <span className="block text-sm font-medium text-stone-700 mb-2">Pagamento</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setPago(true)}
                className={`py-2.5 rounded-xl text-sm font-medium transition-all min-h-[44px] ${
                  pago
                    ? 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200'
                    : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
                }`}
              >
                Pago
              </button>
              <button
                onClick={() => setPago(false)}
                className={`py-2.5 rounded-xl text-sm font-medium transition-all min-h-[44px] ${
                  !pago
                    ? 'bg-amber-100 text-amber-700 ring-1 ring-amber-200'
                    : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
                }`}
              >
                Não pago
              </button>
            </div>
          </div>

          {/* Observações */}
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-stone-700">Observações</span>
            <textarea
              value={observacoes}
              onChange={e => setObservacoes(e.target.value)}
              rows={3}
              className="px-3 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-stone-400 resize-none"
            />
          </label>
        </div>

        {/* Rodapé */}
        <div className="px-6 py-4 border-t border-stone-100 flex items-center justify-between shrink-0">
          {confirmandoExclusao ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-red-600 font-medium">Excluir?</span>
              <button
                onClick={excluir}
                className="px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-medium min-h-[44px]"
              >
                Sim
              </button>
              <button
                onClick={() => setConfirmandoExclusao(false)}
                className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-xl text-sm min-h-[44px]"
              >
                Não
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmandoExclusao(true)}
              className="p-2.5 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <Trash2 size={18} />
            </button>
          )}

          <div className="flex gap-3">
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
              {salvando ? 'Salvando…' : 'Salvar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
