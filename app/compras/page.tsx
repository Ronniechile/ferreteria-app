"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, FileText, Trash2, AlertCircle } from "lucide-react"
import {
  getProducts,
  getPurchases,
  addPurchase,
  updateStockFromPurchase,
  getFamilies,
  getSuppliers,
} from "@/lib/storage"
import type { Product, PurchaseInvoice, PurchaseItem, Family, Supplier } from "@/lib/types"

export default function ComprasPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [purchases, setPurchases] = useState<PurchaseInvoice[]>([])
  const [families, setFamilies] = useState<Family[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [invoiceData, setInvoiceData] = useState({
    invoiceNumber: "",
    supplierId: "",
    date: new Date().toISOString().split("T")[0],
  })
  const [items, setItems] = useState<PurchaseItem[]>([])
  const [currentItem, setCurrentItem] = useState({
    productId: "",
    quantity: 1,
    unitPrice: 0,
  })

  useEffect(() => {
    setProducts(getProducts())
    setPurchases(getPurchases())
    setFamilies(getFamilies())
    setSuppliers(getSuppliers())
  }, [])

  const addItem = () => {
    if (!currentItem.productId || currentItem.quantity <= 0) return
    const product = products.find((p) => p.id === currentItem.productId)
    if (!product) return

    const newItem: PurchaseItem = {
      productId: currentItem.productId,
      productName: product.name,
      quantity: currentItem.quantity,
      unitPrice: currentItem.unitPrice,
      subtotal: currentItem.quantity * currentItem.unitPrice,
    }

    setItems([...items, newItem])
    setCurrentItem({ productId: "", quantity: 1, unitPrice: 0 })
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const calculateTotal = () => {
    return items.reduce((acc, item) => acc + item.subtotal, 0)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (items.length === 0) {
      alert("Debe agregar al menos un producto a la factura")
      return
    }

    const selectedSupplier = suppliers.find((s) => s.id === invoiceData.supplierId)

    const purchase: PurchaseInvoice = {
      id: crypto.randomUUID(),
      invoiceNumber: invoiceData.invoiceNumber,
      supplierId: invoiceData.supplierId,
      supplierName: selectedSupplier?.name || "Proveedor desconocido",
      date: invoiceData.date,
      items,
      total: calculateTotal(),
      createdAt: new Date().toISOString(),
    }

    addPurchase(purchase)
    updateStockFromPurchase(
      items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      })),
    )

    setPurchases(getPurchases())
    setProducts(getProducts())
    resetForm()
  }

  const resetForm = () => {
    setInvoiceData({
      invoiceNumber: "",
      supplierId: "",
      date: new Date().toISOString().split("T")[0],
    })
    setItems([])
    setCurrentItem({ productId: "", quantity: 1, unitPrice: 0 })
    setIsDialogOpen(false)
  }

  const handleProductChange = (productId: string) => {
    const product = products.find((p) => p.id === productId)
    setCurrentItem({
      ...currentItem,
      productId,
      unitPrice: product?.costPrice || 0,
    })
  }

  return (
    <div className="flex flex-col">
      <Header title="Facturas de Compra" />
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Facturas</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{purchases.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Compras</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${purchases.reduce((acc, p) => acc + p.total, 0).toLocaleString("es-CL")}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Este Mes</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                $
                {purchases
                  .filter((p) => {
                    const purchaseDate = new Date(p.date)
                    const now = new Date()
                    return (
                      purchaseDate.getMonth() === now.getMonth() && purchaseDate.getFullYear() === now.getFullYear()
                    )
                  })
                  .reduce((acc, p) => acc + p.total, 0)
                  .toLocaleString("es-CL")}
              </div>
            </CardContent>
          </Card>
        </div>

        {suppliers.length === 0 && (
          <Card className="border-amber-500 bg-amber-500/5">
            <CardContent className="flex items-center gap-4 py-4">
              <AlertCircle className="h-8 w-8 text-amber-500" />
              <div>
                <h3 className="font-medium text-amber-600">Sin Proveedores</h3>
                <p className="text-sm text-muted-foreground">
                  Debes agregar proveedores antes de registrar facturas de compra.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-between items-center">
          <p className="text-muted-foreground">
            Registra las facturas de compra para actualizar automáticamente el inventario.
          </p>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()} disabled={suppliers.length === 0}>
                <Plus className="h-4 w-4 mr-2" />
                Nueva Factura
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Registrar Factura de Compra</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="invoiceNumber">Número de Factura</Label>
                    <Input
                      id="invoiceNumber"
                      value={invoiceData.invoiceNumber}
                      onChange={(e) =>
                        setInvoiceData({
                          ...invoiceData,
                          invoiceNumber: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="supplier">Proveedor</Label>
                    <Select
                      value={invoiceData.supplierId}
                      onValueChange={(value) =>
                        setInvoiceData({
                          ...invoiceData,
                          supplierId: value,
                        })
                      }
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar proveedor" />
                      </SelectTrigger>
                      <SelectContent>
                        {suppliers.map((supplier) => (
                          <SelectItem key={supplier.id} value={supplier.id}>
                            {supplier.rut} - {supplier.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date">Fecha</Label>
                    <Input
                      id="date"
                      type="date"
                      value={invoiceData.date}
                      onChange={(e) =>
                        setInvoiceData({
                          ...invoiceData,
                          date: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium mb-4">Agregar Productos</h4>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="col-span-2">
                      <Select value={currentItem.productId} onValueChange={handleProductChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar producto" />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map((product) => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.code} - {product.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Input
                        type="number"
                        placeholder="Cantidad"
                        value={currentItem.quantity}
                        onChange={(e) =>
                          setCurrentItem({
                            ...currentItem,
                            quantity: Number.parseInt(e.target.value) || 0,
                          })
                        }
                      />
                    </div>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        step="1"
                        placeholder="Precio"
                        value={currentItem.unitPrice}
                        onChange={(e) =>
                          setCurrentItem({
                            ...currentItem,
                            unitPrice: Number.parseFloat(e.target.value) || 0,
                          })
                        }
                      />
                      <Button type="button" onClick={addItem}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {items.length > 0 && (
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Producto</TableHead>
                          <TableHead className="text-right">Cantidad</TableHead>
                          <TableHead className="text-right">Precio</TableHead>
                          <TableHead className="text-right">Subtotal</TableHead>
                          <TableHead className="w-10"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {items.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>{item.productName}</TableCell>
                            <TableCell className="text-right">{item.quantity}</TableCell>
                            <TableCell className="text-right">${item.unitPrice.toLocaleString("es-CL")}</TableCell>
                            <TableCell className="text-right">${item.subtotal.toLocaleString("es-CL")}</TableCell>
                            <TableCell>
                              <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(index)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow>
                          <TableCell colSpan={3} className="text-right font-bold">
                            Total:
                          </TableCell>
                          <TableCell className="text-right font-bold">
                            ${calculateTotal().toLocaleString("es-CL")}
                          </TableCell>
                          <TableCell></TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                )}

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={!invoiceData.supplierId}>
                    Registrar Factura
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Factura #</TableHead>
                  <TableHead>Proveedor</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-center">Productos</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchases.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No hay facturas registradas
                    </TableCell>
                  </TableRow>
                ) : (
                  purchases
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .map((purchase) => (
                      <TableRow key={purchase.id}>
                        <TableCell className="font-mono">{purchase.invoiceNumber}</TableCell>
                        <TableCell>{purchase.supplierName || purchase.supplierId}</TableCell>
                        <TableCell>{new Date(purchase.date).toLocaleDateString("es-CL")}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary">{purchase.items.length}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          ${purchase.total.toLocaleString("es-CL")}
                        </TableCell>
                      </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
