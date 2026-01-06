"use client"

import { useEffect, useState } from "react"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Save, Store, Trash2 } from "lucide-react"
import { getSettings, saveSettings } from "@/lib/storage"
import type { AppSettings } from "@/lib/types"

export default function ConfiguracionPage() {
  const [settings, setSettings] = useState<AppSettings>({
    generalMargin: 30,
    storeName: "",
    storeAddress: "",
    storePhone: "",
  })

  useEffect(() => {
    setSettings(getSettings())
  }, [])

  const handleSave = () => {
    saveSettings(settings)
    alert("Configuración guardada correctamente")
  }

  const handleClearData = () => {
    if (confirm("¿Está seguro de eliminar TODOS los datos? Esta acción no se puede deshacer.")) {
      if (confirm("Esta es su última oportunidad. ¿Realmente desea eliminar todos los datos?")) {
        localStorage.clear()
        window.location.reload()
      }
    }
  }

  return (
    <div className="flex flex-col">
      <Header title="Configuración" />
      <div className="p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="h-5 w-5" />
              Información de la Tienda
            </CardTitle>
            <CardDescription>Configura la información básica de tu ferretería.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="storeName">Nombre de la Tienda</Label>
                <Input
                  id="storeName"
                  value={settings.storeName}
                  onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="storePhone">Teléfono</Label>
                <Input
                  id="storePhone"
                  value={settings.storePhone}
                  onChange={(e) => setSettings({ ...settings, storePhone: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="storeAddress">Dirección</Label>
              <Input
                id="storeAddress"
                value={settings.storeAddress}
                onChange={(e) => setSettings({ ...settings, storeAddress: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="generalMargin">Margen General Predeterminado (%)</Label>
              <Input
                id="generalMargin"
                type="number"
                value={settings.generalMargin}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    generalMargin: Number.parseFloat(e.target.value) || 0,
                  })
                }
                className="w-32"
              />
            </div>
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Guardar Configuración
            </Button>
          </CardContent>
        </Card>

        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              Zona de Peligro
            </CardTitle>
            <CardDescription>Acciones irreversibles que afectan todos los datos del sistema.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="destructive" onClick={handleClearData}>
              <Trash2 className="h-4 w-4 mr-2" />
              Eliminar Todos los Datos
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
