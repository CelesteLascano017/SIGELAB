'use client'
import { useActionState, useState } from 'react'
import { GraduationCap, Laptop, Shield } from 'lucide-react'
import { Button } from '@heroui/react'
import { signInAction } from '@/actions/auth'

// Demo accounts created by `npm run seed:demo`. The role itself always comes from the database after sign-in.
const ROLES = [
  { key: 'student', title: 'Estudiante', desc: 'Ana Martínez · consulta laboratorios', email: 'ana.martinez@epn.edu.ec', icon: <GraduationCap size={18} /> },
  { key: 'professor', title: 'Docente', desc: 'Ing. Carla Mendoza · reserva laboratorios', email: 'carla.mendoza@epn.edu.ec', icon: <Laptop size={18} /> },
  { key: 'admin', title: 'Administrador', desc: 'Jorge Vásconez · gestiona solicitudes', email: 'jorge.vasconez@epn.edu.ec', icon: <Shield size={18} /> },
]

export function LoginForm() {
  const [state, action, pending] = useActionState(signInAction, undefined)
  const [email, setEmail] = useState('')
  const role = ROLES.find((r) => r.email === email)?.key
  return (
    <form action={action} className="space-y-4">
      <label className="block text-xs font-medium text-gray-700">Correo institucional
        <input name="email" type="email" required autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm" placeholder="nombre.apellido@epn.edu.ec" />
        <span className="mt-1 block text-[11px] font-normal text-gray-400">Tal como aparece en tu credencial institucional.</span>
      </label>
      <label className="block text-xs font-medium text-gray-700">Contraseña
        <input name="password" type="password" required autoComplete="current-password" className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm" />
      </label>
      <fieldset>
        <legend className="mb-1 text-xs font-medium text-gray-700">Rol de usuario</legend>
        <div className="space-y-2">
          {ROLES.map((r) => (
            <button type="button" key={r.key} onClick={() => setEmail(r.email)} aria-pressed={email === r.email}
              className={`flex w-full items-center gap-3 rounded-xl border-2 p-3 text-left ${email === r.email ? 'border-brand bg-brand-soft/30' : 'border-gray-200'}`}>
              <span className="text-brand">{r.icon}</span>
              <span><span className="block text-sm font-semibold">{r.title}</span><span className="block text-xs text-gray-500">{r.desc}</span></span>
            </button>
          ))}
        </div>
      </fieldset>
      {state?.error && <p role="alert" className="rounded-lg bg-red-50 p-2 text-sm text-red-700">{state.error}</p>}
      <Button type="submit" variant="primary" isPending={pending} fullWidth className="!bg-brand">{role === 'admin' ? 'Ingresar como Administrador' : role ? 'Ingresar como Docente / Estudiante' : 'Ingresar'}</Button>
    </form>
  )
}
