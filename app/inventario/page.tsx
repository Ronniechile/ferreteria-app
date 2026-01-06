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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Pencil, Trash2, Package, AlertTriangle, DollarSign, Calculator, Save } from "lucide-react"
import {
  getProducts,
  getFamilies,
  addProduct,
  updateProduct,
  deleteProduct,
  getSettings,
  saveSettings,
  saveFamilies,
  saveProducts,
} from "@/lib/storage"
import type { Product, Family, AppSettings } from "@/lib/types"

export default function InventarioPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [families, setFamilies] = useState<Family[]>([])
  const [search, setSearch] = useState("")
  const [familyFilter, setFamilyFilter] = useState<string>("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [generalMargin, setGeneralMargin] = useState<number | null>(null)
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    description: "",
    familyId: "",
    unit: "unidad",
    costPrice: 0,
    salePrice: 0,
    stock: 0,
    minStock: 5,
  })

  useEffect(() => {
    setProducts(getProducts())
    setFamilies(getFamilies())
    setSettings(getSettings())
  }, [])

  useEffect(() => {
    if (settings) {
      setGeneralMargin(settings.generalMargin)
    }
  }, [settings])

  const calculateSalePrice = (cost: number, familyId?: string) => {
    if (!settings) return 0

    const family = families.find((f) => f.id === familyId)
    const margin = family ? family.margin : settings.generalMargin
    const salePrice = cost * (1 + margin / 100)
    return Math.round(salePrice)
  }

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) || p.code.toLowerCase().includes(search.toLowerCase())
    const matchesFamily = familyFilter === "all" || p.familyId === familyFilter
    return matchesSearch && matchesFamily
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingProduct) {
      const updated: Product = {
        ...editingProduct,
        ...formData,
        updatedAt: new Date().toISOString(),
      }
      updateProduct(updated)
    } else {
      const newProduct: Product = {
        id: crypto.randomUUID(),
        ...formData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      addProduct(newProduct)
    }
    setProducts(getProducts())
    resetForm()
  }

  const resetForm = () => {
    setFormData({
      code: "",
      name: "",
      description: "",
      familyId: "",
      unit: "unidad",
      costPrice: 0,
      salePrice: 0,
      stock: 0,
      minStock: 5,
    })
    setEditingProduct(null)
    setIsDialogOpen(false)
  }

  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    setFormData({
      code: product.code,
      name: product.name,
      description: product.description,
      familyId: product.familyId,
      unit: product.unit,
      costPrice: product.costPrice,
      salePrice: product.salePrice,
      stock: product.stock,
      minStock: product.minStock,
    })
    setIsDialogOpen(true)
  }

  const handleDelete = (id: string) => {
    if (confirm("¿Está seguro de eliminar este producto?")) {
      deleteProduct(id)
      setProducts(getProducts())
    }
  }

  const getFamilyName = (familyId: string) => {
    return families.find((f) => f.id === familyId)?.name || "Sin familia"
  }

  const handleSaveGeneralMargin = () => {
    if (generalMargin === null || Number.isNaN(generalMargin) || generalMargin < 0) {
      alert("El margen general debe ser un número válido mayor o igual a 0")
      return
    }
    if (!settings) return

    const updatedSettings = { ...settings, generalMargin }
    saveSettings(updatedSettings)
    setSettings(updatedSettings)
    alert("Margen general guardado correctamente")
  }

  const handleFamilyMarginChange = (familyId: string, margin: number) => {
    setFamilies((prev) => prev.map((family) => (family.id === familyId ? { ...family, margin } : family)))
  }

  const handleSaveFamilyMargins = () => {
    const hasInvalid = families.some((family) => Number.isNaN(family.margin) || family.margin < 0)
    if (hasInvalid) {
      alert("Todos los márgenes deben ser números válidos mayores o iguales a 0")
      return
    }
    saveFamilies(families)
    alert("Márgenes por familia guardados correctamente")
  }

  const applyMarginToFamily = (familyId: string) => {
    const family = families.find((f) => f.id === familyId)
    if (!family) return

    const updatedProducts = products.map((product) => {
      if (product.familyId === familyId && product.costPrice > 0) {
        const salePrice = product.costPrice * (1 + family.margin / 100)
        return {
          ...product,
          salePrice,
          updatedAt: new Date().toISOString(),
        }
      }
      return product
    })

    saveProducts(updatedProducts)
    setProducts(updatedProducts)
    alert(`Precios actualizados para ${family.name}`)
  }

  const applyGeneralMargin = () => {
    if (generalMargin === null || Number.isNaN(generalMargin)) {
      alert("Debes definir un margen general válido")
      return
    }
    const updatedProducts = products.map((product) => {
      if (product.costPrice > 0) {
        const salePrice = product.costPrice * (1 + generalMargin / 100)
        return {
          ...product,
          salePrice,
          updatedAt: new Date().toISOString(),
        }
      }
      return product
    })
    saveProducts(updatedProducts)
    setProducts(updatedProducts)
    alert("Margen general aplicado a todos los productos")
  }

  const getProductCount = (familyId: string) => products.filter((product) => product.familyId === familyId).length

  const getAverageMargin = (familyId: string) => {
    const familyProducts = products.filter((product) => product.familyId === familyId)
    if (familyProducts.length === 0) return 0
    const totalMargin = familyProducts.reduce((acc, product) => {
      if (product.costPrice > 0) {
        return acc + ((product.salePrice - product.costPrice) / product.costPrice) * 100
      }
      return acc
    }, 0)
    return totalMargin / familyProducts.length
  }

  const lowStockCount = products.filter((p) => p.stock <= p.minStock).length
  const totalValue = products.reduce((acc, p) => acc + p.costPrice * p.stock, 0)

  return (
    <div className="flex flex-col">
      <Header title="Inventario" />
      <div className="p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Productos</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{products.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Valor del Inventario</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${totalValue.toLocaleString("es-ES", { minimumFractionDigits: 2 })}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Familias</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{families.length}</div>
            </CardContent>
          </Card>
          <Card className={lowStockCount > 0 ? "border-destructive" : ""}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Stock Bajo</CardTitle>
              <AlertTriangle
                className={`h-4 w-4 ${lowStockCount > 0 ? "text-destructive" : "text-muted-foreground"}`}
              />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${lowStockCount > 0 ? "text-destructive" : ""}`}>{lowStockCount}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Actions */}
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex flex-col md:flex-row gap-4 flex-1">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o código..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={familyFilter} onValueChange={setFamilyFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filtrar por familia" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las familias</SelectItem>
                {families.map((family) => (
                  <SelectItem key={family.id} value={family.id}>
                    {family.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()}>
                <Plus className="h-4 w-4 mr-2" />
                Agregar Producto
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingProduct ? "Editar Producto" : "Nuevo Producto"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="code">Código</Label>
                    <Input
                      id="code"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name">Nombre</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Descripción</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="family">Familia</Label>
                    <Select
                      value={formData.familyId}
                      onValueChange={(value) => setFormData({ ...formData, familyId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar familia" />
                      </SelectTrigger>
                      <SelectContent>
                        {families.map((family) => (
                          <SelectItem key={family.id} value={family.id}>
                            {family.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unit">Unidad</Label>
                    <Select value={formData.unit} onValueChange={(value) => setFormData({ ...formData, unit: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unidad">Unidad</SelectItem>
                        <SelectItem value="kg">Kilogramo</SelectItem>
                        <SelectItem value="metro">Metro</SelectItem>
                        <SelectItem value="litro">Litro</SelectItem>
                        <SelectItem value="caja">Caja</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="costPrice">Precio de Costo</Label>
                    <Input
                      id="costPrice"
                      type="number"
                      step="0.01"
                      value={formData.costPrice}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          costPrice: Number.parseFloat(e.target.value) || 0,
                        })
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          const newSalePrice = calculateSalePrice(formData.costPrice, formData.familyId)
                          setFormData({ ...formData, salePrice: newSalePrice })
                        }
                      }}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="salePrice">Precio de Venta</Label>
                    <Input
                      id="salePrice"
                      type="number"
                      step="0.01"
                      value={formData.salePrice}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          salePrice: Number.parseFloat(e.target.value) || 0,
                        })
                      }
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="stock">Stock Actual</Label>
                    <Input
                      id="stock"
                      type="number"
                      value={formData.stock}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          stock: Number.parseInt(e.target.value) || 0,
                        })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="minStock">Stock Mínimo</Label>
                    <Input
                      id="minStock"
                      type="number"
                      value={formData.minStock}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          minStock: Number.parseInt(e.target.value) || 0,
                        })
                      }
                      required
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">{editingProduct ? "Guardar Cambios" : "Agregar Producto"}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Margin Management */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" /> Margen General
              </CardTitle>
              <CardDescription>Define el margen de ganancia base que se aplica a todos los productos.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-end gap-4">
                <div className="space-y-2">
                  <Label htmlFor="generalMargin">Margen (%)</Label>
                  <Input
                    id="generalMargin"
                    type="number"
                    className="w-32"
                    value={generalMargin ?? ""}
                    onChange={(e) => setGeneralMargin(Number.parseFloat(e.target.value))}
                  />
                </div>
                <Button onClick={handleSaveGeneralMargin}>
                  <Save className="mr-2 h-4 w-4" /> Guardar
                </Button>
                <Button variant="outline" onClick={applyGeneralMargin}>
                  <Calculator className="mr-2 h-4 w-4" /> Aplicar a todos
                </Button>
              </div>
              {generalMargin !== null && !Number.isNaN(generalMargin) && (
                <p className="text-sm text-muted-foreground">
                  Ejemplo: con un costo de $100 y margen de {generalMargin}%, el precio sería $
                  {(100 * (1 + generalMargin / 100)).toFixed(2)}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" /> Márgenes por familia
              </CardTitle>
              <CardDescription>Ajusta márgenes específicos por familia y aplica los cambios al inventario.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 overflow-auto">
              <div className="max-h-80 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Familia</TableHead>
                      <TableHead className="text-center">Productos</TableHead>
                      <TableHead className="text-center">Margen promedio</TableHead>
                      <TableHead className="text-center">Nuevo margen (%)</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {families.map((family) => (
                      <TableRow key={family.id}>
                        <TableCell className="font-medium">{family.name}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary">{getProductCount(family.id)}</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={getAverageMargin(family.id) >= family.margin ? "default" : "destructive"}>
                            {getAverageMargin(family.id).toFixed(1)}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Input
                            type="number"
                            className="mx-auto w-24"
                            value={family.margin}
                            onChange={(e) => handleFamilyMarginChange(family.id, Number.parseFloat(e.target.value))}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm" onClick={() => applyMarginToFamily(family.id)}>
                            Aplicar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="flex justify-end">
                <Button onClick={handleSaveFamilyMargins}>
                  <Save className="mr-2 h-4 w-4" /> Guardar márgenes
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Products Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Familia</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead className="text-right">Costo</TableHead>
                  <TableHead className="text-right">Venta</TableHead>
                  <TableHead className="text-right">Margen</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No hay productos registrados
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map((product) => {
                    const margin =
                      product.costPrice > 0 ? ((product.salePrice - product.costPrice) / product.costPrice) * 100 : 0
                    return (
                      <TableRow key={product.id}>
                        <TableCell className="font-mono text-sm">{product.code}</TableCell>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{getFamilyName(product.familyId)}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={product.stock <= product.minStock ? "destructive" : "default"}>
                            {product.stock} {product.unit}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">${product.costPrice.toFixed(2)}</TableCell>
                        <TableCell className="text-right">${product.salePrice.toFixed(2)}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant={margin >= 20 ? "default" : "destructive"}>{margin.toFixed(1)}%</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(product)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(product.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
