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
import { Plus, Pencil, Trash2, Search, Truck, AlertCircle } from "lucide-react"
import { getSuppliers, addSupplier, updateSupplier, deleteSupplier } from "@/lib/storage"
import { validateRut, formatRut, cleanRut } from "@/lib/rut-validator"
import type { Supplier } from "@/lib/types"

export default function ProveedoresPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [rutError, setRutError] = useState("")
  const [formData, setFormData] = useState({
    rut: "",
    name: "",
    contactName: "",
    phone: "",
    email: "",
    address: "",
  })

  useEffect(() => {
    setSuppliers(getSuppliers())
  }, [])

  const resetForm = () => {
    setFormData({
      rut: "",
      name: "",
      contactName: "",
      phone: "",
      email: "",
      address: "",
    })
    setRutError("")
    setEditingSupplier(null)
  }

  const handleRutChange = (value: string) => {
    const formatted = formatRut(value)
    setFormData({ ...formData, rut: formatted })

    if (value.length >= 8) {
      if (validateRut(value)) {
        setRutError("")
      } else {
        setRutError("RUT inválido")
      }
    } else {
      setRutError("")
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateRut(formData.rut)) {
      setRutError("RUT inválido")
      return
    }

    // Verificar RUT duplicado
    const cleanedRut = cleanRut(formData.rut)
    const existingSupplier = suppliers.find((s) => cleanRut(s.rut) === cleanedRut && s.id !== editingSupplier?.id)
    if (existingSupplier) {
      setRutError("Este RUT ya está registrado")
      return
    }

    if (editingSupplier) {
      const updated: Supplier = {
        ...editingSupplier,
        ...formData,
        rut: formatRut(formData.rut),
        updatedAt: new Date().toISOString(),
      }
      updateSupplier(updated)
    } else {
      const newSupplier: Supplier = {
        id: crypto.randomUUID(),
        ...formData,
        rut: formatRut(formData.rut),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      addSupplier(newSupplier)
    }

    setSuppliers(getSuppliers())
    setIsDialogOpen(false)
    resetForm()
  }

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier)
    setFormData({
      rut: supplier.rut,
      name: supplier.name,
      contactName: supplier.contactName,
      phone: supplier.phone,
      email: supplier.email,
      address: supplier.address,
    })
    setRutError("")
    setIsDialogOpen(true)
  }

  const handleDelete = (id: string) => {
    if (confirm("¿Estás seguro de eliminar este proveedor?")) {
      deleteSupplier(id)
      setSuppliers(getSuppliers())
    }
  }

  const filteredSuppliers = suppliers.filter(
    (supplier) =>
      supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.rut.includes(searchTerm) ||
      supplier.contactName.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="flex flex-col">
      <Header title="Proveedores" />
      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, RUT o contacto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Dialog
            open={isDialogOpen}
            onOpenChange={(open) => {
              setIsDialogOpen(open)
              if (!open) resetForm()
            }}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Proveedor
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingSupplier ? "Editar Proveedor" : "Nuevo Proveedor"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="rut">RUT *</Label>
                  <Input
                    id="rut"
                    placeholder="12.345.678-9"
                    value={formData.rut}
                    onChange={(e) => handleRutChange(e.target.value)}
                    className={rutError ? "border-destructive" : ""}
                  />
                  {rutError && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {rutError}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Razón Social *</Label>
                  <Input
                    id="name"
                    placeholder="Nombre de la empresa"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contactName">Nombre de Contacto</Label>
                    <Input
                      id="contactName"
                      placeholder="Nombre del contacto"
                      value={formData.contactName}
                      onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Teléfono</Label>
                    <Input
                      id="phone"
                      placeholder="+56 9 1234 5678"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="contacto@empresa.cl"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Dirección</Label>
                  <Input
                    id="address"
                    placeholder="Dirección completa"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsDialogOpen(false)
                      resetForm()
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit">{editingSupplier ? "Guardar Cambios" : "Crear Proveedor"}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {filteredSuppliers.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Truck className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No hay proveedores</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm
                  ? "No se encontraron proveedores con ese criterio"
                  : "Comienza agregando tu primer proveedor"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>RUT</TableHead>
                  <TableHead>Razón Social</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="w-24">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSuppliers.map((supplier) => (
                  <TableRow key={supplier.id}>
                    <TableCell className="font-mono">{supplier.rut}</TableCell>
                    <TableCell className="font-medium">{supplier.name}</TableCell>
                    <TableCell>{supplier.contactName || "-"}</TableCell>
                    <TableCell>{supplier.phone || "-"}</TableCell>
                    <TableCell>{supplier.email || "-"}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(supplier)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(supplier.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  )
}
