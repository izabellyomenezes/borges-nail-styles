import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'

export async function POST(req: NextRequest) {
  const { senha } = await req.json()

  if (!senha || senha !== process.env.AUTH_PASSWORD) {
    return NextResponse.json({ erro: 'Senha incorreta' }, { status: 401 })
  }

  const token = createHash('sha256')
    .update(senha + ':' + process.env.SESSION_SECRET)
    .digest('hex')

  const res = NextResponse.json({ ok: true })
  res.cookies.set('auth_token', token, {
    httpOnly: true,
    secure: false,
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 30, // 30 dias
    path: '/',
  })

  return res
}
