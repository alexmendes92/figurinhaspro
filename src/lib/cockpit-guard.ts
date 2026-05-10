import { getSession } from '@/lib/auth'
import { isAdmin } from '@/lib/admin'

export class CockpitUnauthorizedError extends Error {
  constructor() {
    super('Acesso negado — admin only')
    this.name = 'CockpitUnauthorizedError'
  }
}

export async function requireCockpitAdmin(): Promise<void> {
  const session = await getSession()

  if (!session) {
    throw new Error('Não autenticado')
  }

  if (!isAdmin(session.email)) {
    throw new CockpitUnauthorizedError()
  }
}
