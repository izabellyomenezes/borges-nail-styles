'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Pencil, Trash2, Plus, Phone, UserCheck } from 'lucide-react'
import type { ClientePerfil, ClienteListItem, AtendimentoHistorico } from '@/lib/types'
import ModalClienteForm from '../ModalClienteForm'
import ModalPagamento from '../ModalPagamento'

interface Props { id: string }

// ── Helpers ────────────────────────────────────────────────────────

const fmtBR = (iso: string) => {
  const [a, m, d] = iso.split('-')
  return `${d}/${m}/${a}`
}

const fmtBRL = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

function BadgeStatus({ ag }: { ag: AtendimentoHistorico }) {
  if (ag.status === 'cancelado')
    return <span className="px-2 py-0.5 rounded-full text-xs bg-stone-100 text-stone-500">Cancelado</span>
  if (ag.status === 'concluído' && ag.pago)
    return <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-100 text-emerald-700">Pago</span>
  if (ag.status === 'concluído' && !ag.pago)
    return <span className="px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-700 font-medium">Pendente</span>
  return <span className="px-2 py-0.5 rounded-full text-xs bg-sky-100 text-sky-700">Agendado</span>
}

// ── Componente principal ───────────────────────────────────────────

export default function ClientePerfilView({ id }: Props) {
  const router = useRouter()
  const [perfil, setPerfil] = useState<ClientePerfil | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [naoEncontrado, setNaoEncontrado] = useState(false)

  const [modalEditar, setModalEditar] = useState(false)
  const [modalPagamento, setModalPagamento] = useState(false)
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false)
  const [erroExclusao, setErroExclusao] = useState('')
  const [excluindo, setExcluindo] = useState(false)

  const buscarPerfil = useCallback(async () => {
    setCarregando(true)
    try {
      const res = await fetch(`/api/clientes/${id}`)
      if (res.status === 404) { setNaoEncontrado(true); return }
      setPerfil(await res.json())
    } finally {
      setCarregando(false)
    }
  }, [id])

  useEffect(() => { buscarPerfil() }, [buscarPerfil])

  const aoSalvarEdicao = () => {
    setModalEditar(false)
    buscarPerfil()
  }

  const aoSalvarPagamento = () => {
    setModalPagamento(false)
    buscarPerfil()
  }

  const excluir = async () => {
    setExcluindo(true)
    setErroExclusao('')
    try {
      const res = await fetch(`/api/clientes/${id}`, { method: 'DELETE' })
      if (res.status === 409) {
        const { erro } = await res.json()
        setErroExclusao(erro)
        setConfirmandoExclusao(false)
        return
      }
      router.push('/clientes')
    } finally {
      setExcluindo(false)
    }
  }

  // ── Estados de carregamento ─────────────────────────────────────

  if (carregando) {
    return (
      <div className="flex items-center justify-center h-64 text-stone-400 text-sm">
        Carregando…
      </div>
    )
  }

  if (naoEncontrado || !perfil) {
    return (
      <div className="text-center py-20 text-stone-500">
        <p>Cliente não encontrada.</p>
        <button onClick={() => router.push('/clientes')} className="mt-3 text-sm underline underline-offset-2">
          Voltar para a lista
        </button>
      </div>
    )
  }

  // ── Cálculos de resumo ──────────────────────────────────────────

  const saldo = perfil.saldo_devedor
  const totalAtendimentos = perfil.atendimentos.filter(a => a.status !== 'cancelado').length
  const totalRecebido = perfil.atendimentos
    .filter(a => a.status === 'concluído' && a.pago && a.valor_cobrado != null)
    .reduce((acc, a) => acc + (a.valor_cobrado ?? 0), 0)

  // Converte ClientePerfil para ClienteListItem para o modal de edição
  const clienteParaEditar: ClienteListItem = {
    id: perfil.id, nome: perfil.nome, celular: perfil.celular,
    indicado_por: perfil.indicado_por, criado_em: perfil.criado_em,
    saldo_devedor: perfil.saldo_devedor,
  }

  return (
    <div className="max-w-2xl flex flex-col gap-6">

      {/* Navegação de volta */}
      <button
        onClick={() => router.push('/clientes')}
        className="flex items-center gap-2 text-sm text-stone-500 hover:text-stone-800 -ml-1 w-fit min-h-[44px] px-1"
      >
        <ArrowLeft size={16} />
        Clientes
      </button>

      {/* Cabeçalho do perfil */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-stone-800">{perfil.nome}</h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-stone-500">
            {perfil.celular && (
              <span className="flex items-center gap-1.5">
                <Phone size={13} />
                {perfil.celular}
              </span>
            )}
            {perfil.indicado_por && (
              <span className="flex items-center gap-1.5">
                <UserCheck size={13} />
                Indicada por {perfil.indicado_por}
              </span>
            )}
          </div>
          <p className="text-xs text-stone-400 mt-1.5">
            Cliente desde {fmtBR(perfil.criado_em.split(' ')[0])}
          </p>
        </div>

        {/* Ações */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setModalEditar(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-stone-200 text-sm text-stone-600 hover:bg-stone-50 min-h-[44px]"
          >
            <Pencil size={14} />
            Editar
          </button>
          <button
            onClick={() => { setConfirmandoExclusao(true); setErroExclusao('') }}
            className="p-2.5 rounded-xl text-stone-400 hover:text-red-500 hover:bg-red-50 min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Confirmação de exclusão */}
      {confirmandoExclusao && (
        <div className="flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm">
          <span className="text-red-700 flex-1">Excluir esta cliente permanentemente?</span>
          <button onClick={excluir} disabled={excluindo} className="px-4 py-1.5 bg-red-600 text-white rounded-lg font-medium min-h-[36px]">
            {excluindo ? 'Excluindo…' : 'Excluir'}
          </button>
          <button onClick={() => setConfirmandoExclusao(false)} className="px-3 py-1.5 text-red-600 hover:bg-red-100 rounded-lg min-h-[36px]">
            Não
          </button>
        </div>
      )}

      {/* Erro de exclusão (cliente tem agendamentos) */}
      {erroExclusao && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          {erroExclusao}
        </p>
      )}

      {/* Card de saldo devedor */}
      <div className={`rounded-2xl border px-5 py-4 flex items-center justify-between gap-4 ${
        saldo > 0
          ? 'bg-amber-50 border-amber-200'
          : 'bg-emerald-50 border-emerald-200'
      }`}>
        <div>
          <p className={`text-xs font-semibold uppercase tracking-wide ${saldo > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
            {saldo > 0 ? 'Saldo devedor' : saldo < 0 ? 'Crédito' : 'Sem pendências'}
          </p>
          <p className={`text-2xl font-bold mt-0.5 tabular-nums ${saldo > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
            {saldo === 0 ? 'Em dia' : fmtBRL(Math.abs(saldo))}
          </p>
        </div>

        <button
          onClick={() => setModalPagamento(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-stone-800 text-white rounded-xl text-sm font-medium hover:bg-stone-700 min-h-[44px] shrink-0 transition-colors"
        >
          <Plus size={16} />
          Registrar pagamento
        </button>
      </div>

      {/* Resumo numérico */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Atendimentos', valor: totalAtendimentos, unidade: '' },
          { label: 'Total recebido', valor: fmtBRL(totalRecebido), unidade: '' },
          { label: 'Pagamentos avulsos', valor: perfil.pagamentos.length, unidade: '' },
        ].map(({ label, valor }) => (
          <div key={label} className="bg-stone-50 border border-stone-100 rounded-xl px-4 py-3">
            <p className="text-xs text-stone-400 font-medium">{label}</p>
            <p className="text-lg font-semibold text-stone-700 mt-0.5">{valor}</p>
          </div>
        ))}
      </div>

      {/* ── Histórico de atendimentos ─────────────────────────── */}
      <section>
        <h2 className="text-sm font-semibold text-stone-500 uppercase tracking-wide mb-3">
          Atendimentos ({perfil.atendimentos.length})
        </h2>

        {perfil.atendimentos.length === 0 ? (
          <p className="text-sm text-stone-400 py-4 text-center">Nenhum atendimento registrado.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {perfil.atendimentos.map(ag => (
              <div
                key={ag.id}
                className={`rounded-xl border px-4 py-4 ${
                  ag.status === 'concluído' && !ag.pago
                    ? 'border-amber-200 bg-amber-50/50'
                    : ag.status === 'cancelado'
                      ? 'border-stone-100 bg-stone-50/50'
                      : 'border-stone-100 bg-white'
                }`}
              >
                {/* Linha 1: data, horário, status */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-sm font-semibold text-stone-700">
                    {fmtBR(ag.data)} às {ag.horario}
                  </span>
                  <BadgeStatus ag={ag} />
                </div>

                {/* Serviços */}
                {ag.servicos.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {ag.servicos.map(s => (
                      <span key={s.id} className="text-xs px-2 py-0.5 bg-stone-100 text-stone-600 rounded-full">
                        {s.nome}
                      </span>
                    ))}
                  </div>
                )}

                {/* Valor e situação de pagamento */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-stone-500">
                    {ag.valor_cobrado != null
                      ? fmtBRL(ag.valor_cobrado)
                      : <span className="text-stone-300 text-xs">Valor não registrado</span>
                    }
                  </span>
                  {ag.status === 'concluído' && !ag.pago && ag.valor_cobrado != null && (
                    <span className="text-xs font-medium text-amber-600">
                      Pendente de pagamento
                    </span>
                  )}
                </div>

                {/* Observações */}
                {ag.observacoes && (
                  <p className="text-xs text-stone-400 mt-1.5 italic">"{ag.observacoes}"</p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Histórico de pagamentos avulsos ──────────────────── */}
      <section className="pb-8">
        <h2 className="text-sm font-semibold text-stone-500 uppercase tracking-wide mb-3">
          Pagamentos avulsos ({perfil.pagamentos.length})
        </h2>

        {perfil.pagamentos.length === 0 ? (
          <p className="text-sm text-stone-400 py-4 text-center">Nenhum pagamento avulso registrado.</p>
        ) : (
          <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden divide-y divide-stone-100">
            {perfil.pagamentos.map(p => (
              <div key={p.id} className="flex items-center justify-between px-5 py-3.5 gap-4">
                <div>
                  <p className="text-sm font-semibold text-emerald-700 tabular-nums">{fmtBRL(p.valor)}</p>
                  {p.observacoes && <p className="text-xs text-stone-400 mt-0.5 italic">"{p.observacoes}"</p>}
                </div>
                <span className="text-sm text-stone-500 shrink-0">{fmtBR(p.data)}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Modais */}
      {modalEditar && (
        <ModalClienteForm
          cliente={clienteParaEditar}
          onSalvar={aoSalvarEdicao}
          onFechar={() => setModalEditar(false)}
        />
      )}

      {modalPagamento && (
        <ModalPagamento
          clienteId={perfil.id}
          clienteNome={perfil.nome}
          onSalvar={aoSalvarPagamento}
          onFechar={() => setModalPagamento(false)}
        />
      )}
    </div>
  )
}
