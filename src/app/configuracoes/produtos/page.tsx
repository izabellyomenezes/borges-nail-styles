'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Pencil, Trash2, ArrowDownUp, History } from 'lucide-react'
import type { ProdutoItem } from '@/lib/types'
import ModalProduto from './ModalProduto'
import ModalMovimentacao from './ModalMovimentacao'
import ModalHistorico from './ModalHistorico'

type ModalEstado =
  | { tipo: 'nenhum' }
  | { tipo: 'criar' }
  | { tipo: 'editar'; produto: ProdutoItem }
  | { tipo: 'movimentacao'; produto: ProdutoItem }
  | { tipo: 'historico'; produto: ProdutoItem }

const fmtQtd = (v: number) =>
  v % 1 === 0 ? String(Math.round(v)) : v.toFixed(2).replace('.', ',')

export default function ProdutosPage() {
  const [produtos, setProdutos] = useState<ProdutoItem[]>([])
  const [carregando, setCarregando] = useState(true)
  const [modal, setModal] = useState<ModalEstado>({ tipo: 'nenhum' })
  const [excluindo, setExcluindo] = useState<string | null>(null)
  const [erroExclusao, setErroExclusao] = useState<{ id: string; msg: string } | null>(null)

  const buscar = useCallback(async () => {
    setCarregando(true)
    try {
      const res = await fetch('/api/produtos')
      setProdutos(await res.json())
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => { buscar() }, [buscar])

  const fechar = () => setModal({ tipo: 'nenhum' })

  const aoSalvarProduto = () => {
    fechar()
    buscar()
  }

  // Atualiza quantidade localmente após movimentação para UI responsiva
  const aoRegistrarMovimentacao = (id: string, novaQtd: number) => {
    setProdutos(prev =>
      prev.map(p => p.id === id ? { ...p, quantidade_atual: novaQtd } : p)
    )
    fechar()
  }

  const excluir = async (id: string) => {
    setExcluindo(id)
    setErroExclusao(null)
    try {
      const res = await fetch(`/api/produtos/${id}`, { method: 'DELETE' })
      if (res.status === 409) {
        const { erro } = await res.json()
        setErroExclusao({ id, msg: erro })
        return
      }
      buscar()
    } finally {
      setExcluindo(null)
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl">

      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-stone-800">Produtos</h1>
          <p className="text-sm text-stone-500 mt-0.5">
            {produtos.length > 0
              ? `${produtos.length} ${produtos.length === 1 ? 'produto cadastrado' : 'produtos cadastrados'}`
              : 'Controle o estoque de produtos do salão'}
          </p>
        </div>
        <button
          onClick={() => setModal({ tipo: 'criar' })}
          className="flex items-center gap-2 px-5 py-2.5 bg-stone-800 text-white rounded-xl text-sm font-medium hover:bg-stone-700 min-h-[44px] transition-colors"
        >
          <Plus size={18} />
          Novo produto
        </button>
      </div>

      {/* Lista */}
      {carregando ? (
        <p className="text-sm text-stone-400 py-8 text-center">Carregando…</p>
      ) : produtos.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-stone-200 rounded-2xl text-stone-400">
          <p className="text-sm">Nenhum produto cadastrado.</p>
          <button
            onClick={() => setModal({ tipo: 'criar' })}
            className="mt-3 text-sm text-stone-600 underline underline-offset-2"
          >
            Cadastrar primeiro produto
          </button>
        </div>
      ) : (
        <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden">
          {/* Cabeçalho da tabela */}
          <div className="grid grid-cols-[1fr_auto_auto] items-center px-5 py-2.5 bg-stone-50 border-b border-stone-100">
            <span className="text-xs font-semibold text-stone-400 uppercase tracking-wide">Produto</span>
            <span className="text-xs font-semibold text-stone-400 uppercase tracking-wide w-20 text-right">Estoque</span>
            <span className="w-44" />
          </div>

          <div className="divide-y divide-stone-100">
            {produtos.map(p => (
              <div key={p.id}>
                <div className="grid grid-cols-[1fr_auto_auto] items-center px-5 py-4 gap-4 min-h-[64px]">
                  <span className="text-sm font-medium text-stone-800 truncate">{p.nome}</span>

                  {/* Badge de estoque com cor semântica */}
                  <div className="w-20 flex justify-end">
                    <span className={`text-sm font-semibold tabular-nums px-2.5 py-1 rounded-lg ${
                      p.quantidade_atual < 0
                        ? 'bg-red-50 text-red-600'
                        : p.quantidade_atual === 0
                          ? 'bg-stone-100 text-stone-500'
                          : 'bg-emerald-50 text-emerald-700'
                    }`}>
                      {fmtQtd(p.quantidade_atual)}
                    </span>
                  </div>

                  {/* Quatro ações: movimentação, histórico, editar, excluir */}
                  <div className="flex items-center gap-1 w-44 justify-end">
                    <button
                      onClick={() => { setErroExclusao(null); setModal({ tipo: 'movimentacao', produto: p }) }}
                      className="p-2.5 text-stone-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                      title="Registrar movimentação"
                    >
                      <ArrowDownUp size={15} />
                    </button>
                    <button
                      onClick={() => { setErroExclusao(null); setModal({ tipo: 'historico', produto: p }) }}
                      className="p-2.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                      title="Histórico de movimentações"
                    >
                      <History size={15} />
                    </button>
                    <button
                      onClick={() => { setErroExclusao(null); setModal({ tipo: 'editar', produto: p }) }}
                      className="p-2.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                      title="Editar produto"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => excluir(p.id)}
                      disabled={excluindo === p.id}
                      className="p-2.5 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center disabled:opacity-40"
                      title="Excluir produto"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {/* Erro de exclusão exibido inline */}
                {erroExclusao?.id === p.id && (
                  <div className="px-5 pb-3 -mt-2">
                    <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                      {erroExclusao.msg}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modais */}
      {modal.tipo === 'criar' && (
        <ModalProduto produto={null} onSalvar={aoSalvarProduto} onFechar={fechar} />
      )}
      {modal.tipo === 'editar' && (
        <ModalProduto produto={modal.produto} onSalvar={aoSalvarProduto} onFechar={fechar} />
      )}
      {modal.tipo === 'movimentacao' && (
        <ModalMovimentacao
          produto={modal.produto}
          onSalvar={(novaQtd) => aoRegistrarMovimentacao(modal.produto.id, novaQtd)}
          onFechar={fechar}
        />
      )}
      {modal.tipo === 'historico' && (
        <ModalHistorico produto={modal.produto} onFechar={fechar} />
      )}
    </div>
  )
}
