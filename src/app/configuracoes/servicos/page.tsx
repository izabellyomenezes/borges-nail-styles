'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import type { Servico } from '@/lib/types'
import ModalServico from './ModalServico'

const fmtBRL = (v: number | null) =>
  v != null
    ? v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    : '—'

export default function ServicosPage() {
  const [servicos, setServicos] = useState<Servico[]>([])
  const [carregando, setCarregando] = useState(true)
  const [modal, setModal] = useState<{ aberto: boolean; servico: Servico | null }>({
    aberto: false, servico: null,
  })
  const [excluindo, setExcluindo] = useState<string | null>(null)
  // Erro de exclusão por id (quando serviço está em uso)
  const [erroExclusao, setErroExclusao] = useState<{ id: string; msg: string } | null>(null)

  const buscar = useCallback(async () => {
    setCarregando(true)
    try {
      const res = await fetch('/api/servicos')
      setServicos(await res.json())
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => { buscar() }, [buscar])

  const aoSalvar = () => {
    setModal({ aberto: false, servico: null })
    buscar()
  }

  const excluir = async (id: string) => {
    setExcluindo(id)
    setErroExclusao(null)
    try {
      const res = await fetch(`/api/servicos/${id}`, { method: 'DELETE' })
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

  const abrirEditar = (s: Servico) => {
    setErroExclusao(null)
    setModal({ aberto: true, servico: s })
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl">

      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-stone-800">Serviços</h1>
          <p className="text-sm text-stone-500 mt-0.5">
            {servicos.length > 0
              ? `${servicos.length} ${servicos.length === 1 ? 'serviço cadastrado' : 'serviços cadastrados'}`
              : 'Gerencie os serviços disponíveis para agendamento'}
          </p>
        </div>
        <button
          onClick={() => setModal({ aberto: true, servico: null })}
          className="flex items-center gap-2 px-5 py-2.5 bg-stone-800 text-white rounded-xl text-sm font-medium hover:bg-stone-700 min-h-[44px] transition-colors"
        >
          <Plus size={18} />
          Novo serviço
        </button>
      </div>

      {/* Lista */}
      {carregando ? (
        <p className="text-sm text-stone-400 py-8 text-center">Carregando…</p>
      ) : servicos.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-stone-200 rounded-2xl text-stone-400">
          <p className="text-sm">Nenhum serviço cadastrado.</p>
          <button
            onClick={() => setModal({ aberto: true, servico: null })}
            className="mt-3 text-sm text-stone-600 underline underline-offset-2"
          >
            Cadastrar primeiro serviço
          </button>
        </div>
      ) : (
        <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden">
          {/* Cabeçalho da tabela */}
          <div className="grid grid-cols-[1fr_auto_auto] items-center px-5 py-2.5 bg-stone-50 border-b border-stone-100">
            <span className="text-xs font-semibold text-stone-400 uppercase tracking-wide">Nome</span>
            <span className="text-xs font-semibold text-stone-400 uppercase tracking-wide w-32 text-right">Preço base</span>
            <span className="w-24" />
          </div>

          <div className="divide-y divide-stone-100">
            {servicos.map(s => (
              <div key={s.id}>
                <div className="grid grid-cols-[1fr_auto_auto] items-center px-5 py-4 gap-4 min-h-[60px]">
                  <span className="text-sm font-medium text-stone-800">{s.nome}</span>
                  <span className="text-sm text-stone-600 tabular-nums w-32 text-right">
                    {fmtBRL(s.preco_base)}
                  </span>
                  <div className="flex items-center gap-1 w-24 justify-end">
                    <button
                      onClick={() => abrirEditar(s)}
                      className="p-2.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                      title="Editar"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => excluir(s.id)}
                      disabled={excluindo === s.id}
                      className="p-2.5 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center disabled:opacity-40"
                      title="Excluir"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {/* Erro de exclusão exibido inline, logo abaixo da linha */}
                {erroExclusao?.id === s.id && (
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

      {modal.aberto && (
        <ModalServico
          servico={modal.servico}
          onSalvar={aoSalvar}
          onFechar={() => setModal({ aberto: false, servico: null })}
        />
      )}
    </div>
  )
}
