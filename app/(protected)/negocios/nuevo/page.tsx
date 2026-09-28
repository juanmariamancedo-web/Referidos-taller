import { getUserAuth } from '@/app/actions/auth'
import { redirect } from 'next/navigation'
import CreateBusinessForm from './CreateBusinessForm'

export default async function CreateBusinessPage() {
  const { data: user } = await getUserAuth()

  // Redirigir si el usuario no existe o no es ADMIN
  if (!user || user.rol !== 'ADMIN') {
    redirect('/negocios')
  }

  return (
    <div className="mx-auto max-w-2xl p-6">
      <CreateBusinessForm />
    </div>
  )
}