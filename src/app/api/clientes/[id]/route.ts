import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'

interface AgRow {
  id: string; data: string; horario: string; status: string
  valor_cobrado: number | null; pago: number; observacoes: string | null
}

const SQL_SALDO = `
  COALESCE((
    SELECT SUM(valor_cobrado) FROM agendamentos
    WHERE cliente_id = c.id AND pago = 0 AND status = 'concluído'
  ), 0)
  -
  COALESCE((
    SELECT SUM(valor) FROM pagamentos
    WHERE cliente_id = c.id
  ), 0)
`

// GET /api/clientes/[id] — perfil completo com histórico de atendimentos e pagamentos
export function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const cliente = db.prepare(`
    SELECT c.id, c.nome, c.celular, c.indicado_por, c.criado_em,
           (${SQL_SALDO}) AS saldo_devedor
    FROM clientes c
    WHERE c.id = ?
  `).get(params.id)

  if (!cliente) {
    return NextResponse.json({ erro: 'Cliente não encontrado' }, { status: 404 })
  }

  // Agendamentos mais recentes primeiro
  const agRows = db.prepare(`
    SELECT id, data, horario, status, valor_cobrado, pago, observacoes
    FROM agendamentos
    WHERE cliente_id = ?
    ORDER BY data DESC, horario DESC
  `).all(params.id) as AgRow[]

  // Serviços de cada atendimento (N+1 aceitável dado o volume de um salão)
  const buscarServicos = db.prepare(`
    SELECT s.id, s.nome, s.preco_base
    FROM servicos s
    JOIN agendamento_servicos ags ON ags.servico_id = s.id
    WHERE ags.agendamento_id = ?
  `)

  const atendimentos = agRows.map(ag => ({
    ...ag,
    pago: ag.pago === 1,
    servicos: buscarServicos.all(ag.id),
  }))

  // Pagamentos avulsos mais recentes primeiro
  const pagamentos = db.prepare(`
    SELECT id, valor, data, observacoes
    FROM pagamentos
    WHERE cliente_id = ?
    ORDER BY data DESC
  `).all(params.id)

  return NextResponse.json({ ...cliente, atendimentos, pagamentos })
}

// PUT /api/clientes/[id] — edita dados cadastrais
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { nome, celular, indicado_por } = await req.json()

  if (!nome?.trim()) {
    return NextResponse.json({ erro: 'Nome obrigatório' }, { status: 400 })
  }

  const result = db.prepare(`
    UPDATE clientes SET nome = ?, celular = ?, indicado_por = ? WHERE id = ?
  `).run(nome.trim(), celular?.trim() || null, indicado_por?.trim() || null, params.id)

  if (result.changes === 0) {
    return NextResponse.json({ erro: 'Cliente não encontrado' }, { status: 404 })
  }

  return NextResponse.json({ ok: true })
}

// DELETE /api/clientes/[id] — bloqueado se houver agendamentos vinculados
export function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const temAgendamento = db.prepare(
    `SELECT 1 FROM agendamentos WHERE cliente_id = ? LIMIT 1`,
  ).get(params.id)

  if (temAgendamento) {
    return NextResponse.json(
      { erro: 'Cliente possui agendamentos vinculados e não pode ser excluído.' },
      { status: 409 },
    )
  }

  db.transaction(() => {
    db.prepare(`DELETE FROM pagamentos WHERE cliente_id = ?`).run(params.id)
    db.prepare(`DELETE FROM clientes WHERE id = ?`).run(params.id)
  })()

  return NextResponse.json({ ok: true })
}
