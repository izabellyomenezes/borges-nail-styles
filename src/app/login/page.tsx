'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)
  const router = useRouter()

  const entrar = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro('')
    setCarregando(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senha }),
      })
      if (res.ok) {
        router.replace('/')
      } else {
        setErro('Senha incorreta.')
        setSenha('')
      }
    } catch {
      setErro('Erro ao conectar. Tente novamente.')
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-white z-50 flex items-center justify-center p-6">
      <div className="w-full max-w-xs">
        <div className="mb-8 text-center">
          <h1 className="text-xl font-semibold text-stone-800">Borges Nail Styles</h1>
          <p className="text-sm text-stone-500 mt-1">Digite a senha para acessar</p>
        </div>
        <form onSubmit={entrar} className="space-y-3">
          <input
            type="password"
            placeholder="Senha"
            value={senha}
            onChange={e => setSenha(e.target.value)}
            autoFocus
            autoComplete="current-password"
            className="w-full px-4 py-3 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-stone-400 min-h-[48px]"
          />
          {erro && <p className="text-sm text-red-600">{erro}</p>}
          <button
            type="submit"
            disabled={carregando || !senha}
            className="w-full py-3 bg-stone-800 text-white rounded-xl text-sm font-medium hover:bg-stone-700 disabled:opacity-40 transition-colors min-h-[48px]"
          >
            {carregando ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
