'use server'

import { initializeDirectus } from '@/libs/directus'
import { updateMe } from '@directus/sdk'

type ChangePasswordParams = {
  email: string
  currentPassword: string
  newPassword: string
}

type ChangePasswordResult = {
  success: boolean
  error?: string
}

export async function changePasswordAction(params: ChangePasswordParams): Promise<ChangePasswordResult> {
  const { email, currentPassword, newPassword } = params

  // Use an isolated Directus client to avoid mutating the shared auth state
  const directusClient = await initializeDirectus()

  try {
    // 1) Verify current password by attempting a login
    const loginResult = await directusClient.login({ email, password: currentPassword })

    if (!loginResult || !loginResult.access_token) {
      return { success: false, error: 'Current password is incorrect.' }
    }

    // 2) Ensure subsequent calls use the verified token
    await directusClient.setToken(loginResult.access_token)

    // 3) Update password for the authenticated user
    await directusClient.request(
      updateMe({
        password: newPassword,
      }),
    )

    return { success: true }
  } catch (error: unknown) {
    // Hide specifics to avoid leaking auth info
    return { success: false, error: 'Current password is incorrect.' }
  }
}
