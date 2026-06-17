import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'

// Subquery reutilizável para calcular o saldo devedor de um cliente
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

// GET /api/clientes
//   Sem parâmetros  → lista completa com saldo (tela de clientes)
//   ?busca=texto    → filtro por nome, máx 20 (autocomplete da agenda)
export function GET(req: NextRequest) {
  const busca = req.nextUrl.searchParams.get('busca') ?? ''

  const clientes = db.prepare(`
    SELECT c.id, c.nome, c.celular, c.indicado_por, c.criado_em,
           (${SQL_SALDO}) AS saldo_devedor
    FROM clientes c
    WHERE c.nome LIKE '%' || ? || '%'
    ORDER BY c.nome
    ${busca ? 'LIMIT 20' : ''}
  `).all(busca)

  return NextResponse.json(clientes)
}

// POST /api/clientes — cria cliente
export async function POST(req: NextRequest) {
  const { nome, celular, indicado_por } = await req.json()

  if (!nome?.trim()) {
    return NextResponse.json({ erro: 'Nome obrigatório' }, { status: 400 })
  }

  db.prepare(`
    INSERT INTO clientes (nome, celular, indicado_por) VALUES (?, ?, ?)
  `).run(nome.trim(), celular?.trim() || null, indicado_por?.trim() || null)

  const criado = db.prepare(
    `SELECT id FROM clientes ORDER BY rowid DESC LIMIT 1`,
  ).get() as { id: string }

  return NextResponse.json({ id: criado.id }, { status: 201 })
}
