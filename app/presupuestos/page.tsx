"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, FileSignature, Users, Mail, Trash2, FileDown, Settings } from "lucide-react"
import {
  addBudget,
  deleteBudget,
  getBudgets,
  getBudgetSequence,
  getProducts,
  getFamilies,
  getSettings,
  setBudgetSequence,
  updateBudgetStatus,
} from "@/lib/storage"
import { calculateFinalProductPrice } from "@/lib/pricing"
import type { Budget, BudgetItem, BudgetStatus, Product, Family, AppSettings } from "@/lib/types"

const statusLabels: Record<BudgetStatus, string> = {
  borrador: "Borrador",
  enviado: "Enviado",
  aprobado: "Aprobado",
}

const statusVariants: Record<BudgetStatus, "secondary" | "default" | "outline"> = {
  borrador: "secondary",
  enviado: "default",
  aprobado: "outline",
}

const formatBudgetNumber = (sequence: number) => `P-${sequence.toString().padStart(4, "0")}`

const extractSequenceFromCode = (code: string): number | null => {
  const match = code.match(/(\d+)$/)
  return match ? Number.parseInt(match[1], 10) : null
}

const computeNextSequenceValue = (code: string, currentSequence: number): number => {
  const numericPart = extractSequenceFromCode(code)
  if (numericPart !== null && numericPart >= currentSequence) {
    return numericPart + 1
  }
  if (code === formatBudgetNumber(currentSequence)) {
    return currentSequence + 1
  }
  return currentSequence
}

