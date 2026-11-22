import { FlaskConical } from 'lucide-react'
import { LoginForm } from './login-form'

export default function LoginPage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-white px-6 py-12 shadow-xl">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-soft text-brand"><FlaskConical /></div>
        <p className="text-xs tracking-widest text-gray-500">LABFIS · SIGELAB</p>
        <h1 className="text-2xl font-bold">Gestión de espacios</h1>
        <p className="text-sm text-gray-500">Reserva y disponibilidad de laboratorios</p>
      </div>
      <LoginForm />
      <p className="mt-auto pt-10 text-center text-xs text-gray-400">Facultad de Ingeniería de Sistemas · LABFIS · Grupo 7</p>
    </div>
  )
}
