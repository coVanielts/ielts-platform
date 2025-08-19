/**
 * Handle 401 Unauthorized errors by clearing user data and redirecting to login
 */
const handleUnauthorizedError = (error: unknown) => {
  // Check if error is a 401 Unauthorized
  const is401Error =
    (error && typeof error === 'object' && 'status' in error && error.status === 401) ||
    (error &&
      typeof error === 'object' &&
      'response' in error &&
      error.response &&
      typeof error.response === 'object' &&
      'status' in error.response &&
      error.response.status === 401) ||
    (error &&
      typeof error === 'object' &&
      'errors' in error &&
      Array.isArray(error.errors) &&
      error.errors[0]?.extensions?.code === 'UNAUTHORIZED') ||
    (error &&
      typeof error === 'object' &&
      'message' in error &&
      typeof error.message === 'string' &&
      (error.message.includes('401') || error.message.includes('Unauthorized')))

  if (is401Error) {
    // Redirect to login page with session expired parameter if we're in the browser
    if (typeof window !== 'undefined') {
      window.location.href = '/login?session_expired=true'
    }

    return true // Return true to indicate the error was handled
  }

  return false // Return false to indicate the error was not a 401
}

/**
 * Wrapper for fetch that automatically handles 401 errors
 */
const authFetch = async (url: string, options?: RequestInit): Promise<Response> => {
  try {
    const response = await fetch(url, options)

    if (response.status === 401) {
      handleUnauthorizedError({ status: 401 })
      throw new Error('Unauthorized - redirecting to login')
    }

    return response
  } catch (error) {
    // Handle any other errors
    handleUnauthorizedError(error)
    throw error
  }
}

/**
 * Enhanced error handler specifically for Directus SDK errors
 */
export const handleDirectusError = (error: unknown) => {
  // Directus SDK errors might have different structures
  const isDirectusUnauthorized =
    (error &&
      typeof error === 'object' &&
      'errors' in error &&
      Array.isArray(error.errors) &&
      error.errors.some(
        (err: unknown) =>
          err &&
          typeof err === 'object' &&
          (('extensions' in err &&
            err.extensions &&
            typeof err.extensions === 'object' &&
            'code' in err.extensions &&
            (err.extensions.code === 'UNAUTHORIZED' || err.extensions.code === 'FORBIDDEN')) ||
            ('message' in err && typeof err.message === 'string' && err.message.includes('Invalid token'))),
      )) ||
    (error &&
      typeof error === 'object' &&
      'message' in error &&
      typeof error.message === 'string' &&
      (error.message.includes('Invalid token') ||
        error.message.includes('Token expired') ||
        error.message.includes('Authentication required')))

  if (isDirectusUnauthorized || handleUnauthorizedError(error)) {
    return true
  }

  return false
}
