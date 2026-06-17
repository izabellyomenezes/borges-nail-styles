export interface Servico {
  id: string
  nome: string
  preco_base: number | null
}

export interface Cliente {
  id: string
  nome: string
  celular: string | null
}

export interface Agendamento {
  id: string
  cliente_id: string
  cliente_nome: string
  cliente_celular: string | null
  data: string        // YYYY-MM-DD
  horario: string     // HH:MM
  observacoes: string | null
  status: 'agendado' | 'concluído' | 'cancelado'
  valor_cobrado: number | null
  pago: boolean
  criado_em: string
  servicos: Servico[]
}

// ── Clientes ────────────────────────────────────────────────────────

export interface ClienteListItem {
  id: string
  nome: string
  celular: string | null
  indicado_por: string | null
  criado_em: string
  saldo_devedor: number
}

export interface AtendimentoHistorico {
  id: string
  data: string
  horario: string
  status: 'agendado' | 'concluído' | 'cancelado'
  valor_cobrado: number | null
  pago: boolean
  observacoes: string | null
  servicos: Servico[]
}

export interface PagamentoHistorico {
  id: string
  valor: number
  data: string
  observacoes: string | null
}

export interface ClientePerfil extends ClienteListItem {
  atendimentos: AtendimentoHistorico[]
  pagamentos: PagamentoHistorico[]
}

// ── Faturamento ─────────────────────────────────────────────────────

export interface MetricasFaturamento {
  total_faturado: number
  total_recebido: number
  total_a_receber: number
  total_gastos: number
  lucro_estimado: number
  servicos_ranking: Array<{ nome: string; quantidade: number }>
  devedores: Array<{ id: string; nome: string; celular: string | null; saldo_devedor: number }>
}

export interface GastoItem {
  id: string
  descricao: string
  valor: number
  data: string
  categoria: string | null
}

// ── Produtos / Estoque ──────────────────────────────────────────────

export interface ProdutoItem {
  id: string
  nome: string
  quantidade_atual: number
}

export interface MovimentacaoItem {
  id: string
  tipo: 'entrada' | 'saída'
  quantidade: number
  data: string
  observacao: string | null
}

export interface AgendamentoProdutoItem {
  produto_id: string
  nome: string
  quantidade: number
  preco_unitario: number
}
