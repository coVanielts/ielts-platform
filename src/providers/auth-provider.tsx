'use client'

import { handleDirectusError } from '@/utils/auth-error.utils'
import { useRouter } from 'next/navigation'
import React, { createContext, useContext, useEffect } from 'react'

interface AuthContextType {
  handleAuthError: (error: unknown) => boolean
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()

  const handleAuthError = (error: unknown): boolean => {
    return handleDirectusError(error)
  }

  const logout = React.useCallback(() => {
    // Clear any stored data
    if (typeof window !== 'undefined') {
      localStorage.clear()
      sessionStorage.clear()
    }
    
    // Redirect to login
    router.push('/login')
  }, [router])

  // Listen for storage events to sync logout across tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'logout') {
        logout()
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [logout])

  const value = {
    handleAuthError,
    logout,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
