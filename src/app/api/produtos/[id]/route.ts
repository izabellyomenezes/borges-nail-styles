import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'

// PUT /api/produtos/[id] — edita apenas o nome; quantidade só muda via movimentação
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { nome } = await req.json()

  if (!nome?.trim()) {
    return NextResponse.json({ erro: 'Nome obrigatório' }, { status: 400 })
  }

  const result = db.prepare(
    `UPDATE produtos SET nome = ? WHERE id = ?`,
  ).run(nome.trim(), params.id)

  if (result.changes === 0) {
    return NextResponse.json({ erro: 'Produto não encontrado' }, { status: 404 })
  }

  return NextResponse.json({ ok: true })
}

// DELETE /api/produtos/[id] — exclui produto e seu histórico de movimentações
export function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  db.transaction(() => {
    db.prepare(`DELETE FROM movimentacoes_estoque WHERE produto_id = ?`).run(params.id)
    db.prepare(`DELETE FROM produtos WHERE id = ?`).run(params.id)
  })()

  return NextResponse.json({ ok: true })
}
