import Link from 'next/link'
import { addDays, dayParts, todayLocal } from '@/lib/domain/labels'

export function DateStrip({ selected, hrefFor, days = 14 }: { selected: string; hrefFor: (date: string) => string; days?: number }) {
  const today = todayLocal()
  return (
    <div className="flex gap-2 overflow-x-auto px-4 pb-1" role="tablist" aria-label="Fecha">
      {Array.from({ length: days }, (_, i) => addDays(today, i)).map((d) => {
        const p = dayParts(d); const active = d === selected
        return (
          <Link key={d} href={hrefFor(d)} role="tab" aria-selected={active} data-testid={`date-${d}`}
            className={`flex w-12 shrink-0 flex-col items-center rounded-xl border py-1.5 text-center ${active ? 'border-brand bg-brand text-white' : 'border-gray-200 bg-white'}`}>
            <span className="text-[10px] font-semibold opacity-70">{p.weekday}</span>
            <span className="text-lg font-bold leading-tight">{p.day}</span>
            <span className="text-[10px] opacity-70">{d === today ? 'hoy' : p.month}</span>
          </Link>
        )
      })}
    </div>
  )
}
