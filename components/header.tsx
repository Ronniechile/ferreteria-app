"use client"

import { getCashRegisterStatus } from "@/lib/storage"
import { Badge } from "@/components/ui/badge"
import { useEffect, useState } from "react"
import type { CashRegister } from "@/lib/types"

export function Header({ title }: { title: string }) {
  const [cashRegister, setCashRegister] = useState<CashRegister | null>(null)

  useEffect(() => {
    const { register } = getCashRegisterStatus()
    setCashRegister(register)
  }, [])

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background px-6">
      <h1 className="text-xl font-semibold text-foreground">{title}</h1>
      <div className="flex items-center gap-4">
        {cashRegister ? (
          <Badge variant={cashRegister.status === "open" ? "default" : "secondary"}>
            Caja {cashRegister.status === "open" ? "Abierta" : "Cerrada"}
          </Badge>
        ) : (
          <Badge variant="outline">Sin caja abierta</Badge>
        )}
        <span className="text-sm text-muted-foreground">
          {new Date().toLocaleDateString("es-ES", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </span>
      </div>
    </header>
  )
}
