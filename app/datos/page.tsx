"use client"

import type React from "react"

import { useEffect, useState, useRef } from "react"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Download, Upload, FileSpreadsheet, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getProducts, saveProducts, getSales, getFamilies, getPurchases, getCashRegisters } from "@/lib/storage"
import type { Product } from "@/lib/types"
import * as XLSX from "xlsx"

export default function DatosPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [importStatus, setImportStatus] = useState<{
    type: "success" | "error" | null
    message: string
  }>({ type: null, message: "" })
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setProducts(getProducts())
  }, [])

  const exportInventory = () => {
    const families = getFamilies()
    const data = products.map((p) => ({
      Código: p.code,
      Nombre: p.name,
      Descripción: p.description,
      Familia: families.find((f) => f.id === p.familyId)?.name || "",
      Unidad: p.unit,
      "Precio Costo": p.costPrice,
      "Precio Venta": p.salePrice,
      Stock: p.stock,
      "Stock Mínimo": p.minStock,
    }))

    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Inventario")

    // Auto-size columns
    const colWidths = Object.keys(data[0] || {}).map((key) => ({
      wch: Math.max(key.length, 15),
    }))
    ws["!cols"] = colWidths

    XLSX.writeFile(wb, `inventario_${new Date().toISOString().split("T")[0]}.xlsx`)
  }

  const exportSales = () => {
    const sales = getSales()
    const data = sales.flatMap((sale) =>
      sale.items.map((item) => ({
        Fecha: new Date(sale.createdAt).toLocaleDateString("es-ES"),
        Hora: new Date(sale.createdAt).toLocaleTimeString("es-ES"),
        Producto: item.productName,
        Cantidad: item.quantity,
        "Precio Unitario": item.unitPrice,
        Subtotal: item.subtotal,
        "Método de Pago":
          sale.paymentMethod === "cash" ? "Efectivo" : sale.paymentMethod === "card" ? "Tarjeta" : "Transferencia",
        Descuento: sale.discount,
        "Total Venta": sale.total,
      })),
    )

    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Ventas")

    XLSX.writeFile(wb, `ventas_${new Date().toISOString().split("T")[0]}.xlsx`)
  }

  const exportPurchases = () => {
    const purchases = getPurchases()
    const data = purchases.flatMap((purchase) =>
      purchase.items.map((item) => ({
        "Factura #": purchase.invoiceNumber,
        Proveedor: purchase.supplier,
        Fecha: new Date(purchase.date).toLocaleDateString("es-ES"),
        Producto: item.productName,
        Cantidad: item.quantity,
        "Precio Unitario": item.unitPrice,
        Subtotal: item.subtotal,
        "Total Factura": purchase.total,
      })),
    )

    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Compras")

    XLSX.writeFile(wb, `compras_${new Date().toISOString().split("T")[0]}.xlsx`)
  }

  const exportCashRegisters = () => {
    const registers = getCashRegisters()
    const data = registers.map((r) => ({
      Fecha: new Date(r.date).toLocaleDateString("es-ES"),
      "Monto Apertura": r.openingAmount,
      "Monto Cierre": r.closingAmount || 0,
      "Total Ventas": r.sales.reduce((acc, s) => acc + s.total, 0),
      "Cantidad Ventas": r.sales.length,
      Estado: r.status === "open" ? "Abierta" : "Cerrada",
    }))

    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Cajas")

    XLSX.writeFile(wb, `cajas_${new Date().toISOString().split("T")[0]}.xlsx`)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: "array" })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as Record<string, unknown>[]

        const families = getFamilies()
        const existingProducts = getProducts()
        let imported = 0
        let updated = 0

        const newProducts: Product[] = jsonData.map((row) => {
          const code = String(row["Código"] || row["codigo"] || row["CODIGO"] || "")
          const existingProduct = existingProducts.find((p) => p.code === code)
          const familyName = String(row["Familia"] || row["familia"] || row["FAMILIA"] || "")
          const family = families.find((f) => f.name.toLowerCase() === familyName.toLowerCase())

          if (existingProduct) {
            updated++
            return {
              ...existingProduct,
              name: String(row["Nombre"] || row["nombre"] || row["NOMBRE"] || existingProduct.name),
              description: String(
                row["Descripción"] || row["descripcion"] || row["DESCRIPCION"] || existingProduct.description,
              ),
              familyId: family?.id || existingProduct.familyId,
              unit: String(row["Unidad"] || row["unidad"] || row["UNIDAD"] || existingProduct.unit),
              costPrice: Number(
                row["Precio Costo"] || row["precio_costo"] || row["PRECIO_COSTO"] || existingProduct.costPrice,
              ),
              salePrice: Number(
                row["Precio Venta"] || row["precio_venta"] || row["PRECIO_VENTA"] || existingProduct.salePrice,
              ),
              stock: Number(row["Stock"] || row["stock"] || row["STOCK"] || existingProduct.stock),
              minStock: Number(
                row["Stock Mínimo"] || row["stock_minimo"] || row["STOCK_MINIMO"] || existingProduct.minStock,
              ),
              updatedAt: new Date().toISOString(),
            }
          } else {
            imported++
            return {
              id: crypto.randomUUID(),
              code,
              name: String(row["Nombre"] || row["nombre"] || row["NOMBRE"] || ""),
              description: String(row["Descripción"] || row["descripcion"] || row["DESCRIPCION"] || ""),
              familyId: family?.id || "",
              unit: String(row["Unidad"] || row["unidad"] || row["UNIDAD"] || "unidad"),
              costPrice: Number(row["Precio Costo"] || row["precio_costo"] || row["PRECIO_COSTO"] || 0),
              salePrice: Number(row["Precio Venta"] || row["precio_venta"] || row["PRECIO_VENTA"] || 0),
              stock: Number(row["Stock"] || row["stock"] || row["STOCK"] || 0),
              minStock: Number(row["Stock Mínimo"] || row["stock_minimo"] || row["STOCK_MINIMO"] || 5),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }
          }
        })

        // Merge: keep products not in file, update those in file
        const productCodes = newProducts.map((p) => p.code)
        const unchangedProducts = existingProducts.filter((p) => !productCodes.includes(p.code))
        const allProducts = [...unchangedProducts, ...newProducts]

        saveProducts(allProducts)
        setProducts(allProducts)
        setImportStatus({
          type: "success",
          message: `Importación completada: ${imported} productos nuevos, ${updated} productos actualizados.`,
        })
      } catch (error) {
        setImportStatus({
          type: "error",
          message: "Error al procesar el archivo. Verifica el formato.",
        })
      }
    }
    reader.readAsArrayBuffer(file)

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const downloadTemplate = () => {
    const template = [
      {
        Código: "HM-001",
        Nombre: "Martillo de Carpintero",
        Descripción: "Martillo 16oz con mango de madera",
        Familia: "Herramientas Manuales",
        Unidad: "unidad",
        "Precio Costo": 15.0,
        "Precio Venta": 22.5,
        Stock: 25,
        "Stock Mínimo": 5,
      },
    ]

    const ws = XLSX.utils.json_to_sheet(template)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Plantilla")

    XLSX.writeFile(wb, "plantilla_inventario.xlsx")
  }

  return (
    <div className="flex flex-col">
      <Header title="Importar / Exportar Datos" />
      <div className="p-6 space-y-6">
        {importStatus.type && (
          <Alert variant={importStatus.type === "error" ? "destructive" : "default"}>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{importStatus.message}</AlertDescription>
          </Alert>
        )}

        {/* Import Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Importar Inventario
            </CardTitle>
            <CardDescription>
              Sube un archivo Excel con los productos para importar o actualizar el inventario.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor="file">Archivo Excel (.xlsx)</Label>
                <Input
                  id="file"
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileUpload}
                  ref={fileInputRef}
                  className="mt-2"
                />
              </div>
            </div>
            <div className="flex gap-4">
              <Button variant="outline" onClick={downloadTemplate}>
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Descargar Plantilla
              </Button>
            </div>
            <div className="text-sm text-muted-foreground">
              <p>
                <strong>Columnas requeridas:</strong> Código, Nombre, Precio Costo, Precio Venta, Stock
              </p>
              <p>
                <strong>Columnas opcionales:</strong> Descripción, Familia, Unidad, Stock Mínimo
              </p>
              <p className="mt-2">
                Los productos se actualizarán si el código ya existe, o se crearán nuevos si no existe.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Export Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Exportar Datos
            </CardTitle>
            <CardDescription>Descarga los datos del sistema en formato Excel.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button onClick={exportInventory} className="flex gap-2">
                <FileSpreadsheet className="h-4 w-4" />
                Inventario ({products.length})
              </Button>
              <Button onClick={exportSales} variant="outline" className="flex gap-2 bg-transparent">
                <FileSpreadsheet className="h-4 w-4" />
                Ventas
              </Button>
              <Button onClick={exportPurchases} variant="outline" className="flex gap-2 bg-transparent">
                <FileSpreadsheet className="h-4 w-4" />
                Compras
              </Button>
              <Button onClick={exportCashRegisters} variant="outline" className="flex gap-2 bg-transparent">
                <FileSpreadsheet className="h-4 w-4" />
                Historial de Cajas
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
