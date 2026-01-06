"use client"

import { useEffect, useState } from "react"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DollarSign, Lock, Unlock } from "lucide-react"
import { getCashRegisterStatus, openCashRegister, closeCashRegister, getCashRegisters } from "@/lib/storage"
import type { CashRegister } from "@/lib/types"

export default function CajaPage() {
  const [cashRegister, setCashRegister] = useState<CashRegister | null>(null)
  const [isOpenDialogOpen, setIsOpenDialogOpen] = useState(false)
  const [isCloseDialogOpen, setIsCloseDialogOpen] = useState(false)
  const [openingAmount, setOpeningAmount] = useState(0)
  const [closingAmount, setClosingAmount] = useState(0)
  const [allRegisters, setAllRegisters] = useState<CashRegister[]>([])

  const loadData = () => {
    const { register } = getCashRegisterStatus()
    setCashRegister(register)
    setAllRegisters(getCashRegisters())
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleOpenCashRegister = () => {
    const register = openCashRegister(openingAmount)
    loadData()
    setIsOpenDialogOpen(false)
    setOpeningAmount(0)
  }

  const handleCloseCashRegister = () => {
    if (cashRegister) {
      closeCashRegister(cashRegister.id, closingAmount)
      setTimeout(() => {
        loadData()
      }, 100)
      setIsCloseDialogOpen(false)
      setClosingAmount(0)
    }
  }

  const getCashSales = () => {
    if (!cashRegister) return 0
    return cashRegister.sales.filter((s) => s.paymentMethod === "cash").reduce((acc, s) => acc + s.total, 0)
  }

  const getExpectedClosing = () => {
    if (!cashRegister) return 0
    return cashRegister.openingAmount + getCashSales()
  }

  return (
    <div className="flex flex-col">
      <Header title="Caja Diaria" />
      <div className="p-6 space-y-6">
        {/* Cash Register Status */}
        {!cashRegister || cashRegister.status === "closed" ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Lock className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Caja Cerrada</h3>
              <p className="text-muted-foreground mb-4">Abre la caja para comenzar a registrar ventas</p>
              <Dialog open={isOpenDialogOpen} onOpenChange={setIsOpenDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Unlock className="h-4 w-4 mr-2" />
                    Abrir Caja
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Abrir Caja</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="openingAmount">Monto de Apertura (Efectivo Inicial)</Label>
                      <Input
                        id="openingAmount"
                        type="number"
                        step="1"
                        onChange={(e) => setOpeningAmount(Number.parseFloat(e.target.value) || 0)}
                        placeholder="0"
                      />
                      <p className="text-sm text-muted-foreground">
                        Ingresa el monto en efectivo con el que inicias el día
                      </p>
                    </div>
                    <Button onClick={handleOpenCashRegister} className="w-full">
                      Confirmar Apertura
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Apertura</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${cashRegister.openingAmount.toLocaleString("es-CL")}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Ventas en Efectivo</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${getCashSales().toLocaleString("es-CL")}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Efectivo Esperado</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-accent">${getExpectedClosing().toLocaleString("es-CL")}</div>
                </CardContent>
              </Card>
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <Badge variant="outline" className="px-4 py-2 text-base">
                <Unlock className="h-4 w-4 mr-2 text-accent" />
                Caja Abierta
              </Badge>
              <Dialog open={isCloseDialogOpen} onOpenChange={setIsCloseDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Lock className="h-4 w-4 mr-2" />
                    Cerrar Caja
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Cerrar Caja</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="p-4 bg-muted rounded-lg space-y-2">
                      <p className="flex justify-between">
                        <span className="text-muted-foreground">Apertura:</span>
                        <span className="font-medium">${cashRegister.openingAmount.toLocaleString("es-CL")}</span>
                      </p>
                      <p className="flex justify-between">
                        <span className="text-muted-foreground">Ventas en Efectivo:</span>
                        <span className="font-medium">${getCashSales().toLocaleString("es-CL")}</span>
                      </p>
                      <p className="flex justify-between border-t pt-2">
                        <span className="font-medium">Efectivo Esperado:</span>
                        <span className="font-bold text-accent">${getExpectedClosing().toLocaleString("es-CL")}</span>
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="closingAmount">Monto de Cierre (Efectivo Real en Caja)</Label>
                      <Input
                        id="closingAmount"
                        type="number"
                        step="1"
                        onChange={(e) => setClosingAmount(Number.parseFloat(e.target.value) || 0)}
                        placeholder="0"
                      />
                    </div>
                    {closingAmount !== getExpectedClosing() && closingAmount > 0 && (
                      <div
                        className={`p-3 rounded-lg ${closingAmount > getExpectedClosing() ? "bg-accent/10" : "bg-destructive/10"}`}
                      >
                        <p
                          className={`text-sm font-medium ${closingAmount > getExpectedClosing() ? "text-accent" : "text-destructive"}`}
                        >
                          Diferencia: ${(closingAmount - getExpectedClosing()).toLocaleString("es-CL")}
                          {closingAmount > getExpectedClosing() ? " (Sobrante)" : " (Faltante)"}
                        </p>
                      </div>
                    )}
                    <Button onClick={handleCloseCashRegister} className="w-full">
                      Confirmar Cierre
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </>
        )}

        {/* Historical Registers */}
        <Card>
          <CardHeader>
            <CardTitle>Historial de Cajas</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha y Hora</TableHead>
                  <TableHead className="text-right">Apertura</TableHead>
                  <TableHead className="text-right">Cierre</TableHead>
                  <TableHead className="text-right">Ventas</TableHead>
                  <TableHead className="text-right">Diferencia</TableHead>
                  <TableHead className="text-center">Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allRegisters.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No hay registros de caja
                    </TableCell>
                  </TableRow>
                ) : (
                  allRegisters
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .slice(0, 10)
                    .map((register) => {
                      const cashSales = register.sales
                        .filter((s) => s.paymentMethod === "cash")
                        .reduce((acc, s) => acc + s.total, 0)
                      const expected = register.openingAmount + cashSales
                      const diff = register.closingAmount !== null ? register.closingAmount - expected : 0
                      return (
                        <TableRow key={register.id}>
                          <TableCell>
                            {new Date(register.createdAt).toLocaleString("es-CL", {
                              dateStyle: "short",
                              timeStyle: "short",
                            })} - 
                            {register.closedAt ? new Date(register.closedAt).toLocaleTimeString("es-CL", { timeStyle: "short" }) : "-"}
                          </TableCell>
                          <TableCell className="text-right">
                            ${register.openingAmount.toLocaleString("es-CL")}
                          </TableCell>
                          <TableCell className="text-right">
                            {register.closingAmount !== null
                              ? `$${register.closingAmount.toLocaleString("es-CL")}`
                              : "-"}
                          </TableCell>
                          <TableCell className="text-right">
                            ${register.sales.reduce((acc, s) => acc + s.total, 0).toLocaleString("es-CL")}
                          </TableCell>
                          <TableCell
                            className={`text-right ${diff > 0 ? "text-accent" : diff < 0 ? "text-destructive" : ""}`}
                          >
                            {register.closingAmount !== null ? `$${diff.toLocaleString("es-CL")}` : "-"}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant={register.status === "open" ? "default" : "secondary"}>
                              {register.status === "open" ? "Abierta" : "Cerrada"}
                            </Badge>
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
