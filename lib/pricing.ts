import type { Product, Family, AppSettings } from "./types"

// Función para redondear precios al valor más cercano (ej: 2960 -> 2990, 24567 -> 24990)
export function roundPrice(price: number, target: number): number {
  if (target <= 0) return price
  
  const thousands = Math.floor(price / 1000)
  const remainder = price % 1000
  
  if (remainder <= target) {
    return thousands * 1000 + target
  } else {
    return (thousands + 1) * 1000 + target
  }
}

// Función para calcular precio con margen
export function calculatePriceWithMargin(
  basePrice: number,
  marginPercentage: number,
  rounding: boolean = false
): number {
  const priceWithMargin = basePrice * (1 + marginPercentage / 100)
  
  if (rounding) {
    return roundPrice(priceWithMargin, 990) // Siempre redondea a 990
  }
  
  return priceWithMargin
}

// Función para obtener el margen a aplicar para un producto
export function getProductMargin(
  product: Product,
  families: Family[],
  generalMargin?: number,
  productSpecificMargin?: number
): number {
  // Si tiene margen específico de producto, usar ese
  if (productSpecificMargin !== undefined) {
    return productSpecificMargin
  }
  
  // Buscar la familia del producto y usar su margen
  const family = families.find(f => f.id === product.familyId)
  if (family && family.margin !== undefined) {
    return family.margin
  }
  
  // Usar margen por defecto de 30%
  return 30
}

// Función para calcular el precio final de un producto
export function calculateFinalProductPrice(
  product: Product,
  families: Family[],
  settings: AppSettings,
  productSpecificMargin?: number
): {
  basePrice: number
  marginPercentage: number
  finalPrice: number
} {
  const marginPercentage = getProductMargin(product, families, undefined, productSpecificMargin)
  const finalPrice = calculatePriceWithMargin(
    product.salePrice,
    marginPercentage,
    false // Siempre false ya que no hay redondeo global
  )
  
  return {
    basePrice: product.salePrice,
    marginPercentage,
    finalPrice
  }
}
