import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'

// POST /api/produtos/[id]/movimentacao — registra entrada ou saída de estoque
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { tipo, quantidade, data, observacao } = await req.json()

  if (!tipo || !data) {
    return NextResponse.json({ erro: 'Tipo e data obrigatórios' }, { status: 400 })
  }

  if (tipo !== 'entrada' && tipo !== 'saída') {
    return NextResponse.json({ erro: 'Tipo deve ser "entrada" ou "saída"' }, { status: 400 })
  }

  const qtd = Number(String(quantidade ?? '').replace(',', '.'))
  if (isNaN(qtd) || qtd <= 0) {
    return NextResponse.json({ erro: 'Quantidade inválida' }, { status: 400 })
  }

  const produto = db.prepare(`SELECT id FROM produtos WHERE id = ?`).get(params.id)
  if (!produto) {
    return NextResponse.json({ erro: 'Produto não encontrado' }, { status: 404 })
  }

  // Para saída, o delta é negativo; para entrada, positivo
  const delta = tipo === 'entrada' ? qtd : -qtd

  db.transaction(() => {
    db.prepare(`
      INSERT INTO movimentacoes_estoque (produto_id, tipo, quantidade, data, observacao)
      VALUES (?, ?, ?, ?, ?)
    `).run(params.id, tipo, qtd, data, observacao?.trim() || null)

    db.prepare(
      `UPDATE produtos SET quantidade_atual = quantidade_atual + ? WHERE id = ?`,
    ).run(delta, params.id)
  })()

  const atualizado = db.prepare(
    `SELECT quantidade_atual FROM produtos WHERE id = ?`,
  ).get(params.id) as { quantidade_atual: number }

  return NextResponse.json({ ok: true, quantidade_atual: atualizado.quantidade_atual }, { status: 201 })
}
