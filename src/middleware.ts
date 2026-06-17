import { NextRequest, NextResponse } from 'next/server'

async function hashToken(password: string, secret: string): Promise<string> {
  const enc = new TextEncoder()
  const buf = await crypto.subtle.digest('SHA-256', enc.encode(password + ':' + secret))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (pathname === '/login' || pathname.startsWith('/api/auth/')) {
    return NextResponse.next()
  }

  const password = process.env.AUTH_PASSWORD
  const secret = process.env.SESSION_SECRET

  if (!password || !secret) {
    return NextResponse.next()
  }

  const expected = await hashToken(password, secret)
  const token = req.cookies.get('auth_token')?.value

  if (token !== expected) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
