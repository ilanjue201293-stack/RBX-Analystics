import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'RBX Analytics', description: 'Deep Roblox game analytics dashboard' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="fr"><body>{children}</body></html>
}