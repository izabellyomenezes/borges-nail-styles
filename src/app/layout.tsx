import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Sidebar from '@/components/Sidebar'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Borges Nail Styles',
  description: 'Sistema de gestão para Borges Nail Styles',
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.className} antialiased bg-white`}>
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 p-6 lg:p-8 overflow-auto">{children}</main>
        </div>
      </body>
    </html>
  )
}
