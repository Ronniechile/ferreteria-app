"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  Package,
  FileText,
  DollarSign,
  CreditCard,
  Settings,
  Wrench,
  FolderTree,
  Download,
  ShoppingCart,
  Truck,
  BarChart3,
  ClipboardList,
  FileSignature,
} from "lucide-react"

const navigation = [
  { name: "Inventario", href: "/inventario", icon: Package },
  { name: "Familias", href: "/familias", icon: FolderTree },
  { name: "Proveedores", href: "/proveedores", icon: Truck },
  { name: "Facturas de Compra", href: "/compras", icon: FileText },
  { name: "Órdenes de Compra", href: "/ordenes-compra", icon: ClipboardList },
  { name: "Presupuestos", href: "/presupuestos", icon: FileSignature },
  { name: "Caja", href: "/caja", icon: CreditCard },
  { name: "Ventas", href: "/ventas", icon: ShoppingCart },
  { name: "Reportes", href: "/reportes", icon: BarChart3 },
  { name: "Importar/Exportar", href: "/datos", icon: Download },
  { name: "Configuración", href: "/configuracion", icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-sidebar text-sidebar-foreground">
      <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-6">
        <Wrench className="h-8 w-8 text-sidebar-primary" />
        <span className="text-xl font-bold">FerreTech</span>
      </div>
      <nav className="space-y-1 p-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
