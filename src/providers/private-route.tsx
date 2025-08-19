import { appPaths } from '@/constants/appPaths'
import { getToken } from '@/utils/token.helper'
import { redirect } from 'next/navigation'

export const PrivateRouteProvider = async ({ children }: { children: React.ReactNode }) => {
  const token = await getToken()
  if (!token) redirect(appPaths.auth.login)

  return <>{children}</>
}
