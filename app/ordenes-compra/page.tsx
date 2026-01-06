"use client"

import { useEffect, useMemo, useState } from "react"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Plus, ClipboardList, Truck, PackageCheck, Trash2 } from "lucide-react"
import {
  addPurchaseOrder,
  deletePurchaseOrder,
  getProducts,
  getPurchaseOrders,
  getSuppliers,
  updatePurchaseOrderStatus,
} from "@/lib/storage"
import type { Product, PurchaseOrder, PurchaseOrderItem, PurchaseOrderStatus, Supplier } from "@/lib/types"

const statusLabels: Record<PurchaseOrderStatus, string> = {
  borrador: "Borrador",
  enviado: "Enviada",
  recibido: "Recibida",
}

const statusVariants: Record<PurchaseOrderStatus, "secondary" | "default" | "destructive" | "outline"> = {
  borrador: "secondary",
  enviado: "default",
  recibido: "outline",
}

export default function OrdenesCompraPage() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [statusFilter, setStatusFilter] = useState<"all" | PurchaseOrderStatus>("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    orderNumber: "",
    supplierId: "",
    date: new Date().toISOString().split("T")[0],
    status: "borrador" as PurchaseOrderStatus,
    notes: "",
  })
  const [items, setItems] = useState<PurchaseOrderItem[]>([])
  const [currentItem, setCurrentItem] = useState({
    productId: "",
    quantity: 1,
    unitPrice: 0,
  })

  useEffect(() => {
    setProducts(getProducts())
    setSuppliers(getSuppliers())
    setOrders(getPurchaseOrders())
  }, [])

  const filteredOrders = useMemo(() => {
    if (statusFilter === "all") return orders
    return orders.filter((order) => order.status === statusFilter)
  }, [orders, statusFilter])

  const pendingOrders = orders.filter((order) => order.status !== "recibido")
  const totalPendingValue = pendingOrders.reduce((acc, order) => acc + order.total, 0)

  const addItem = () => {
    if (!currentItem.productId || currentItem.quantity <= 0) return
    const product = products.find((product) => product.id === currentItem.productId)
    if (!product) return

    const newItem: PurchaseOrderItem = {
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

  const calculateTotal = () => items.reduce((acc, item) => acc + item.subtotal, 0)

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!formData.orderNumber || !formData.supplierId || items.length === 0) {
      alert("Completa los datos de la orden y agrega al menos un producto")
      return
    }

    const supplier = suppliers.find((s) => s.id === formData.supplierId)
    const newOrder: PurchaseOrder = {
      id: crypto.randomUUID(),
      orderNumber: formData.orderNumber,
      supplierId: formData.supplierId,
      supplierName: supplier?.name || "Proveedor",
      date: formData.date,
      status: formData.status,
      notes: formData.notes,
      items,
      total: calculateTotal(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    addPurchaseOrder(newOrder)
    setOrders(getPurchaseOrders())
    resetForm()
  }

  const resetForm = () => {
    setFormData({
      orderNumber: "",
      supplierId: "",
      date: new Date().toISOString().split("T")[0],
      status: "borrador",
      notes: "",
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
      unitPrice: product?.costPrice ?? 0,
    })
  }

  const handleStatusChange = (orderId: string, status: PurchaseOrderStatus) => {
    updatePurchaseOrderStatus(orderId, status)
    setOrders(getPurchaseOrders())
  }

  const handleDelete = (orderId: string) => {
    if (confirm("¿Eliminar esta orden de compra?")) {
      deletePurchaseOrder(orderId)
      setOrders(getPurchaseOrders())
    }
  }

  return (
    <div className="flex flex-col">
      <Header title="Órdenes de Compra" />
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Órdenes totales</CardTitle>
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{orders.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pendientes</CardTitle>
              <Truck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingOrders.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Valor pendiente</CardTitle>
              <PackageCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalPendingValue.toLocaleString("es-CL")}</div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as "all" | PurchaseOrderStatus)}>
            <SelectTrigger className="w-full md:w-64">
              <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="borrador">Borrador</SelectItem>
              <SelectItem value="enviado">Enviada</SelectItem>
              <SelectItem value="recibido">Recibida</SelectItem>
            </SelectContent>
          </Select>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()}>
                <Plus className="mr-2 h-4 w-4" /> Nueva orden
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Registrar Orden de Compra</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="orderNumber">Orden #</Label>
                    <Input
                      id="orderNumber"
                      value={formData.orderNumber}
                      onChange={(event) => setFormData({ ...formData, orderNumber: event.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="supplier">Proveedor</Label>
                    <Select
                      value={formData.supplierId}
                      onValueChange={(value) => setFormData({ ...formData, supplierId: value })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar proveedor" />
                      </SelectTrigger>
                      <SelectContent>
                        {suppliers.map((supplier) => (
                          <SelectItem key={supplier.id} value={supplier.id}>
                            {supplier.name}
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
                      value={formData.date}
                      onChange={(event) => setFormData({ ...formData, date: event.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Estado</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => setFormData({ ...formData, status: value as PurchaseOrderStatus })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="borrador">Borrador</SelectItem>
                        <SelectItem value="enviado">Enviada</SelectItem>
                        <SelectItem value="recibido">Recibida</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notas</Label>
                    <Textarea
                      id="notes"
                      placeholder="Indicaciones para el proveedor"
                      value={formData.notes}
                      onChange={(event) => setFormData({ ...formData, notes: event.target.value })}
                    />
                  </div>
                </div>

                <div className="border-t pt-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Productos</h4>
                    <Button type="button" variant="outline" onClick={addItem}>
                      Agregar
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-2">
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
                    <Input
                      type="number"
                      placeholder="Cantidad"
                      value={currentItem.quantity}
                      onChange={(event) =>
                        setCurrentItem({ ...currentItem, quantity: Number.parseInt(event.target.value) || 0 })
                      }
                    />
                    <Input
                      type="number"
                      placeholder="Precio"
                      value={currentItem.unitPrice}
                      onChange={(event) =>
                        setCurrentItem({ ...currentItem, unitPrice: Number.parseFloat(event.target.value) || 0 })
                      }
                    />
                  </div>

                  {items.length > 0 && (
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Producto</TableHead>
                            <TableHead className="text-right">Cant.</TableHead>
                            <TableHead className="text-right">Precio</TableHead>
                            <TableHead className="text-right">Subtotal</TableHead>
                            <TableHead className="w-12" />
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {items.map((item, index) => (
                            <TableRow key={`${item.productId}-${index}`}>
                              <TableCell>{item.productName}</TableCell>
                              <TableCell className="text-right">{item.quantity}</TableCell>
                              <TableCell className="text-right">${item.unitPrice.toLocaleString("es-CL")}</TableCell>
                              <TableCell className="text-right">${item.subtotal.toLocaleString("es-CL")}</TableCell>
                              <TableCell className="text-right">
                                <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(index)}>
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                          <TableRow>
                            <TableCell colSpan={3} className="text-right font-semibold">
                              Total
                            </TableCell>
                            <TableCell className="text-right font-semibold">
                              ${calculateTotal().toLocaleString("es-CL")}
                            </TableCell>
                            <TableCell />
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">Guardar Orden</Button>
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
                  <TableHead>Orden #</TableHead>
                  <TableHead>Proveedor</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-center">Productos</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                      No hay órdenes con este criterio
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-mono">{order.orderNumber}</TableCell>
                        <TableCell>{order.supplierName}</TableCell>
                        <TableCell>{new Date(order.date).toLocaleDateString("es-CL")}</TableCell>
                        <TableCell>
                          <Badge variant={statusVariants[order.status]}>{statusLabels[order.status]}</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary">{order.items.length}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          ${order.total.toLocaleString("es-CL")}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            <Select value={order.status} onValueChange={(value) => handleStatusChange(order.id, value as PurchaseOrderStatus)}>
                              <SelectTrigger className="w-[130px] text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="borrador">Borrador</SelectItem>
                                <SelectItem value="enviado">Enviada</SelectItem>
                                <SelectItem value="recibido">Recibida</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(order.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
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
