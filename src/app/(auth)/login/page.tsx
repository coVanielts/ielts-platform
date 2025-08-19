'use client'

import AuthErrorNotification from '@/components/auth/AuthErrorNotification'
import LoginForm from '@/components/auth/LoginForm'
import { BookOpen } from 'lucide-react'
import { Suspense } from 'react'

export default function LoginPage() {
  return (
    <>
      <Suspense fallback={null}>
        <AuthErrorNotification />
      </Suspense>
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Login Card */}
          <div className="card">
            <div className="card-body">
              {/* Logo & Header */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-xl mb-6">
                  <BookOpen className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-neutral-900 mb-2">Login to System</h1>
                <p className="text-neutral-600">Enter your provided account information to access</p>
              </div>

              <LoginForm />
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-xs text-neutral-500">
              © 2024 IELTS Learning Platform. Developed for IELTS preparation centers.
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
