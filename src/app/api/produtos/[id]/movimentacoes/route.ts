import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'

// GET /api/produtos/[id]/movimentacoes — histórico de movimentações do produto
export function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const movimentacoes = db.prepare(`
    SELECT id, tipo, quantidade, data, observacao
    FROM movimentacoes_estoque
    WHERE produto_id = ?
    ORDER BY data DESC, rowid DESC
  `).all(params.id)

  return NextResponse.json(movimentacoes)
}
