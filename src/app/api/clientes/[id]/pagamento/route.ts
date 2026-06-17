import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'

interface AgRow {
  id: string
  valor_cobrado: number
}

// POST /api/clientes/[id]/pagamento — registra pagamento avulso e quita agendamentos
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { valor, data, observacoes } = await req.json()

  if (!valor || !data) {
    return NextResponse.json({ erro: 'Valor e data obrigatórios' }, { status: 400 })
  }

  const valorNum = Number(String(valor).replace(',', '.'))
  if (isNaN(valorNum) || valorNum <= 0) {
    return NextResponse.json({ erro: 'Valor inválido' }, { status: 400 })
  }

  const cliente = db.prepare(`SELECT id FROM clientes WHERE id = ?`).get(params.id)
  if (!cliente) {
    return NextResponse.json({ erro: 'Cliente não encontrado' }, { status: 404 })
  }

  // Agendamentos concluídos, não pagos, com valor definido — do mais antigo para o mais recente
  const agendamentosNaoPagos = db.prepare(`
    SELECT id, valor_cobrado
    FROM agendamentos
    WHERE cliente_id = ? AND pago = 0 AND status = 'concluído'
      AND valor_cobrado IS NOT NULL AND valor_cobrado > 0
    ORDER BY data ASC, horario ASC
  `).all(params.id) as AgRow[]

  db.transaction(() => {
    let restante = valorNum

    for (const ag of agendamentosNaoPagos) {
      if (restante <= 0) break

      if (restante >= ag.valor_cobrado) {
        // Pagamento cobre este agendamento inteiramente → quitar
        db.prepare(`UPDATE agendamentos SET pago = 1 WHERE id = ?`).run(ag.id)
        restante -= ag.valor_cobrado
      } else {
        // Pagamento cobre apenas parte deste agendamento → parar sem marcar pago
        break
      }
    }

    // Inserir em pagamentos apenas o restante não alocado a agendamentos específicos.
    // Isso evita dupla contagem na fórmula:
    //   saldo = sum(valor_cobrado WHERE pago=0) - sum(pagamentos)
    // Se todo o valor foi aplicado a agendamentos (restante=0), nada é inserido em pagamentos.
    if (restante > 0) {
      db.prepare(`
        INSERT INTO pagamentos (cliente_id, valor, data, observacoes) VALUES (?, ?, ?, ?)
      `).run(params.id, restante, data, observacoes?.trim() || null)
    }
  })()

  return NextResponse.json({ ok: true }, { status: 201 })
}
