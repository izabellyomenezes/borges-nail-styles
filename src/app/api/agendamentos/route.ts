import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'

interface AgRow {
  id: string
  cliente_id: string
  cliente_nome: string
  cliente_celular: string | null
  data: string
  horario: string
  observacoes: string | null
  status: string
  valor_cobrado: number | null
  pago: number
  criado_em: string
}

interface ServicoRow {
  id: string
  nome: string
  preco_base: number | null
}

// GET /api/agendamentos?mes=2024-06  ou  ?data=2024-06-10
export function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const mes = searchParams.get('mes')
  const data = searchParams.get('data')

  if (!mes && !data) {
    return NextResponse.json({ erro: 'Parâmetro mes ou data obrigatório' }, { status: 400 })
  }

  const rows: AgRow[] = mes
    ? (db.prepare(`
        SELECT a.id, a.cliente_id, c.nome AS cliente_nome, c.celular AS cliente_celular,
               a.data, a.horario, a.observacoes, a.status,
               a.valor_cobrado, a.pago, a.criado_em
        FROM agendamentos a
        LEFT JOIN clientes c ON c.id = a.cliente_id
        WHERE strftime('%Y-%m', a.data) = ?
        ORDER BY a.data, a.horario
      `).all(mes) as AgRow[])
    : (db.prepare(`
        SELECT a.id, a.cliente_id, c.nome AS cliente_nome, c.celular AS cliente_celular,
               a.data, a.horario, a.observacoes, a.status,
               a.valor_cobrado, a.pago, a.criado_em
        FROM agendamentos a
        LEFT JOIN clientes c ON c.id = a.cliente_id
        WHERE a.data = ?
        ORDER BY a.horario
      `).all(data) as AgRow[])

  const buscarServicos = db.prepare(`
    SELECT s.id, s.nome, s.preco_base
    FROM servicos s
    JOIN agendamento_servicos ags ON ags.servico_id = s.id
    WHERE ags.agendamento_id = ?
  `)

  const resultado = rows.map(ag => ({
    ...ag,
    pago: ag.pago === 1,
    servicos: buscarServicos.all(ag.id) as ServicoRow[],
  }))

  return NextResponse.json(resultado)
}

// POST /api/agendamentos
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { cliente_id, cliente_nome, cliente_celular, data, horario, observacoes, servico_ids } = body

  if (!data || !horario) {
    return NextResponse.json({ erro: 'Data e horário obrigatórios' }, { status: 400 })
  }

  // Cria cliente inline se não houver ID
  let clienteId: string = cliente_id
  if (!clienteId && cliente_nome?.trim()) {
    db.prepare(`INSERT INTO clientes (nome, celular) VALUES (?, ?)`).run(
      cliente_nome.trim(),
      cliente_celular ?? null,
    )
    const criado = db.prepare(
      `SELECT id FROM clientes ORDER BY rowid DESC LIMIT 1`,
    ).get() as { id: string }
    clienteId = criado.id
  }

  if (!clienteId) {
    return NextResponse.json({ erro: 'Cliente obrigatório' }, { status: 400 })
  }

  // Insere agendamento e serviços numa transação
  const inserir = db.transaction(() => {
    db.prepare(`
      INSERT INTO agendamentos (cliente_id, data, horario, observacoes)
      VALUES (?, ?, ?, ?)
    `).run(clienteId, data, horario, observacoes ?? null)

    const ag = db.prepare(
      `SELECT id FROM agendamentos ORDER BY rowid DESC LIMIT 1`,
    ).get() as { id: string }

    if (Array.isArray(servico_ids) && servico_ids.length) {
      const vincular = db.prepare(
        `INSERT INTO agendamento_servicos (agendamento_id, servico_id) VALUES (?, ?)`,
      )
      for (const sid of servico_ids) {
        vincular.run(ag.id, sid)
      }
    }

    return ag.id
  })

  const id = inserir()
  return NextResponse.json({ id }, { status: 201 })
}
