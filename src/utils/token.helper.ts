'use server'
import { cookies } from 'next/headers'

const tokenKey = 'directus_session_token'
const refreshTokenKey = 'directus_refresh_token'

export const getToken = async () => (await cookies()).get(tokenKey)?.value
export const clearToken = async () => {
  const cookieStore = await cookies()
  cookieStore.delete(tokenKey)
  cookieStore.delete(refreshTokenKey)
}

export const setAccessToken = async (token: string, expires: Date) => {
  ;(await cookies()).set(tokenKey, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires,
  })
}

export const getRefreshToken = async () => (await cookies()).get(refreshTokenKey)?.value
