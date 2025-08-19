import { AxiosError } from 'axios'
import { DefaultOptions, QueryClient, UseInfiniteQueryOptions, UseMutationOptions, UseQueryOptions } from 'react-query'

// Handle 401 Unauthorized errors globally
const handleUnauthorizedError = (error: unknown) => {
  // Check if error is a 401 Unauthorized
  if (
    (error && typeof error === 'object' && 'status' in error && error.status === 401) ||
    (error && typeof error === 'object' && 'response' in error && 
     error.response && typeof error.response === 'object' && 'status' in error.response && error.response.status === 401) ||
    (error && typeof error === 'object' && 'errors' in error && 
     Array.isArray(error.errors) && error.errors[0]?.extensions?.code === 'UNAUTHORIZED') ||
    (error && typeof error === 'object' && 'message' in error && 
     typeof error.message === 'string' && (error.message.includes('401') || error.message.includes('Unauthorized')))
  ) {
    // Clear any existing user data
    queryClient.setQueryData('user', null)
    queryClient.clear()
    
    // Redirect to login page if we're in the browser
    if (typeof window !== 'undefined') {
      window.location.href = '/login'
    }
  }
}

const queryConfig: DefaultOptions = {
  queries: {
    refetchOnWindowFocus: false,
    retry: false,
    onError: handleUnauthorizedError,
  },
  mutations: {
    onError: handleUnauthorizedError,
  },
}

export const queryClient = new QueryClient({ defaultOptions: queryConfig })

type ExtractFnReturnType<FnType extends (...args: Array<unknown>) => unknown> = Awaited<ReturnType<FnType>>

// 1

type QueryConfig<QueryFnType extends (...args: Array<unknown>) => unknown> = Omit<
  UseQueryOptions<ExtractFnReturnType<QueryFnType>>,
  'queryKey' | 'queryFn'
>

type MutationConfig<MutationFnType extends (...args: Array<unknown>) => unknown> = UseMutationOptions<
  ExtractFnReturnType<MutationFnType>,
  AxiosError,
  Parameters<MutationFnType>[0]
>
type InfiniteQueryConfig<InfiniteFnType extends (...args: Array<unknown>) => unknown> = Omit<
  UseInfiniteQueryOptions<ExtractFnReturnType<InfiniteFnType>>,
  'queryKey' | 'queryFn'
>
