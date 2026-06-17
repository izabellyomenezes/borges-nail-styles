import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import type { AgendamentoProdutoItem } from '@/lib/types'

// GET /api/agendamentos/[id]
// Retorna produtos vendidos neste agendamento (serviços já vêm no payload da listagem)
export function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const produtos = db.prepare(`
    SELECT ap.produto_id, p.nome, ap.quantidade, ap.preco_unitario
    FROM agendamento_produtos ap
    JOIN produtos p ON p.id = ap.produto_id
    WHERE ap.agendamento_id = ?
    ORDER BY ap.rowid
  `).all(params.id) as AgendamentoProdutoItem[]

  return NextResponse.json({ produtos })
}

// PUT /api/agendamentos/[id]
// Aceita: status, valor_cobrado, pago, observacoes, servicos (string[]), produtos (AgendamentoProdutoItem[])
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { status, valor_cobrado, pago, observacoes, servicos, produtos } = await req.json()

  const atualizar = db.transaction(() => {
    // Atualiza campos principais do agendamento
    const result = db.prepare(`
      UPDATE agendamentos
      SET status = ?, valor_cobrado = ?, pago = ?, observacoes = ?
      WHERE id = ?
    `).run(
      status,
      valor_cobrado != null ? Number(valor_cobrado) : null,
      pago ? 1 : 0,
      observacoes ?? null,
      params.id,
    )

    if (result.changes === 0) return false

    // Atualiza serviços vinculados (substitui a lista completa)
    if (Array.isArray(servicos)) {
      db.prepare(`DELETE FROM agendamento_servicos WHERE agendamento_id = ?`).run(params.id)
      for (const servicoId of servicos as string[]) {
        db.prepare(`
          INSERT INTO agendamento_servicos (agendamento_id, servico_id) VALUES (?, ?)
        `).run(params.id, servicoId)
      }
    }

    // Atualiza produtos vendidos (substitui a lista completa)
    if (Array.isArray(produtos)) {
      db.prepare(`DELETE FROM agendamento_produtos WHERE agendamento_id = ?`).run(params.id)
      for (const p of produtos as AgendamentoProdutoItem[]) {
        db.prepare(`
          INSERT INTO agendamento_produtos (agendamento_id, produto_id, quantidade, preco_unitario)
          VALUES (?, ?, ?, ?)
        `).run(params.id, p.produto_id, p.quantidade, p.preco_unitario)
      }
    }

    return true
  })

  const ok = atualizar()
  if (!ok) {
    return NextResponse.json({ erro: 'Agendamento não encontrado' }, { status: 404 })
  }

  return NextResponse.json({ ok: true })
}

// DELETE /api/agendamentos/[id]
export function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  db.transaction(() => {
    db.prepare(`DELETE FROM agendamento_servicos WHERE agendamento_id = ?`).run(params.id)
    db.prepare(`DELETE FROM agendamento_produtos WHERE agendamento_id = ?`).run(params.id)
    db.prepare(`DELETE FROM agendamentos WHERE id = ?`).run(params.id)
  })()

  return NextResponse.json({ ok: true })
}
