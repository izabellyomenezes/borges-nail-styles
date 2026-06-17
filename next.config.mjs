/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // better-sqlite3 é um módulo nativo — não deve ser processado pelo webpack
    config.externals.push('better-sqlite3')
    return config
  },
}

export default nextConfig
