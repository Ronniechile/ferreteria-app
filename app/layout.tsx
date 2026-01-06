import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Sidebar } from "@/components/sidebar"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "FerreTech - Sistema de Gestión de Ferretería",
  description: "Sistema completo para gestión de inventario, ventas y caja de ferretería",
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es">
      <body className="font-sans antialiased">
        <Sidebar />
        <main className="ml-64 min-h-screen bg-background">{children}</main>
        <Analytics />
      </body>
    </html>
  )
}
