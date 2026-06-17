import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'

// GET /api/servicos
export function GET() {
  const servicos = db.prepare(
    `SELECT id, nome, preco_base FROM servicos ORDER BY nome`,
  ).all()
  return NextResponse.json(servicos)
}

// POST /api/servicos — cria serviço
export async function POST(req: NextRequest) {
  const { nome, preco_base } = await req.json()

  if (!nome?.trim()) {
    return NextResponse.json({ erro: 'Nome obrigatório' }, { status: 400 })
  }

  db.prepare(`INSERT INTO servicos (nome, preco_base) VALUES (?, ?)`).run(
    nome.trim(),
    preco_base != null && preco_base !== '' ? Number(preco_base) : null,
  )

  const criado = db.prepare(
    `SELECT id FROM servicos ORDER BY rowid DESC LIMIT 1`,
  ).get() as { id: string }

  return NextResponse.json({ id: criado.id }, { status: 201 })
}
