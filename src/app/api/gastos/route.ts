import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'

// GET /api/gastos?inicio=2024-06-01&fim=2024-06-30
// Sem parâmetros: retorna todos os gastos
export function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const inicio = searchParams.get('inicio')
  const fim = searchParams.get('fim')

  const gastos = inicio && fim
    ? db.prepare(`
        SELECT id, descricao, valor, data, categoria
        FROM gastos
        WHERE data BETWEEN ? AND ?
        ORDER BY data DESC
      `).all(inicio, fim)
    : db.prepare(`
        SELECT id, descricao, valor, data, categoria
        FROM gastos
        ORDER BY data DESC
      `).all()

  return NextResponse.json(gastos)
}

// POST /api/gastos
export async function POST(req: NextRequest) {
  const { descricao, valor, data, categoria } = await req.json()

  if (!descricao?.trim() || !data) {
    return NextResponse.json({ erro: 'Descrição e data obrigatórios' }, { status: 400 })
  }

  const valorNum = Number(String(valor ?? '').replace(',', '.'))
  if (isNaN(valorNum) || valorNum <= 0) {
    return NextResponse.json({ erro: 'Valor inválido' }, { status: 400 })
  }

  db.prepare(`
    INSERT INTO gastos (descricao, valor, data, categoria) VALUES (?, ?, ?, ?)
  `).run(descricao.trim(), valorNum, data, categoria?.trim() || null)

  return NextResponse.json({ ok: true }, { status: 201 })
}
