'use client'

import { useLogin } from '@/hooks/auth'
import { AlertCircle, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

export default function LoginForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  })
  const [error, setError] = useState('')

  const { mutate: login, isLoading } = useLogin()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    login(
      {
        email: formData.email,
        password: formData.password,
        rememberMe: formData.rememberMe,
      },
      {
        onError: (err: unknown) => {
          // Display the error message from the server
          const errorMessage = err instanceof Error ? err.message : 'Login failed. Please try again.'
          setError(errorMessage)
        },
      },
    )
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
    // Clear error when user starts typing
    if (error) setError('')
  }

  return (
    <>
      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-accent-50 border border-accent-200 rounded-lg flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 text-accent-600 flex-shrink-0" />
          <p className="text-sm text-accent-700">{error}</p>
        </div>
      )}

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="email" className="form-label">
            Email or Username
          </label>
          <input
            id="email"
            name="email"
            type="text"
            autoComplete="email"
            required
            value={formData.email}
            onChange={handleInputChange}
            className="form-input"
            placeholder="Enter email or username"
          />
        </div>

        <div>
          <label htmlFor="password" className="form-label">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              value={formData.password}
              onChange={handleInputChange}
              className="form-input pr-10"
              placeholder="Enter password"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? (
                <EyeOff className="h-4 w-4 text-neutral-400" />
              ) : (
                <Eye className="h-4 w-4 text-neutral-400" />
              )}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              id="remember-me"
              name="rememberMe"
              type="checkbox"
              checked={formData.rememberMe}
              onChange={handleInputChange}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
            />
            <label htmlFor="remember-me" className="ml-2 block text-sm text-neutral-700">
              Remember me
            </label>
          </div>

          <Link href="/forgot-password" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
            Forgot password?
          </Link>
        </div>

        <button type="submit" disabled={isLoading} className="btn btn-primary btn-lg w-full relative">
          {isLoading ? (
            <>
              <div className="loading-spinner w-4 h-4 mr-2" />
              Logging in...
            </>
          ) : (
            'Login'
          )}
        </button>
      </form>

      {/* Help Text */}
      <div className="mt-8 text-center">
        <p className="text-sm text-neutral-600">
          Don&apos;t have an account? <span className="text-neutral-500">Contact the center to get an account</span>
        </p>
      </div>
    </>
  )
}
