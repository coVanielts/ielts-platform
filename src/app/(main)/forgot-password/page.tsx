'use client'

import { ArrowLeft, BookOpen, CheckCircle, Mail } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))

    setIsLoading(false)
    setIsSubmitted(true)
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="card">
            <div className="card-body text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-success-100 rounded-xl mb-6">
                <CheckCircle className="w-8 h-8 text-success-600" />
              </div>
              <h1 className="text-2xl font-bold text-neutral-900 mb-4">Request submitted</h1>
              <p className="text-neutral-600 mb-8">
                We have received your password recovery request. Please contact the center directly for support.
              </p>

              <div className="space-y-4">
                <div className="p-4 bg-neutral-50 rounded-lg">
                  <p className="text-sm text-neutral-700">
                    <strong>Contact the center:</strong>
                    <br />
                    Email: support@ielts-center.com
                    <br />
                    Hotline: 0123-456-789
                    <br />
                    Business hours: 8:00 - 17:00 (Mon-Fri)
                  </p>
                </div>

                <Link href="/login" className="btn btn-primary w-full">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="card">
          <div className="card-body">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-xl mb-6">
                <BookOpen className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-neutral-900 mb-2">Forgot Password</h1>
              <p className="text-neutral-600">Enter your email to request password recovery support</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="form-label">
                  Registered Email
                </label>
                <div className="relative">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="form-input pl-10"
                    placeholder="Enter your account email"
                  />
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
                </div>
                <p className="form-help">Enter the email you used when registering your account</p>
              </div>

              <button type="submit" disabled={isLoading} className="btn btn-primary btn-lg w-full">
                {isLoading ? (
                  <>
                    <div className="loading-spinner w-4 h-4 mr-2" />
                    Sending request...
                  </>
                ) : (
                  'Send recovery request'
                )}
              </button>
            </form>

            {/* Back to login */}
            <div className="mt-8">
              <Link href="/login" className="btn btn-ghost w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to login
              </Link>
            </div>

            {/* Help text */}
            <div className="mt-6 p-4 bg-neutral-50 rounded-lg">
              <h3 className="font-medium text-neutral-900 mb-2">Note:</h3>
              <p className="text-sm text-neutral-600">
                For security reasons, passwords can only be recovered through the center. After submitting your request, please contact the center directly for the fastest support.
              </p>
            </div>
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
  )
}
