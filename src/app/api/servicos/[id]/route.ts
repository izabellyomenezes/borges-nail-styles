import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'

// PUT /api/servicos/[id]
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { nome, preco_base } = await req.json()

  if (!nome?.trim()) {
    return NextResponse.json({ erro: 'Nome obrigatório' }, { status: 400 })
  }

  const result = db.prepare(
    `UPDATE servicos SET nome = ?, preco_base = ? WHERE id = ?`,
  ).run(
    nome.trim(),
    preco_base != null && preco_base !== '' ? Number(preco_base) : null,
    params.id,
  )

  if (result.changes === 0) {
    return NextResponse.json({ erro: 'Serviço não encontrado' }, { status: 404 })
  }

  return NextResponse.json({ ok: true })
}

// DELETE /api/servicos/[id] — bloqueado se vinculado a agendamentos
export function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const emUso = db.prepare(
    `SELECT 1 FROM agendamento_servicos WHERE servico_id = ? LIMIT 1`,
  ).get(params.id)

  if (emUso) {
    return NextResponse.json(
      { erro: 'Serviço está vinculado a agendamentos e não pode ser excluído.' },
      { status: 409 },
    )
  }

  db.prepare(`DELETE FROM servicos WHERE id = ?`).run(params.id)
  return NextResponse.json({ ok: true })
}
