"use client"

import { useEffect, useState } from "react"
import { Header } from "@/components/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { BarChart3, TrendingUp, DollarSign, Package, ShoppingCart } from "lucide-react"
import { getCashRegisters, getSales, getProducts, getFamilies } from "@/lib/storage"
import type { CashRegister, Sale, Product, ProductFamily } from "@/lib/types"

export default function ReportesPage() {
  const [period, setPeriod] = useState<"today" | "week" | "month">("today")
  const [cashRegisters, setCashRegisters] = useState<CashRegister[]>([])
  const [allSales, setAllSales] = useState<Sale[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [families, setFamilies] = useState<ProductFamily[]>([])

  useEffect(() => {
    setCashRegisters(getCashRegisters())
    setAllSales(getSales())
    setProducts(getProducts())
    setFamilies(getFamilies())
  }, [])

  const getFilteredSales = () => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    switch (period) {
      case "today":
        return allSales.filter((s) => new Date(s.createdAt) >= today)
      case "week":
        const weekAgo = new Date(today)
        weekAgo.setDate(weekAgo.getDate() - 7)
        return allSales.filter((s) => new Date(s.createdAt) >= weekAgo)
      case "month":
        const monthAgo = new Date(today)
        monthAgo.setMonth(monthAgo.getMonth() - 1)
        return allSales.filter((s) => new Date(s.createdAt) >= monthAgo)
      default:
        return allSales
    }
  }

  const filteredSales = getFilteredSales()

  const getTotalRevenue = () => {
    return filteredSales.reduce((acc, sale) => acc + sale.total, 0)
  }

  const getTotalTransactions = () => {
    return filteredSales.length
  }

  const getAverageTicket = () => {
    if (filteredSales.length === 0) return 0
    return getTotalRevenue() / filteredSales.length
  }

  const getTotalProductsSold = () => {
    return filteredSales.reduce((acc, sale) => acc + sale.items.reduce((sum, item) => sum + item.quantity, 0), 0)
  }

  const getSalesByPaymentMethod = () => {
    const methods = {
      cash: 0,
      card: 0,
      transfer: 0,
    }
    filteredSales.forEach((sale) => {
      methods[sale.paymentMethod] += sale.total
    })
    return methods
  }

  const getTopProducts = () => {
    const productSales: { [key: string]: { name: string; quantity: number; revenue: number } } = {}

    filteredSales.forEach((sale) => {
      sale.items.forEach((item) => {
        if (!productSales[item.productId]) {
          productSales[item.productId] = {
            name: item.productName,
            quantity: 0,
            revenue: 0,
          }
        }
        productSales[item.productId].quantity += item.quantity
        productSales[item.productId].revenue += item.subtotal
      })
    })

    return Object.entries(productSales)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
  }

  const getSalesByFamily = () => {
    const familySales: { [key: string]: { name: string; revenue: number; count: number } } = {}

    filteredSales.forEach((sale) => {
      sale.items.forEach((item) => {
        const product = products.find((p) => p.id === item.productId)
        if (product) {
          const family = families.find((f) => f.id === product.familyId)
          const familyName = family?.name || "Sin Familia"
          if (!familySales[familyName]) {
            familySales[familyName] = {
              name: familyName,
              revenue: 0,
              count: 0,
            }
          }
          familySales[familyName].revenue += item.subtotal
          familySales[familyName].count += item.quantity
        }
      })
    })

    return Object.values(familySales).sort((a, b) => b.revenue - a.revenue)
  }

  const paymentMethods = getSalesByPaymentMethod()
  const maxPaymentAmount = Math.max(paymentMethods.cash, paymentMethods.card, paymentMethods.transfer, 1)
  const topProducts = getTopProducts()
  const maxProductRevenue = topProducts.length > 0 ? topProducts[0].revenue : 1
  const salesByFamily = getSalesByFamily()
  const maxFamilyRevenue = salesByFamily.length > 0 ? salesByFamily[0].revenue : 1

  return (
    <div className="flex flex-col">
      <Header title="Reportes y Estadísticas" />
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-accent" />
            <h2 className="text-2xl font-bold">Análisis de Ventas</h2>
          </div>
          <Select value={period} onValueChange={(value: "today" | "week" | "month") => setPeriod(value)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Hoy</SelectItem>
              <SelectItem value="week">Última Semana</SelectItem>
              <SelectItem value="month">Último Mes</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Ingresos Totales</CardTitle>
              <DollarSign className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent">${getTotalRevenue().toLocaleString("es-CL")}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Transacciones</CardTitle>
              <ShoppingCart className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{getTotalTransactions()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Ticket Promedio</CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${getAverageTicket().toLocaleString("es-CL", { maximumFractionDigits: 0 })}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Productos Vendidos</CardTitle>
              <Package className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{getTotalProductsSold()}</div>
            </CardContent>
          </Card>
        </div>

        {/* Payment Methods Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Ventas por Método de Pago</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Efectivo</span>
                  <span className="text-muted-foreground">${paymentMethods.cash.toLocaleString("es-CL")}</span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent transition-all duration-500"
                    style={{ width: `${(paymentMethods.cash / maxPaymentAmount) * 100}%` }}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Tarjeta</span>
                  <span className="text-muted-foreground">${paymentMethods.card.toLocaleString("es-CL")}</span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 transition-all duration-500"
                    style={{ width: `${(paymentMethods.card / maxPaymentAmount) * 100}%` }}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Transferencia</span>
                  <span className="text-muted-foreground">${paymentMethods.transfer.toLocaleString("es-CL")}</span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500 transition-all duration-500"
                    style={{ width: `${(paymentMethods.transfer / maxPaymentAmount) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Products */}
          <Card>
            <CardHeader>
              <CardTitle>Productos Más Vendidos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {topProducts.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No hay datos de ventas</p>
              ) : (
                topProducts.map((product, index) => (
                  <div key={product.id} className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="w-6 h-6 flex items-center justify-center p-0">
                          {index + 1}
                        </Badge>
                        <span className="font-medium">{product.name}</span>
                      </div>
                      <span className="text-muted-foreground">
                        {product.quantity} uds • ${product.revenue.toLocaleString("es-CL")}
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-accent to-accent/60 transition-all duration-500"
                        style={{ width: `${(product.revenue / maxProductRevenue) * 100}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Sales by Family */}
          <Card>
            <CardHeader>
              <CardTitle>Ventas por Familia de Productos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {salesByFamily.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No hay datos de ventas</p>
              ) : (
                salesByFamily.map((family, index) => (
                  <div key={family.name} className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-medium">{family.name}</span>
                      <span className="text-muted-foreground">
                        {family.count} uds • ${family.revenue.toLocaleString("es-CL")}
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                        style={{ width: `${(family.revenue / maxFamilyRevenue) * 100}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
