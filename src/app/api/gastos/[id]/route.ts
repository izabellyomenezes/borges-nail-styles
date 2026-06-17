import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'

// PUT /api/gastos/[id]
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { descricao, valor, data, categoria } = await req.json()

  if (!descricao?.trim() || !data) {
    return NextResponse.json({ erro: 'Descrição e data obrigatórios' }, { status: 400 })
  }

  const valorNum = Number(String(valor ?? '').replace(',', '.'))
  if (isNaN(valorNum) || valorNum <= 0) {
    return NextResponse.json({ erro: 'Valor inválido' }, { status: 400 })
  }

  const result = db.prepare(`
    UPDATE gastos SET descricao = ?, valor = ?, data = ?, categoria = ? WHERE id = ?
  `).run(descricao.trim(), valorNum, data, categoria?.trim() || null, params.id)

  if (result.changes === 0) {
    return NextResponse.json({ erro: 'Gasto não encontrado' }, { status: 404 })
  }

  return NextResponse.json({ ok: true })
}

// DELETE /api/gastos/[id]
export function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const result = db.prepare(`DELETE FROM gastos WHERE id = ?`).run(params.id)

  if (result.changes === 0) {
    return NextResponse.json({ erro: 'Gasto não encontrado' }, { status: 404 })
  }

  return NextResponse.json({ ok: true })
}
