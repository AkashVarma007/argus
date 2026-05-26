import './globals.css'
import type { Metadata } from 'next'
import { inter, jetbrainsMono } from '@/lib/fonts'

export const metadata: Metadata = {
  title: 'Argus',
  description: 'MCP conformance, build, and learn platform',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body>
        {children}
      </body>
    </html>
  )
}
