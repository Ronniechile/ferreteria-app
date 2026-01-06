"use client"

import { useState, forwardRef, useImperativeHandle } from 'react';
import { createPortal } from 'react-dom';
import { BudgetPreview } from '@/components/ui/budget-preview';
import type { Budget } from '@/lib/types';

interface BudgetPDFProps {
  budget: Budget;
}

export interface BudgetPDFRef {
  getIframeBody: () => HTMLElement | null;
}

export const BudgetPDF = forwardRef<BudgetPDFRef, BudgetPDFProps>(({ budget }, ref) => {
  const [contentRef, setContentRef] = useState<HTMLIFrameElement | null>(null);
  const mountNode = contentRef?.contentWindow?.document?.body;

  useImperativeHandle(ref, () => ({
    getIframeBody: () => {
      return mountNode || null;
    }
  }));

  // Set a base style for the iframe body to avoid transparent background issues
  if (mountNode) {
    mountNode.style.backgroundColor = 'white';
  }

  return (
    <iframe
      ref={setContentRef}
      style={{ width: '100%', height: '500px', border: 'none' }}
      title="Budget Preview"
    >
      {mountNode && createPortal(<BudgetPreview budget={budget} />, mountNode)}
    </iframe>
  );
});

BudgetPDF.displayName = 'BudgetPDF';
