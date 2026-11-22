import Link from 'next/link'

export function LabTabs({ active, date }: { active: 'labs' | 'availability'; date?: string }) {
  const tab = (key: string, href: string, label: string) => (
    <Link href={href} aria-current={active === key ? 'page' : undefined}
      className={`flex-1 rounded-lg py-2 text-center text-sm font-semibold ${active === key ? 'bg-white text-brand shadow-sm' : 'text-gray-500'}`}>{label}</Link>
  )
  return (
    <div className="mx-4 mt-4 flex rounded-xl bg-gray-200/70 p-1">
      {tab('labs', '/laboratories', 'Laboratorios')}
      {tab('availability', `/availability${date ? `?date=${date}` : ''}`, 'Disponibilidad')}
    </div>
  )
}
