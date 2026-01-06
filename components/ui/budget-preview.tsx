"use client"

import { forwardRef } from "react"
import type { Budget } from "@/lib/types"

export const BudgetPreview = forwardRef<HTMLDivElement, { budget: Budget }>(({ budget }, ref) => {
  if (!budget) return null

  const calculateTotal = () => budget.items.reduce((acc, item) => acc + item.subtotal, 0)

  return (
    <div ref={ref} className="p-8 bg-white text-black font-sans">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>Presupuesto</h1>
          <p style={{ color: '#6B7280' }}>{budget.budgetNumber}</p>
        </div>
        <div>
          <p>Válido hasta: {new Date(budget.validUntil).toLocaleDateString("es-CL")}</p>
        </div>
      </div>

      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>Cliente:</h2>
        <p>{budget.clientName}</p>
        <p>{budget.clientEmail}</p>
      </div>

      <table style={{ width: '100%', marginBottom: '32px', fontSize: '14px', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #E5E7EB' }}>
            <th style={{ textAlign: 'left', padding: '8px' }}>Producto</th>
            <th style={{ textAlign: 'right', padding: '8px' }}>Cantidad</th>
            <th style={{ textAlign: 'right', padding: '8px' }}>Precio Unitario</th>
            <th style={{ textAlign: 'right', padding: '8px' }}>Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {budget.items.map((item, index) => (
            <tr key={`${item.productId}-${index}`} style={{ borderBottom: '1px solid #E5E7EB' }}>
              <td style={{ padding: '8px' }}>{item.productName}</td>
              <td style={{ textAlign: 'right', padding: '8px' }}>{item.quantity}</td>
              <td style={{ textAlign: 'right', padding: '8px' }}>${item.unitPrice.toLocaleString("es-CL")}</td>
              <td style={{ textAlign: 'right', padding: '8px' }}>${item.subtotal.toLocaleString("es-CL")}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '32px' }}>
        <div style={{ width: '33.333333%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <p style={{ fontWeight: '600' }}>Total:</p>
            <p style={{ fontWeight: '600' }}>${calculateTotal().toLocaleString("es-CL")}</p>
          </div>
        </div>
      </div>

      {budget.notes && (
        <div>
          <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>Notas:</h3>
          <p style={{ color: '#4B5563' }}>{budget.notes}</p>
        </div>
      )}
    </div>
  )
})

BudgetPreview.displayName = "BudgetPreview"
