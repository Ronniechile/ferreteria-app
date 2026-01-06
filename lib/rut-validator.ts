// Validador de RUT chileno
export function formatRut(rut: string): string {
  // Eliminar puntos, guiones y espacios
  const cleaned = rut.replace(/[.\-\s]/g, "").toUpperCase()

  if (cleaned.length < 2) return cleaned

  // Separar cuerpo y dígito verificador
  const body = cleaned.slice(0, -1)
  const dv = cleaned.slice(-1)

  // Formatear con puntos y guión
  let formatted = ""
  let count = 0
  for (let i = body.length - 1; i >= 0; i--) {
    formatted = body[i] + formatted
    count++
    if (count === 3 && i !== 0) {
      formatted = "." + formatted
      count = 0
    }
  }

  return `${formatted}-${dv}`
}

export function cleanRut(rut: string): string {
  return rut.replace(/[.\-\s]/g, "").toUpperCase()
}

export function validateRut(rut: string): boolean {
  const cleaned = cleanRut(rut)

  if (cleaned.length < 8 || cleaned.length > 9) return false

  const body = cleaned.slice(0, -1)
  const dv = cleaned.slice(-1)

  // Verificar que el cuerpo sean solo números
  if (!/^\d+$/.test(body)) return false

  // Calcular dígito verificador
  let sum = 0
  let multiplier = 2

  for (let i = body.length - 1; i >= 0; i--) {
    sum += Number.parseInt(body[i]) * multiplier
    multiplier = multiplier === 7 ? 2 : multiplier + 1
  }

  const remainder = sum % 11
  const calculatedDv = 11 - remainder

  let expectedDv: string
  if (calculatedDv === 11) {
    expectedDv = "0"
  } else if (calculatedDv === 10) {
    expectedDv = "K"
  } else {
    expectedDv = calculatedDv.toString()
  }

  return dv === expectedDv
}
