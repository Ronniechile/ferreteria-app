"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { getFamilies, getProducts, addFamily, updateFamily, deleteFamily } from "@/lib/storage"
import type { Family, Product } from "@/lib/types"

export default function FamiliasPage() {
  const [families, setFamilies] = useState<Family[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingFamily, setEditingFamily] = useState<Family | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    margin: 20,
    description: "",
  })

  useEffect(() => {
    setFamilies(getFamilies())
    setProducts(getProducts())
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingFamily) {
      updateFamily({ ...editingFamily, ...formData })
    } else {
      addFamily({
        id: crypto.randomUUID(),
        ...formData,
      })
    }
    setFamilies(getFamilies())
    resetForm()
  }

  const resetForm = () => {
    setFormData({ name: "", margin: 20, description: "" })
    setEditingFamily(null)
    setIsDialogOpen(false)
  }

  const handleEdit = (family: Family) => {
    setEditingFamily(family)
    setFormData({
      name: family.name,
      margin: family.margin,
      description: family.description,
    })
    setIsDialogOpen(true)
  }

  const handleDelete = (id: string) => {
    const productsInFamily = products.filter((p) => p.familyId === id)
    if (productsInFamily.length > 0) {
      alert(`No se puede eliminar esta familia porque tiene ${productsInFamily.length} productos asociados.`)
      return
    }
    if (confirm("¿Está seguro de eliminar esta familia?")) {
      deleteFamily(id)
      setFamilies(getFamilies())
    }
  }

  const getProductCount = (familyId: string) => {
    return products.filter((p) => p.familyId === familyId).length
  }

  return (
    <div className="flex flex-col">
      <Header title="Familias de Productos" />
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <p className="text-muted-foreground">
            Administra las familias de productos y sus márgenes de ganancia predeterminados.
          </p>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()}>
                <Plus className="h-4 w-4 mr-2" />
                Nueva Familia
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingFamily ? "Editar Familia" : "Nueva Familia"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="margin">Margen de Ganancia (%)</Label>
                  <Input
                    id="margin"
                    type="number"
                    value={formData.margin}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        margin: Number.parseFloat(e.target.value) || 0,
                      })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Descripción</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">{editingFamily ? "Guardar Cambios" : "Crear Familia"}</Button>
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
                  <TableHead>Nombre</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead className="text-center">Productos</TableHead>
                  <TableHead className="text-center">Margen</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {families.map((family) => (
                  <TableRow key={family.id}>
                    <TableCell className="font-medium">{family.name}</TableCell>
                    <TableCell className="text-muted-foreground">{family.description}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary">{getProductCount(family.id)}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge>{family.margin}%</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(family)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(family.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
