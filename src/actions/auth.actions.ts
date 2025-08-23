'use server'

import { directusClient } from '@/libs/directus'
import { clearToken, getRefreshToken, setAccessToken } from '@/utils/token.helper'

type LoginParams = {
  email: string
  password: string
}

type LoginResult = {
  success: boolean
  error?: string
  user?: any
}

export async function loginAction(params: LoginParams): Promise<LoginResult> {
  try {
    const result = await directusClient.login({
      email: params.email,
      password: params.password,
    })

    if (!result || !result.access_token) {
      return {
        success: false,
        error: 'Invalid login credentials',
      }
    }

    

    await setAccessToken(result.access_token, new Date(result.expires_at as number))

    return {
      success: true,
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Login failed. Please try again.',
    }
  }
}

export async function logoutAction() {
  try {
    // Đăng xuất khỏi Directus
    const refresh_token = await getRefreshToken()
    await directusClient.logout({
      mode: 'json',
      refresh_token: refresh_token,
    })

    // Xóa token khỏi cookie
    await clearToken()

    return { success: true }
  } catch (error) {
    await clearToken()
    return { success: false }
  }
}
