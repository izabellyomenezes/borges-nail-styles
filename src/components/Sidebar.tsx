'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Calendar,
  Users,
  TrendingUp,
  Settings,
  Scissors,
  Package,
  Receipt,
  ChevronDown,
  ChevronRight,
  LogOut,
} from 'lucide-react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const navPrincipal = [
  { href: '/agenda', label: 'Agenda', icon: Calendar },
  { href: '/clientes', label: 'Clientes', icon: Users },
  { href: '/faturamento', label: 'Faturamento', icon: TrendingUp },
]

const navConfiguracoes = [
  { href: '/configuracoes/servicos', label: 'Serviços', icon: Scissors },
  { href: '/configuracoes/produtos', label: 'Produtos', icon: Package },
  { href: '/configuracoes/gastos', label: 'Gastos', icon: Receipt },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [configAberto, setConfigAberto] = useState(
    pathname.startsWith('/configuracoes'),
  )

  const sair = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  const isAtivo = (href: string) => pathname.startsWith(href)

  return (
    <aside className="w-64 min-h-screen bg-stone-50 border-r border-stone-200 flex flex-col shrink-0">
      {/* Marca */}
      <div className="px-6 py-7 border-b border-stone-200">
        <h1 className="text-base font-semibold tracking-tight text-stone-800">
          Borges Nail Styles
        </h1>
      </div>

      {/* Navegação */}
      <nav className="flex-1 px-3 py-5 space-y-1">
        {navPrincipal.map(({ href, label, icon: Icone }) => (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors min-h-[44px] ${
              isAtivo(href)
                ? 'bg-stone-800 text-white'
                : 'text-stone-600 hover:bg-stone-100 active:bg-stone-200'
            }`}
          >
            <Icone size={20} strokeWidth={1.75} />
            {label}
          </Link>
        ))}

        {/* Configurações com submenu */}
        <div>
          <button
            onClick={() => setConfigAberto((v) => !v)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors min-h-[44px] ${
              isAtivo('/configuracoes')
                ? 'bg-stone-800 text-white'
                : 'text-stone-600 hover:bg-stone-100 active:bg-stone-200'
            }`}
          >
            <Settings size={20} strokeWidth={1.75} />
            <span className="flex-1 text-left">Configurações</span>
            {configAberto ? (
              <ChevronDown size={16} />
            ) : (
              <ChevronRight size={16} />
            )}
          </button>

          {configAberto && (
            <div className="mt-1 ml-3 space-y-1">
              {navConfiguracoes.map(({ href, label, icon: Icone }) => (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors min-h-[44px] ${
                    pathname === href
                      ? 'bg-stone-700 text-white'
                      : 'text-stone-500 hover:bg-stone-100 active:bg-stone-200'
                  }`}
                >
                  <Icone size={17} strokeWidth={1.75} />
                  {label}
                </Link>
              ))}
            </div>
          )}
        </div>
      </nav>

      {/* Sair */}
      <div className="px-3 py-3 border-t border-stone-200 shrink-0">
        <button
          onClick={sair}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-stone-500 hover:bg-stone-100 active:bg-stone-200 transition-colors min-h-[44px]"
        >
          <LogOut size={18} strokeWidth={1.75} />
          Sair
        </button>
      </div>
    </aside>
  )
}
