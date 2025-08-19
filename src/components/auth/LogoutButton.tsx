'use client'

import { useLogout } from '@/hooks/auth'
import { LogOut } from 'lucide-react'

type LogoutButtonProps = {
  variant?: 'icon' | 'button' | 'text'
  className?: string
}

export default function LogoutButton({ variant = 'button', className = '' }: LogoutButtonProps) {
  const { mutate: logout, isLoading } = useLogout()

  const handleLogout = () => {
    logout()
  }

  if (variant === 'icon') {
    return (
      <button
        onClick={handleLogout}
        disabled={isLoading}
        className={`p-2 text-neutral-600 hover:text-accent-600 hover:bg-accent-50 rounded-lg ${className}`}>
        <LogOut className="w-5 h-5" />
      </button>
    )
  }

  if (variant === 'text') {
    return (
      <button
        onClick={handleLogout}
        disabled={isLoading}
        className={`text-neutral-600 hover:text-accent-600 ${className}`}>
        {isLoading ? 'Logging out...' : 'Log Out'}
      </button>
    )
  }

  return (
    <button onClick={handleLogout} disabled={isLoading} className={`btn btn-outline btn-sm ${className}`}>
      {isLoading ? 'Logging out...' : 'Log Out'}
    </button>
  )
}
