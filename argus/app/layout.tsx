import './globals.css'
import type { Metadata } from 'next'
import { inter, jetbrainsMono } from '@/lib/fonts'
import { TitleBar } from '@/components/chrome/TitleBar'
import { TabStrip } from '@/components/chrome/TabStrip'
import { Footer } from '@/components/chrome/Footer'
import { KeyboardNav } from '@/components/chrome/KeyboardNav'
import styles from './layout.module.css'

export const metadata: Metadata = {
  title: 'Argus',
  description: 'MCP conformance, build, and learn platform',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const tabs = [
    { id: 'home', label: 'home' },
    { id: 'test', label: 'test' },
    { id: 'build', label: 'build' },
    { id: 'learn', label: 'learn' },
  ]
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body>
        <div className={styles.shell}>
          <TitleBar version="0.1.0" />
          <TabStrip tabs={tabs} activeId="home" />
          <main className={styles.content}>{children}</main>
          <Footer scope="home" />
          <KeyboardNav />
        </div>
      </body>
    </html>
  )
}
