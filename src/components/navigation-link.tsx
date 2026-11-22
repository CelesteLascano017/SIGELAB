'use client'

import Link, { useLinkStatus } from 'next/link'
import type { ComponentProps } from 'react'

function NavigationStatus() {
  const { pending } = useLinkStatus()
  return <span data-navigation-pending={pending} className="navigation-status" role="status" aria-live="polite">
    <span className="sr-only">{pending ? 'Cargando página…' : ''}</span>
  </span>
}

/** Keeps Link's native prefetch/history while acknowledging uncached navigation. */
export default function NavigationLink({ children, className = '', ...props }: ComponentProps<typeof Link>) {
  return <Link {...props} className={`navigation-link ${className}`}>{children}<NavigationStatus /></Link>
}