export default function PresupuestosPage() {
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [families, setFamilies] = useState<Family[]>([])
  const [settings, setSettings] = useState<AppSettings>({
    generalMargin: 30,
    priceRounding: true,
    roundingTarget: 990,
    storeName: "",
    storeAddress: "",
    storePhone: "",
  })
  const [statusFilter, setStatusFilter] = useState<"all" | BudgetStatus>("all")
  const [search, setSearch] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null)
  const [nextSequence, setNextSequence] = useState(1)

  const [formData, setFormData] = useState<Omit<Budget, "id" | "total" | "createdAt" | "updatedAt">>({
    budgetNumber: formatBudgetNumber(1),
    clientName: "",
    clientEmail: "",
    validUntil: new Date().toISOString().split("T")[0],
    status: "borrador" as BudgetStatus,
    notes: "",
    items: [],
  })
  const [currentItem, setCurrentItem] = useState<Omit<BudgetItem, "productName" | "subtotal"> & { productId: string }>({
    productId: "",
    quantity: 1,
    baseUnitPrice: 0,
    marginPercentage: 30,
    unitPrice: 0,
  })

  useEffect(() => {
    const storedProducts = getProducts()
    const storedFamilies = getFamilies()
    const storedBudgets = getBudgets()
    const storedSequence = getBudgetSequence()
    const storedSettings = getSettings()
    
    const maxExistingSequence = storedBudgets.reduce((maxValue, budget) => {
      const numeric = extractSequenceFromCode(budget.budgetNumber)
      if (numeric !== null && numeric > maxValue) {
        return numeric
      }
      return maxValue
    }, 0)
    const initialSequence = Math.max(storedSequence, maxExistingSequence + 1)
    
    setProducts(storedProducts)
    setFamilies(storedFamilies)
    setBudgets(storedBudgets)
    setSettings(storedSettings)
    setNextSequence(initialSequence)
    setBudgetSequence(initialSequence)
    
    setFormData((prev) => ({
      ...prev,
      budgetNumber: formatBudgetNumber(initialSequence),
    }))
  }, [])

  const filteredBudgets = useMemo(() => {
    return budgets.filter((budget) => {
      const matchesStatus = statusFilter === "all" || budget.status === statusFilter
      const matchesSearch =
        search.length === 0 ||
        budget.clientName.toLowerCase().includes(search.toLowerCase()) ||
        budget.budgetNumber.toLowerCase().includes(search.toLowerCase())
      return matchesStatus && matchesSearch
    })
  }, [budgets, statusFilter, search])

  const addItem = () => {
    if (!currentItem.productId || currentItem.quantity <= 0) return
    const product = products.find((p) => p.id === currentItem.productId)
    if (!product) return

    const pricing = calculateFinalProductPrice(
      product,
      families,
      settings
    )

    const newItem: BudgetItem = {
      productId: product.id,
      productName: product.name,
      quantity: currentItem.quantity,
      baseUnitPrice: pricing.basePrice,
      marginPercentage: pricing.marginPercentage,
      unitPrice: pricing.finalPrice,
      subtotal: currentItem.quantity * pricing.finalPrice,
    }
    setFormData({ ...formData, items: [...formData.items, newItem] })
    setCurrentItem({ 
      productId: "", 
      quantity: 1, 
      baseUnitPrice: 0,
      marginPercentage: 30,
      unitPrice: 0,
    })
  }

  const removeItem = (index: number) => {
    setFormData({ ...formData, items: formData.items.filter((_, i) => i !== index) })
  }

  const calculateTotal = (items: BudgetItem[]) => items.reduce((acc, item) => acc + item.subtotal, 0)

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    const normalizedBudgetNumber = (formData.budgetNumber || "").trim() || formatBudgetNumber(nextSequence)
    if (budgets.some((budget) => budget.budgetNumber.toLowerCase() === normalizedBudgetNumber.toLowerCase())) {
      alert("Ese número de presupuesto ya existe. Ingresa uno diferente.")
      return
    }
    if (!formData.clientName || formData.items.length === 0) {
      alert("Ingresa los datos del cliente y al menos un producto")
      return
    }

    const newBudget: Budget = {
      id: crypto.randomUUID(),
      ...formData,
      total: calculateTotal(formData.items),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    addBudget(newBudget)
    const updatedBudgets = getBudgets()
    setBudgets(updatedBudgets)

    const updatedSequence = computeNextSequenceValue(normalizedBudgetNumber, nextSequence)
    setBudgetSequence(updatedSequence)
    setNextSequence(updatedSequence)

    resetForm(true, updatedSequence)
  }

  const resetForm = (shouldClose = true, sequenceOverride?: number) => {
    const sequenceToUse = sequenceOverride ?? nextSequence
    setFormData({
      budgetNumber: formatBudgetNumber(sequenceToUse),
      clientName: "",
      clientEmail: "",
      validUntil: new Date().toISOString().split("T")[0],
      status: "borrador",
      notes: "",
      items: [],
    })
    setCurrentItem({ 
      productId: "", 
      quantity: 1, 
      baseUnitPrice: 0,
      marginPercentage: settings.generalMargin,
      unitPrice: 0,
    })
    if (shouldClose) {
      setIsDialogOpen(false)
    }
  }

  const handleProductChange = (productId: string) => {
    const product = products.find((p) => p.id === productId)
    if (product) {
      const pricing = calculateFinalProductPrice(
        product,
        families,
        settings
      )
      setCurrentItem({
        ...currentItem,
        productId,
        baseUnitPrice: pricing.basePrice,
        marginPercentage: pricing.marginPercentage,
        unitPrice: pricing.finalPrice,
      })
    }
  }

  const handleStatusChange = (budgetId: string, status: BudgetStatus) => {
    updateBudgetStatus(budgetId, status)
    setBudgets(getBudgets())
  }

  const handleDelete = (budgetId: string) => {
    if (confirm("¿Eliminar este presupuesto?")) {
      deleteBudget(budgetId)
      setBudgets(getBudgets())
    }
  }


  const handleDownloadPdf = (budget: Budget) => {
    const doc = new jsPDF()

    // Add header
    doc.setFontSize(20)
    doc.text("Presupuesto", 14, 22)
    doc.setFontSize(12)
    doc.text(`Presupuesto #: ${budget.budgetNumber}`, 14, 32)
    doc.text(`Fecha: ${new Date(budget.createdAt).toLocaleDateString("es-CL")}`, 14, 42)
    doc.text(`Válido hasta: ${new Date(budget.validUntil).toLocaleDateString("es-CL")}`, 120, 42)

    // Add client details
    doc.setFontSize(14)
    doc.text("Cliente:", 14, 60)
    doc.setFontSize(12)
    doc.text(budget.clientName, 14, 70)
    doc.text(budget.clientEmail, 14, 80)

    // Add table with margin information
    const tableColumn = ["Producto", "Cantidad", "Precio Base", "Margen %", "Precio Final", "Subtotal"];
    const tableRows: (string | number)[][] = [];

    budget.items.forEach(item => {
      const itemData = [
        item.productName,
        item.quantity,
        `$${item.baseUnitPrice.toLocaleString("es-CL")}`,
        `${item.marginPercentage}%`,
        `$${item.unitPrice.toLocaleString("es-CL")}`,
        `$${item.subtotal.toLocaleString("es-CL")}`
      ];
      tableRows.push(itemData);
    });

    autoTable(doc, { 
      startY: 90,
      head: [tableColumn],
      body: tableRows,
    });

    // Add total
    const finalY = (doc as any).lastAutoTable.finalY;
    doc.setFontSize(14)
    doc.text("Total:", 14, finalY + 10)
    doc.text(`$${budget.total.toLocaleString("es-CL")}`, 150, finalY + 10)

    // Add notes
    if (budget.notes) {
      doc.setFontSize(12)
      doc.text("Notas:", 14, finalY + 30)
      doc.text(budget.notes, 14, finalY + 40)
    }

    doc.save(`${budget.budgetNumber}.pdf`);
  };

  const totalBudgets = budgets.length
  const approvedBudgets = budgets.filter((budget) => budget.status === "aprobado").length
  const pendingTotal = budgets.filter((budget) => budget.status !== "aprobado").reduce((acc, budget) => acc + budget.total, 0)

  return (
    <div className="flex flex-col">
      <Header title="Presupuestos" />
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Presupuestos</CardTitle>
              <FileSignature className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalBudgets}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Aprobados</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{approvedBudgets}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Valor Pendiente</CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${pendingTotal.toLocaleString("es-CL")}</div>
            </CardContent>
          </Card>
        </div>

          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 w-full">
            <Input
              placeholder="Buscar por cliente o código"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="flex-1"
            />
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as "all" | BudgetStatus)}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="borrador">Borrador</SelectItem>
                <SelectItem value="enviado">Enviado</SelectItem>
                <SelectItem value="aprobado">Aprobado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => resetForm(false)}>
                  <Plus className="mr-2 h-4 w-4" /> Nuevo Presupuesto
                </Button>
              </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Crear Presupuesto</DialogTitle>
              </DialogHeader>
              <form id="budget-form" onSubmit={handleSubmit} className="space-y-4 p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="budgetNumber">Presupuesto #</Label>
                    <Input
                      id="budgetNumber"
                      required
                      value={formData.budgetNumber}
                      onChange={(event) => setFormData({ ...formData, budgetNumber: event.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="validUntil">Válido hasta</Label>
                    <Input
                      id="validUntil"
                      type="date"
                      value={formData.validUntil}
                      onChange={(event) => setFormData({ ...formData, validUntil: event.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="clientName">Cliente</Label>
                    <Input
                      id="clientName"
                      required
                      value={formData.clientName}
                      onChange={(event) => setFormData({ ...formData, clientName: event.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="clientEmail">Email</Label>
                    <Input
                      id="clientEmail"
                      type="email"
                      value={formData.clientEmail}
                      onChange={(event) => setFormData({ ...formData, clientEmail: event.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Estado</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => setFormData({ ...formData, status: value as BudgetStatus })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="borrador">Borrador</SelectItem>
                        <SelectItem value="enviado">Enviado</SelectItem>
                        <SelectItem value="aprobado">Aprobado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notas</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(event) => setFormData({ ...formData, notes: event.target.value })}
                      placeholder="Condiciones o detalles adicionales"
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
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground">Base: ${currentItem.baseUnitPrice.toLocaleString("es-CL")}</div>
                      <Input
                        type="number"
                        placeholder="Precio Final"
                        value={currentItem.unitPrice}
                        onChange={(event) =>
                          setCurrentItem({ ...currentItem, unitPrice: Number.parseFloat(event.target.value) || 0 })
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground">Margen: {currentItem.marginPercentage}%</div>
                      <Input
                        type="number"
                        placeholder="Margen %"
                        value={currentItem.marginPercentage}
                        onChange={(event) => {
                          const newMargin = Number.parseFloat(event.target.value) || 0
                          const newUnitPrice = currentItem.baseUnitPrice * (1 + newMargin / 100)
                          setCurrentItem({ 
                            ...currentItem, 
                            marginPercentage: newMargin,
                            unitPrice: newUnitPrice
                          })
                        }}
                      />
                    </div>
                  </div>

                  {formData.items.length > 0 && (
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Producto</TableHead>
                            <TableHead className="text-right">Cant.</TableHead>
                            <TableHead className="text-right">Precio Base</TableHead>
                            <TableHead className="text-right">Margen %</TableHead>
                            <TableHead className="text-right">Precio Final</TableHead>
                            <TableHead className="text-right">Subtotal</TableHead>
                            <TableHead className="w-12" />
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {formData.items.map((item, index) => (
                            <TableRow key={`${item.productId}-${index}`}>
                              <TableCell>{item.productName}</TableCell>
                              <TableCell className="text-right">{item.quantity}</TableCell>
                              <TableCell className="text-right">${item.baseUnitPrice.toLocaleString("es-CL")}</TableCell>
                              <TableCell className="text-right">{item.marginPercentage}%</TableCell>
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
                            <TableCell colSpan={5} className="text-right font-semibold">
                              Total
                            </TableCell>
                            <TableCell className="text-right font-semibold">
                              ${calculateTotal(formData.items).toLocaleString("es-CL")}
                            </TableCell>
                            <TableCell />
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              </form>
              <div className="flex justify-end gap-2 p-6 border-t">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" form="budget-form">
                  Guardar Presupuesto
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Presupuesto #</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Vence</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-center">Productos</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBudgets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                      No hay presupuestos con este criterio
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredBudgets
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .map((budget) => (
                      <TableRow key={budget.id}>
                        <TableCell className="font-mono">{budget.budgetNumber}</TableCell>
                        <TableCell>{budget.clientName}</TableCell>
                        <TableCell>{new Date(budget.validUntil).toLocaleDateString("es-CL")}</TableCell>
                        <TableCell>
                          <Badge variant={statusVariants[budget.status]}>{statusLabels[budget.status]}</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary">{budget.items.length}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          ${budget.total.toLocaleString("es-CL")}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            <Select value={budget.status} onValueChange={(value) => handleStatusChange(budget.id, value as BudgetStatus)}>
                              <SelectTrigger className="w-[130px] text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="borrador">Borrador</SelectItem>
                                <SelectItem value="enviado">Enviado</SelectItem>
                                <SelectItem value="aprobado">Aprobado</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button variant="ghost" size="icon" onClick={() => handleDownloadPdf(budget)}>
                              <span className="inline-flex h-6 w-10 items-center justify-center rounded bg-red-500 text-[10px] font-bold uppercase tracking-wide text-white">
                                PDF
                              </span>
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(budget.id)}>
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
