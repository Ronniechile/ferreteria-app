import type {
  Product,
  Family,
  PurchaseInvoice,
  Sale,
  CashRegister,
  AppSettings,
  Supplier,
  PurchaseOrder,
  PurchaseOrderStatus,
  Budget,
  BudgetStatus,
} from "./types"

const KEYS = {
  products: "ferreteria_products",
  families: "ferreteria_families",
  purchases: "ferreteria_purchases",
  sales: "ferreteria_sales",
  cashRegisters: "ferreteria_cash_registers",
  settings: "ferreteria_settings",
  suppliers: "ferreteria_suppliers", // Agregar key para proveedores
  purchaseOrders: "ferreteria_purchase_orders",
  budgets: "ferreteria_budgets",
  budgetSequence: "ferreteria_budget_sequence",
}

function getItem<T>(key: string, defaultValue: T): T {
  if (typeof window === "undefined") return defaultValue
  const item = localStorage.getItem(key)
  return item ? JSON.parse(item) : defaultValue
}

function setItem<T>(key: string, value: T): void {
  if (typeof window === "undefined") return
  localStorage.setItem(key, JSON.stringify(value))
}

// Products
export function getProducts(): Product[] {
  return getItem<Product[]>(KEYS.products, [])
}

export function saveProducts(products: Product[]): void {
  setItem(KEYS.products, products)
}

export function addProduct(product: Product): void {
  const products = getProducts()
  products.push(product)
  saveProducts(products)
}

export function updateProduct(product: Product): void {
  const products = getProducts()
  const index = products.findIndex((p) => p.id === product.id)
  if (index !== -1) {
    products[index] = product
    saveProducts(products)
  }
}

export function deleteProduct(id: string): void {
  const products = getProducts().filter((p) => p.id !== id)
  saveProducts(products)
}

// Families
export function getFamilies(): Family[] {
  return getItem<Family[]>(KEYS.families, [
    { id: "1", name: "Herramientas Manuales", margin: 30, description: "Martillos, destornilladores, llaves" },
    { id: "2", name: "Herramientas Eléctricas", margin: 30, description: "Taladros, sierras, pulidoras" },
    { id: "3", name: "Materiales de Construcción", margin: 30, description: "Cementos, ladrillos, arena" },
  ])
}

export function saveFamilies(families: Family[]): void {
  setItem(KEYS.families, families)
}

export function addFamily(family: Family): void {
  const families = getFamilies()
  families.push(family)
  saveFamilies(families)
}

export function updateFamily(family: Family): void {
  const families = getFamilies()
  const index = families.findIndex((f) => f.id === family.id)
  if (index !== -1) {
    families[index] = family
    saveFamilies(families)
  }
}

export function deleteFamily(id: string): void {
  const families = getFamilies().filter((f) => f.id !== id)
  saveFamilies(families)
}

// Purchases
export function getPurchases(): PurchaseInvoice[] {
  return getItem<PurchaseInvoice[]>(KEYS.purchases, [])
}

export function savePurchases(purchases: PurchaseInvoice[]): void {
  setItem(KEYS.purchases, purchases)
}

export function addPurchase(purchase: PurchaseInvoice): void {
  const purchases = getPurchases()
  purchases.push(purchase)
  savePurchases(purchases)
}

// Sales
export function getSales(): Sale[] {
  return getItem<Sale[]>(KEYS.sales, [])
}

export function saveSales(sales: Sale[]): void {
  setItem(KEYS.sales, sales)
}

export function addSale(sale: Sale): void {
  const sales = getSales()
  sales.push(sale)
  saveSales(sales)
}

// Cash Registers
export function getCashRegisters(): CashRegister[] {
  return getItem<CashRegister[]>(KEYS.cashRegisters, [])
}

export function saveCashRegisters(registers: CashRegister[]): void {
  setItem(KEYS.cashRegisters, registers)
}

export function openCashRegister(openingAmount: number): CashRegister {
  const today = new Date().toISOString().split("T")[0]
  const registers = getCashRegisters()

  // Siempre se crea un nuevo registro de caja.
  const register: CashRegister = {
    id: crypto.randomUUID(),
    date: today,
    openingAmount,
    closingAmount: null,
    sales: [],
    status: "open",
    createdAt: new Date().toISOString(),
    closedAt: null,
  }
  registers.push(register)
  saveCashRegisters(registers)
  return register
}

export function closeCashRegister(id: string, closingAmount: number): void {
  const registers = getCashRegisters()
  const index = registers.findIndex((r) => r.id === id)
  if (index !== -1) {
    registers[index].closingAmount = closingAmount
    registers[index].status = "closed"
    registers[index].closedAt = new Date().toISOString()
    saveCashRegisters(registers)
  }
}

