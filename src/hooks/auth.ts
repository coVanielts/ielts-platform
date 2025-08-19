import { loginAction, logoutAction } from '@/actions/auth.actions'
import { appPaths } from '@/constants/appPaths'
import { USER_TESTS_QUERY_KEY } from '@/hooks/useUserTests'
import { initializeDirectus } from '@/libs/directus'
import { queryClient } from '@/libs/react-query'
import { readMe } from '@directus/sdk'
import { useRouter } from 'next/navigation'
import { useMutation, useQuery } from 'react-query'

const USER_QUERY_KEY = 'user'

type LoginParams = {
  email: string
  password: string
  rememberMe: boolean
}

export function useUser() {
  return useQuery(USER_QUERY_KEY, async () => {
    try {
      const directus = await initializeDirectus()

      return await directus.request(readMe())
    } catch (error) {
      console.error('Error fetching user:', error)

      return null
    }
  })
}

export function useLogin() {
  const router = useRouter()

  return useMutation(
    async (credentials: LoginParams) => {
      const result = await loginAction(credentials)

      // If login failed, reject the promise so onError callback gets triggered
      if (!result.success) {
        throw new Error(result.error || 'Invalid username or password')
      }

      return result
    },
    {
      onSuccess: () => {
        // Invalidate and refetch user data
        queryClient.invalidateQueries(USER_QUERY_KEY)
        queryClient.invalidateQueries(USER_TESTS_QUERY_KEY)
        // Redirect to dashboard
        router.push(appPaths.dashboard)
      },
    },
  )
}

export function useLogout() {
  const router = useRouter()

  return useMutation(logoutAction, {
    onSuccess: () => {
      // Clear the user from the cache
      queryClient.setQueryData(USER_QUERY_KEY, null)
      queryClient.invalidateQueries(USER_QUERY_KEY)
      // Redirect to login
      router.push('/login')
    },
  })
}
