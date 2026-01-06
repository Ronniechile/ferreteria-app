"use client"

import { useEffect, useMemo, useState } from "react"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Minus,
  Plus,
  Trash2,
  ShoppingCart,
  AlertTriangle,
  Check,
  Banknote,
  TrendingUp,
  CreditCard,
  ArrowRightLeft,
} from "lucide-react"
import { getCashRegisterStatus, addSaleToCashRegister, addSale, getProducts, reduceStockFromSale } from "@/lib/storage"
import type { CashRegister, Sale, SaleItem, Product } from "@/lib/types"

export default function VentasPage() {
  const [cashRegister, setCashRegister] = useState<CashRegister | null>(null)
  const [isCashOpen, setIsCashOpen] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [saleItems, setSaleItems] = useState<SaleItem[]>([])
  const [discount, setDiscount] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "transfer">("cash")
  const [amountReceived, setAmountReceived] = useState(0)
  const [saleCompleted, setSaleCompleted] = useState(false)
  const [lastSale, setLastSale] = useState<{ total: number; change: number } | null>(null)
  const [search, setSearch] = useState("")

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase()
    return products
      .filter(
        (product) =>
          product.stock > 0 &&
          (term === "" || product.name.toLowerCase().includes(term) || product.code.toLowerCase().includes(term)),
      )
      .slice(0, 15)
  }, [products, search])

  useEffect(() => {
    const loadData = () => {
      const { isOpen, register } = getCashRegisterStatus()
      setIsCashOpen(isOpen)
      setCashRegister(register)
      setProducts(getProducts())
    }
    loadData()
    // Recargar cada 3 segundos para detectar cambios en la caja
    const interval = setInterval(loadData, 3000)
    return () => clearInterval(interval)
  }, [])

  const addSaleItem = (productId: string) => {
    if (!productId) return
    const product = products.find((p) => p.id === productId)
    if (!product) return

    const existingItem = saleItems.find((item) => item.productId === productId)
    if (existingItem) {
      if (existingItem.quantity + 1 > product.stock) {
        alert(`Stock insuficiente. Disponible: ${product.stock}`)
        return
      }
      incrementQuantity(saleItems.findIndex(item => item.productId === productId))
    } else {
      if (1 > product.stock) {
        alert(`Stock insuficiente. Disponible: ${product.stock}`)
        return
      }
      const newItem: SaleItem = {
        productId: productId,
        productName: product.name,
        quantity: 1,
        unitPrice: product.salePrice,
        subtotal: product.salePrice,
      }
      setSaleItems([...saleItems, newItem])
    }
    setSearch("")
  }

  const removeSaleItem = (index: number) => {
    setSaleItems(saleItems.filter((_, i) => i !== index))
  }

  const incrementQuantity = (index: number) => {
    const item = saleItems[index]
    const product = products.find((p) => p.id === item.productId)
    if (!product) return

    if (item.quantity + 1 > product.stock) {
      alert(`Stock insuficiente. Disponible: ${product.stock}`)
      return
    }

    const updated = [...saleItems]
    updated[index] = {
      ...updated[index],
      quantity: updated[index].quantity + 1,
      subtotal: (updated[index].quantity + 1) * updated[index].unitPrice,
    }
    setSaleItems(updated)
  }

  const decrementQuantity = (index: number) => {
    const updated = [...saleItems]
    if (updated[index].quantity > 1) {
      updated[index] = {
        ...updated[index],
        quantity: updated[index].quantity - 1,
        subtotal: (updated[index].quantity - 1) * updated[index].unitPrice,
      }
      setSaleItems(updated)
    }
  }

  const calculateSubtotal = () => {
    return saleItems.reduce((acc, item) => acc + item.subtotal, 0)
  }

  const calculateTotal = () => {
    return calculateSubtotal() - discount
  }

  const calculateChange = () => {
    if (paymentMethod !== "cash") return 0
    return Math.max(0, amountReceived - calculateTotal())
  }

  const resetSale = () => {
    setSaleItems([])
    setDiscount(0)
    setPaymentMethod("cash")
    setAmountReceived(0)
    setSaleCompleted(false)
    setLastSale(null)
    const { isOpen, register } = getCashRegisterStatus()
    setIsCashOpen(isOpen)
    setCashRegister(register)
  }

  const handleCompleteSale = () => {
    const { isOpen, register } = getCashRegisterStatus()

    if (!isOpen || !register) {
      alert("Debes abrir la caja antes de registrar ventas")
      return
    }
    if (saleItems.length === 0) return

    if (paymentMethod === "cash" && amountReceived < calculateTotal()) {
      alert("El monto recibido es menor al total de la venta")
      return
    }

    const change = paymentMethod === "cash" ? amountReceived - calculateTotal() : 0

    const sale: Sale = {
      id: crypto.randomUUID(),
      items: saleItems,
      subtotal: calculateSubtotal(),
      discount,
      total: calculateTotal(),
      paymentMethod,
      amountReceived: paymentMethod === "cash" ? amountReceived : undefined,
      change: paymentMethod === "cash" ? change : undefined,
      cashRegisterId: register.id,
      createdAt: new Date().toISOString(),
    }

    addSale(sale)
    addSaleToCashRegister(register.id, sale)
    reduceStockFromSale(
      saleItems.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      })),
    )

    setLastSale({ total: calculateTotal(), change })
    setSaleCompleted(true)
    const { isOpen: newIsOpen, register: newRegister } = getCashRegisterStatus()
    setIsCashOpen(newIsOpen)
    setCashRegister(newRegister)
    setProducts(getProducts())
  }

  const getTotalSales = () => {
    if (!cashRegister) return 0
    return cashRegister.sales.reduce((acc, sale) => acc + sale.total, 0)
  }

  const getCashSales = () => {
    if (!cashRegister) return 0
    return cashRegister.sales.filter((s) => s.paymentMethod === "cash").reduce((acc, s) => acc + s.total, 0)
  }

  const getCardSales = () => {
    if (!cashRegister) return 0
    return cashRegister.sales.filter((s) => s.paymentMethod === "card").reduce((acc, s) => acc + s.total, 0)
  }

  const getTransferSales = () => {
    if (!cashRegister) return 0
    return cashRegister.sales.filter((s) => s.paymentMethod === "transfer").reduce((acc, s) => acc + s.total, 0)
  }

  return (
    <div className="flex flex-col">
      <Header title="Ventas" />
      <div className="p-6 space-y-6">
        <Tabs defaultValue="pos" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="pos">Punto de Venta</TabsTrigger>
            <TabsTrigger value="summary">Resumen del Día</TabsTrigger>
            <TabsTrigger value="history">Historial</TabsTrigger>
          </TabsList>

          <TabsContent value="pos" className="space-y-6">
            {!isCashOpen && (
              <Card className="border-destructive bg-destructive/5">
                <CardContent className="flex items-center gap-4 py-4">
                  <AlertTriangle className="h-8 w-8 text-destructive" />
                  <div>
                    <h3 className="font-medium text-destructive">Caja Cerrada</h3>
                    <p className="text-sm text-muted-foreground">
                      Debes abrir la caja desde la sección de Caja antes de registrar ventas.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {saleCompleted && lastSale && (
              <Card className="border-accent bg-accent/5">
                <CardContent className="flex flex-col items-center gap-4 py-8">
                  <div className="h-16 w-16 rounded-full bg-accent/20 flex items-center justify-center">
                    <Check className="h-8 w-8 text-accent" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-accent">Venta Completada</h3>
                    <p className="text-2xl font-bold mt-2">Total: ${lastSale.total.toLocaleString("es-CL")}</p>
                    {lastSale.change > 0 && (
                      <div className="mt-4 p-4 bg-background rounded-lg">
                        <p className="text-sm text-muted-foreground">Vuelto a entregar:</p>
                        <p className="text-3xl font-bold text-accent">${lastSale.change.toLocaleString("es-CL")}</p>
                      </div>
                    )}
                  </div>
                  <Button onClick={resetSale} size="lg" className="mt-4">
                    Nueva Venta
                  </Button>
                </CardContent>
              </Card>
            )}

            {!saleCompleted && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <ShoppingCart className="h-5 w-5" />
                        Agregar Productos
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="productSearch">Buscar producto</Label>
                        <Input
                          id="productSearch"
                          placeholder="Nombre o código"
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          disabled={!isCashOpen}
                        />
                        <div className="max-h-72 overflow-y-auto rounded-lg border bg-muted/20">
                          {filteredProducts.length === 0 ? (
                            <div className="p-4 text-sm text-muted-foreground">Sin resultados</div>
                          ) : (
                            filteredProducts.map((product) => (
                              <button
                                type="button"
                                key={product.id}
                                className={cn(
                                  "flex w-full items-start gap-3 border-b px-4 py-3 text-left hover:bg-muted/60",
                                  product.stock <= 5 && "bg-amber-50 dark:bg-amber-500/10",
                                )}
                                onClick={() => addSaleItem(product.id)}
                                disabled={!isCashOpen}
                              >
                                <div className="flex-1">
                                  <p className="font-semibold">{product.name}</p>
                                  <p className="text-xs text-muted-foreground">Código: {product.code}</p>
                                </div>
                                <div className="text-right text-sm">
                                  <p className="font-semibold">${product.salePrice.toLocaleString("es-CL")}</p>
                                  <p className="text-xs text-muted-foreground">Stock: {product.stock}</p>
                                </div>
                              </button>
                            ))
                          )}
                        </div>
                      </div>

                      <div className="border rounded-lg overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Producto</TableHead>
                              <TableHead className="text-center">Cantidad</TableHead>
                              <TableHead className="text-right">Precio</TableHead>
                              <TableHead className="text-right">Subtotal</TableHead>
                              <TableHead className="w-12"></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {saleItems.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                  Agrega productos a la venta
                                </TableCell>
                              </TableRow>
                            ) : (
                              saleItems.map((item, index) => (
                                <TableRow key={index}>
                                  <TableCell className="font-medium">{item.productName}</TableCell>
                                  <TableCell className="text-center">
                                    <div className="flex items-center justify-center gap-2">
                                      <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-7 w-7 bg-transparent"
                                        onClick={() => decrementQuantity(index)}
                                      >
                                        <Minus className="h-3 w-3" />
                                      </Button>
                                      <span className="w-8 text-center font-medium">{item.quantity}</span>
                                      <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-7 w-7 bg-transparent"
                                        onClick={() => incrementQuantity(index)}
                                      >
                                        <Plus className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    ${item.unitPrice.toLocaleString("es-CL")}
                                  </TableCell>
                                  <TableCell className="text-right font-medium">
                                    ${item.subtotal.toLocaleString("es-CL")}
                                  </TableCell>
                                  <TableCell>
                                    <Button variant="ghost" size="icon" onClick={() => removeSaleItem(index)}>
                                      <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Resumen de Venta</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Subtotal:</span>
                          <span>${calculateSubtotal().toLocaleString("es-CL")}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <Label htmlFor="discount" className="text-sm text-muted-foreground">
                            Descuento:
                          </Label>
                          <Input
                            id="discount"
                            type="number"
                            min={0}
                            className="w-32 text-right"
                            value={discount}
                            onChange={(e) => setDiscount(Number.parseFloat(e.target.value) || 0)}
                            disabled={!isCashOpen}
                          />
                        </div>
                        <div className="flex justify-between text-lg font-bold border-t pt-2">
                          <span>Total:</span>
                          <span className="text-accent">${calculateTotal().toLocaleString("es-CL")}</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Método de Pago</Label>
                        <Select
                          value={paymentMethod}
                          onValueChange={(value: "cash" | "card" | "transfer") => {
                            setPaymentMethod(value)
                            if (value !== "cash") setAmountReceived(0)
                          }}
                          disabled={!isCashOpen}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cash">Efectivo</SelectItem>
                            <SelectItem value="card">Tarjeta</SelectItem>
                            <SelectItem value="transfer">Transferencia</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {paymentMethod === "cash" && (
                        <div className="space-y-4 p-4 bg-muted rounded-lg">
                          <div className="space-y-2">
                            <Label htmlFor="amountReceived" className="flex items-center gap-2">
                              <Banknote className="h-4 w-4" />
                              Monto Recibido
                            </Label>
                            <Input
                              id="amountReceived"
                              type="number"
                              min={0}
                              placeholder="0"
                              value={amountReceived || ""}
                              onChange={(e) => setAmountReceived(Number.parseFloat(e.target.value) || 0)}
                              disabled={!isCashOpen}
                              className="text-lg"
                            />
                          </div>
                          {amountReceived > 0 && (
                            <div
                              className={`p-3 rounded-lg ${amountReceived >= calculateTotal() ? "bg-accent/20" : "bg-destructive/20"}`}
                            >
                              <p className="text-sm text-muted-foreground">Vuelto:</p>
                              <p
                                className={`text-2xl font-bold ${amountReceived >= calculateTotal() ? "text-accent" : "text-destructive"}`}
                              >
                                ${calculateChange().toLocaleString("es-CL")}
                              </p>
                            </div>
                          )}
                          <div className="grid grid-cols-3 gap-2">
                            {[1000, 2000, 5000, 10000, 20000, 50000].map((amount) => (
                              <Button
                                key={amount}
                                variant="outline"
                                size="sm"
                                onClick={() => setAmountReceived(amount)}
                                disabled={!isCashOpen}
                              >
                                ${(amount / 1000).toLocaleString("es-CL")}k
                              </Button>
                            ))}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full bg-transparent"
                            onClick={() => setAmountReceived(calculateTotal())}
                            disabled={!isCashOpen}
                          >
                            Monto Exacto
                          </Button>
                        </div>
                      )}

                      <Button
                        onClick={handleCompleteSale}
                        className="w-full"
                        size="lg"
                        disabled={
                          !isCashOpen ||
                          saleItems.length === 0 ||
                          (paymentMethod === "cash" && amountReceived < calculateTotal())
                        }
                      >
                        Completar Venta
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="summary" className="space-y-6">
            {!cashRegister && (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">No hay caja abierta hoy</CardContent>
              </Card>
            )}

            {cashRegister && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Total Ventas</CardTitle>
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">${getTotalSales().toLocaleString("es-CL")}</div>
                      <p className="text-sm text-muted-foreground">{cashRegister.sales.length} ventas</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Efectivo</CardTitle>
                      <Banknote className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">${getCashSales().toLocaleString("es-CL")}</div>
                      <p className="text-sm text-muted-foreground">
                        {cashRegister.sales.filter((s) => s.paymentMethod === "cash").length} ventas
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Tarjeta</CardTitle>
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">${getCardSales().toLocaleString("es-CL")}</div>
                      <p className="text-sm text-muted-foreground">
                        {cashRegister.sales.filter((s) => s.paymentMethod === "card").length} ventas
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Transferencia</CardTitle>
                      <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">${getTransferSales().toLocaleString("es-CL")}</div>
                      <p className="text-sm text-muted-foreground">
                        {cashRegister.sales.filter((s) => s.paymentMethod === "transfer").length} ventas
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Resumen por Método de Pago</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Banknote className="h-5 w-5 text-accent" />
                          <span className="font-medium">Efectivo</span>
                        </div>
                        <p className="text-2xl font-bold">${getCashSales().toLocaleString("es-CL")}</p>
                        <p className="text-sm text-muted-foreground">
                          {cashRegister.sales.filter((s) => s.paymentMethod === "cash").length} ventas
                        </p>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <CreditCard className="h-5 w-5 text-blue-500" />
                          <span className="font-medium">Tarjeta</span>
                        </div>
                        <p className="text-2xl font-bold">${getCardSales().toLocaleString("es-CL")}</p>
                        <p className="text-sm text-muted-foreground">
                          {cashRegister.sales.filter((s) => s.paymentMethod === "card").length} ventas
                        </p>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <ArrowRightLeft className="h-5 w-5 text-purple-500" />
                          <span className="font-medium">Transferencia</span>
                        </div>
                        <p className="text-2xl font-bold">${getTransferSales().toLocaleString("es-CL")}</p>
                        <p className="text-sm text-muted-foreground">
                          {cashRegister.sales.filter((s) => s.paymentMethod === "transfer").length} ventas
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            {!cashRegister && (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">No hay caja abierta hoy</CardContent>
              </Card>
            )}

            {cashRegister && (
              <Card>
                <CardHeader>
                  <CardTitle>Ventas del Día</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Hora</TableHead>
                        <TableHead className="text-center">Productos</TableHead>
                        <TableHead className="text-center">Método</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cashRegister.sales.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                            No hay ventas registradas hoy
                          </TableCell>
                        </TableRow>
                      ) : (
                        cashRegister.sales
                          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                          .map((sale) => (
                            <TableRow key={sale.id}>
                              <TableCell>
                                {new Date(sale.createdAt).toLocaleTimeString("es-CL", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </TableCell>
                              <TableCell className="text-center">{sale.items.length}</TableCell>
                              <TableCell className="text-center">
                                <Badge
                                  variant={
                                    sale.paymentMethod === "cash"
                                      ? "default"
                                      : sale.paymentMethod === "card"
                                        ? "secondary"
                                        : "outline"
                                  }
                                >
                                  {sale.paymentMethod === "cash"
                                    ? "Efectivo"
                                    : sale.paymentMethod === "card"
                                      ? "Tarjeta"
                                      : "Transferencia"}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                ${sale.total.toLocaleString("es-CL")}
                              </TableCell>
                            </TableRow>
                          ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
