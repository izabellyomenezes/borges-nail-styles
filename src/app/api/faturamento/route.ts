import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'

// GET /api/faturamento?inicio=2024-06-01&fim=2024-06-30
// Retorna todas as métricas do período em uma única chamada
export function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const inicio = searchParams.get('inicio')
  const fim = searchParams.get('fim')

  if (!inicio || !fim) {
    return NextResponse.json({ erro: 'Parâmetros inicio e fim obrigatórios' }, { status: 400 })
  }

  // Soma dos valores cobrados em agendamentos concluídos do período
  const { total_faturado } = db.prepare(`
    SELECT COALESCE(SUM(valor_cobrado), 0) AS total_faturado
    FROM agendamentos
    WHERE status = 'concluído' AND data BETWEEN ? AND ?
  `).get(inicio, fim) as { total_faturado: number }

  // Agendamentos concluídos e efetivamente pagos
  const { total_recebido } = db.prepare(`
    SELECT COALESCE(SUM(valor_cobrado), 0) AS total_recebido
    FROM agendamentos
    WHERE status = 'concluído' AND pago = 1 AND data BETWEEN ? AND ?
  `).get(inicio, fim) as { total_recebido: number }

  // Agendamentos concluídos mas ainda não pagos
  const { total_a_receber } = db.prepare(`
    SELECT COALESCE(SUM(valor_cobrado), 0) AS total_a_receber
    FROM agendamentos
    WHERE status = 'concluído' AND pago = 0 AND data BETWEEN ? AND ?
  `).get(inicio, fim) as { total_a_receber: number }

  // Total de gastos registrados no período
  const { total_gastos } = db.prepare(`
    SELECT COALESCE(SUM(valor), 0) AS total_gastos
    FROM gastos
    WHERE data BETWEEN ? AND ?
  `).get(inicio, fim) as { total_gastos: number }

  // Lucro estimado = recebido − gastos
  const lucro_estimado = total_recebido - total_gastos

  // Ranking dos serviços mais realizados (agendamentos concluídos no período)
  const servicos_ranking = db.prepare(`
    SELECT s.nome, COUNT(*) AS quantidade
    FROM agendamento_servicos ags
    JOIN agendamentos a ON a.id = ags.agendamento_id
    JOIN servicos s ON s.id = ags.servico_id
    WHERE a.status = 'concluído' AND a.data BETWEEN ? AND ?
    GROUP BY s.id, s.nome
    ORDER BY quantidade DESC
    LIMIT 10
  `).all(inicio, fim)

  // Clientes com saldo devedor — visão global, não filtrada por período
  const devedores = db.prepare(`
    SELECT id, nome, celular, saldo_devedor FROM (
      SELECT c.id, c.nome, c.celular,
        (
          COALESCE((
            SELECT SUM(valor_cobrado) FROM agendamentos
            WHERE cliente_id = c.id AND pago = 0 AND status = 'concluído'
          ), 0)
          - COALESCE((
            SELECT SUM(valor) FROM pagamentos WHERE cliente_id = c.id
          ), 0)
        ) AS saldo_devedor
      FROM clientes c
    ) WHERE saldo_devedor > 0
    ORDER BY saldo_devedor DESC
  `).all()

  return NextResponse.json({
    total_faturado,
    total_recebido,
    total_a_receber,
    total_gastos,
    lucro_estimado,
    servicos_ranking,
    devedores,
  })
}
