import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'

// GET /api/produtos
export function GET() {
  const produtos = db.prepare(
    `SELECT id, nome, quantidade_atual FROM produtos ORDER BY nome`,
  ).all()
  return NextResponse.json(produtos)
}

// POST /api/produtos — cria produto com quantidade inicial opcional
export async function POST(req: NextRequest) {
  const { nome, quantidade_inicial } = await req.json()

  if (!nome?.trim()) {
    return NextResponse.json({ erro: 'Nome obrigatório' }, { status: 400 })
  }

  const qtd = quantidade_inicial != null && quantidade_inicial !== ''
    ? Number(String(quantidade_inicial).replace(',', '.'))
    : 0

  db.prepare(
    `INSERT INTO produtos (nome, quantidade_atual) VALUES (?, ?)`,
  ).run(nome.trim(), isNaN(qtd) ? 0 : qtd)

  const criado = db.prepare(
    `SELECT id FROM produtos ORDER BY rowid DESC LIMIT 1`,
  ).get() as { id: string }

  return NextResponse.json({ id: criado.id }, { status: 201 })
}
