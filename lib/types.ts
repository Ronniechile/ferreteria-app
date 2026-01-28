export interface Product {
  id: string
  code: string
  name: string
  description: string
  familyId: string
  unit: string
  costPrice: number
  salePrice: number
  stock: number
  minStock: number
  createdAt: string
  updatedAt: string
}

export interface Family {
  id: string
  name: string
  margin: number // porcentaje de margen
  description: string
}

export interface PurchaseInvoice {
  id: string
  invoiceNumber: string
  supplierId: string
  supplierName: string
  date: string
  items: PurchaseItem[]
  total: number
  createdAt: string
}

export interface PurchaseItem {
  productId: string
  productName: string
  quantity: number
  unitPrice: number
  subtotal: number
}

export interface Sale {
  id: string
  items: SaleItem[]
  subtotal: number
  discount: number
  total: number
  paymentMethod: "cash" | "card" | "transfer"
  amountReceived?: number // Monto recibido en efectivo
  change?: number // Vuelto
  cashRegisterId: string
  createdAt: string
}

export interface SaleItem {
  productId: string
  productName: string
  quantity: number
  unitPrice: number
  subtotal: number
}

export interface CashRegister {
  id: string
  date: string
  openingAmount: number
  closingAmount: number | null
  sales: Sale[]
  status: "open" | "closed"
  createdAt: string
  closedAt: string | null
}

export interface AppSettings {
  storeName: string
  storeAddress: string
  storePhone: string
}

export interface Supplier {
  id: string
  rut: string
  name: string
  contactName: string
  phone: string
  email: string
  address: string
  createdAt: string
  updatedAt: string
}

export type PurchaseOrderStatus = "borrador" | "enviado" | "recibido"

export interface PurchaseOrderItem {
  productId: string
  productName: string
  quantity: number
  unitPrice: number
  subtotal: number
}

export interface PurchaseOrder {
  id: string
  orderNumber: string
  supplierId: string
  supplierName: string
  date: string
  status: PurchaseOrderStatus
  notes: string
  items: PurchaseOrderItem[]
  total: number
  createdAt: string
  updatedAt: string
}

export type BudgetStatus = "borrador" | "enviado" | "aprobado"

export interface BudgetItem {
  productId: string
  productName: string
  quantity: number
  baseUnitPrice: number // Precio base sin margen
  marginPercentage: number // Porcentaje de margen aplicado
  unitPrice: number // Precio final con margen
  subtotal: number
}

export interface Budget {
  id: string
  budgetNumber: string
  clientName: string
  clientEmail: string
  validUntil: string
  status: BudgetStatus
  notes: string
  items: BudgetItem[]
  total: number
  createdAt: string
  updatedAt: string
}
