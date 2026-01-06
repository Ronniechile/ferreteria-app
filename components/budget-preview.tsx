"use client"

import { forwardRef } from "react"
import type { Budget } from "@/lib/types"

export const BudgetPreview = forwardRef<HTMLDivElement, { budget: Budget }>(({ budget }, ref) => {
  if (!budget) return null

  const calculateTotal = () => budget.items.reduce((acc, item) => acc + item.subtotal, 0)

  return (
    <div ref={ref} style={{ padding: '32px', backgroundColor: '#ffffff', color: '#000000', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', backgroundColor: 'transparent' }}>
        <div style={{ backgroundColor: 'transparent' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#000000', backgroundColor: 'transparent' }}>Presupuesto</h1>
          <p style={{ color: '#6B7280', backgroundColor: 'transparent' }}>{budget.budgetNumber}</p>
        </div>
        <div style={{ backgroundColor: 'transparent' }}>
          <p style={{ color: '#000000', backgroundColor: 'transparent' }}>Válido hasta: {new Date(budget.validUntil).toLocaleDateString("es-CL")}</p>
        </div>
      </div>

      <div style={{ marginBottom: '32px', backgroundColor: 'transparent' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: '#000000', backgroundColor: 'transparent' }}>Cliente:</h2>
        <p style={{ color: '#000000', backgroundColor: 'transparent' }}>{budget.clientName}</p>
        <p style={{ color: '#000000', backgroundColor: 'transparent' }}>{budget.clientEmail}</p>
      </div>

      <table style={{ width: '100%', marginBottom: '32px', fontSize: '14px', borderCollapse: 'collapse', backgroundColor: 'transparent' }}>
        <thead style={{ backgroundColor: 'transparent' }}>
          <tr style={{ borderBottom: '1px solid #E5E7EB', backgroundColor: 'transparent' }}>
            <th style={{ textAlign: 'left', padding: '8px', color: '#000000', backgroundColor: 'transparent' }}>Producto</th>
            <th style={{ textAlign: 'right', padding: '8px', color: '#000000', backgroundColor: 'transparent' }}>Cantidad</th>
            <th style={{ textAlign: 'right', padding: '8px', color: '#000000', backgroundColor: 'transparent' }}>Precio Unitario</th>
            <th style={{ textAlign: 'right', padding: '8px', color: '#000000', backgroundColor: 'transparent' }}>Subtotal</th>
          </tr>
        </thead>
        <tbody style={{ backgroundColor: 'transparent' }}>
          {budget.items.map((item, index) => (
            <tr key={`${item.productId}-${index}`} style={{ borderBottom: '1px solid #E5E7EB', backgroundColor: 'transparent' }}>
              <td style={{ padding: '8px', color: '#000000', backgroundColor: 'transparent' }}>{item.productName}</td>
              <td style={{ textAlign: 'right', padding: '8px', color: '#000000', backgroundColor: 'transparent' }}>{item.quantity}</td>
              <td style={{ textAlign: 'right', padding: '8px', color: '#000000', backgroundColor: 'transparent' }}>${item.unitPrice.toLocaleString("es-CL")}</td>
              <td style={{ textAlign: 'right', padding: '8px', color: '#000000', backgroundColor: 'transparent' }}>${item.subtotal.toLocaleString("es-CL")}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '32px', backgroundColor: 'transparent' }}>
        <div style={{ width: '33.333333%', backgroundColor: 'transparent' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', backgroundColor: 'transparent' }}>
            <p style={{ fontWeight: '600', color: '#000000', backgroundColor: 'transparent' }}>Total:</p>
            <p style={{ fontWeight: '600', color: '#000000', backgroundColor: 'transparent' }}>${calculateTotal().toLocaleString("es-CL")}</p>
          </div>
        </div>
      </div>

      {budget.notes && (
        <div style={{ backgroundColor: 'transparent' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px', color: '#000000', backgroundColor: 'transparent' }}>Notas:</h3>
          <p style={{ color: '#4B5563', backgroundColor: 'transparent' }}>{budget.notes}</p>
        </div>
      )}
    </div>
  )
})

BudgetPreview.displayName = "BudgetPreview"
