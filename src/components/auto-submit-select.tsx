'use client'
import type { ReactNode } from 'react'

/** <select> inside a GET form that submits as soon as the value changes (no "Aplicar" button, as in the prototype). */
export function AutoSubmitSelect({ name, defaultValue, label, children, className }: { name: string; defaultValue: string; label: string; children: ReactNode; className?: string }) {
  return <select name={name} defaultValue={defaultValue} aria-label={label} className={className} onChange={(e) => e.currentTarget.form?.requestSubmit()}>{children}</select>
}