export function addSaleToCashRegister(registerId: string, sale: Sale): void {
  const registers = getCashRegisters()
  const index = registers.findIndex((r) => r.id === registerId)
  if (index !== -1) {
    registers[index].sales.push(sale)
    saveCashRegisters(registers)
  }
}

export function getCashRegisterStatus(): { isOpen: boolean; register: CashRegister | null } {
  const today = new Date().toISOString().split("T")[0]
  const registers = getCashRegisters()
  const todayRegisters = registers
    .filter((r) => r.date === today)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const todayRegister = todayRegisters[0]

  if (!todayRegister) {
    return { isOpen: false, register: null }
  }

  return {
    isOpen: todayRegister.status === "open",
    register: todayRegister,
  }
}

// Settings
export function getSettings(): AppSettings {
  return getItem<AppSettings>(KEYS.settings, {
    storeName: "Mi Ferretería",
    storeAddress: "Calle Falsa 123",
    storePhone: "+569 1234 5678",
  })
}

export function saveSettings(settings: AppSettings): void {
  setItem(KEYS.settings, settings)
}

// Update stock from purchase
export function updateStockFromPurchase(items: { productId: string; quantity: number }[]): void {
  const products = getProducts()
  items.forEach((item) => {
    const product = products.find((p) => p.id === item.productId)
    if (product) {
      product.stock += item.quantity
      product.updatedAt = new Date().toISOString()
    }
  })
  saveProducts(products)
}

// Reduce stock from sale
export function reduceStockFromSale(items: { productId: string; quantity: number }[]): void {
  const products = getProducts()
  items.forEach((item) => {
    const product = products.find((p) => p.id === item.productId)
    if (product) {
      product.stock -= item.quantity
      product.updatedAt = new Date().toISOString()
    }
  })
  saveProducts(products)
}

// Suppliers
export function getSuppliers(): Supplier[] {
  return getItem<Supplier[]>(KEYS.suppliers, [])
}

export function saveSuppliers(suppliers: Supplier[]): void {
  setItem(KEYS.suppliers, suppliers)
}

export function addSupplier(supplier: Supplier): void {
  const suppliers = getSuppliers()
  suppliers.push(supplier)
  saveSuppliers(suppliers)
}

export function updateSupplier(supplier: Supplier): void {
  const suppliers = getSuppliers()
  const index = suppliers.findIndex((s) => s.id === supplier.id)
  if (index !== -1) {
    suppliers[index] = supplier
    saveSuppliers(suppliers)
  }
}

export function deleteSupplier(id: string): void {
  const suppliers = getSuppliers().filter((s) => s.id !== id)
  saveSuppliers(suppliers)
}

// Purchase Orders
export function getPurchaseOrders(): PurchaseOrder[] {
  return getItem<PurchaseOrder[]>(KEYS.purchaseOrders, [])
}

export function savePurchaseOrders(orders: PurchaseOrder[]): void {
  setItem(KEYS.purchaseOrders, orders)
}

export function addPurchaseOrder(order: PurchaseOrder): void {
  const orders = getPurchaseOrders()
  orders.push(order)
  savePurchaseOrders(orders)
}

export function updatePurchaseOrderStatus(id: string, status: PurchaseOrderStatus): void {
  const orders = getPurchaseOrders()
  const index = orders.findIndex((o) => o.id === id)
  if (index !== -1) {
    orders[index] = {
      ...orders[index],
      status,
      updatedAt: new Date().toISOString(),
    }
    savePurchaseOrders(orders)
  }
}

export function deletePurchaseOrder(id: string): void {
  const orders = getPurchaseOrders().filter((o) => o.id !== id)
  savePurchaseOrders(orders)
}

// Budgets
export function getBudgets(): Budget[] {
  return getItem<Budget[]>(KEYS.budgets, [])
}

export function saveBudgets(budgets: Budget[]): void {
  setItem(KEYS.budgets, budgets)
}

export function addBudget(budget: Budget): void {
  const budgets = getBudgets()
  budgets.push(budget)
  saveBudgets(budgets)
}

export function updateBudgetStatus(id: string, status: BudgetStatus): void {
  const budgets = getBudgets()
  const index = budgets.findIndex((b) => b.id === id)
  if (index !== -1) {
    budgets[index] = {
      ...budgets[index],
      status,
      updatedAt: new Date().toISOString(),
    }
    saveBudgets(budgets)
  }
}

export function deleteBudget(id: string): void {
  const budgets = getBudgets().filter((b) => b.id !== id)
  saveBudgets(budgets)
}

export function getBudgetSequence(): number {
  return getItem<number>(KEYS.budgetSequence, 1)
}

export function setBudgetSequence(sequence: number): void {
  setItem(KEYS.budgetSequence, sequence)
}
