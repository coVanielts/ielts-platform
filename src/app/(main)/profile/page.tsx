'use client'

import { changePasswordAction } from '@/actions/user.actions'
import LogoutButton from '@/components/auth/LogoutButton'
import { useUser } from '@/hooks/auth'
import { DirectusRoles } from '@/types/collections.type'
import { AlertCircle, ArrowLeft, BookOpen, CheckCircle, Eye, EyeOff, Key, Mail, Save, User } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useMutation } from 'react-query'

export default function ProfilePage() {
  const { data: user, isLoading } = useUser()
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const router = useRouter()

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  // Mutation for updating password with current password verification
  const { mutate: updatePassword, isLoading: isUpdating } = useMutation(
    async ({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }) => {
      if (!user?.email) throw new Error('User email not available')
      const result = await changePasswordAction({
        email: user.email,
        currentPassword,
        newPassword,
      })
      if (!result.success) {
        throw new Error(result.error || 'Current password is incorrect.')
      }
      return result
    },
    {
      onSuccess: () => {
        setMessage({ type: 'success', text: 'Password updated successfully!' })
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        })
      },
      onError: (error: any) => {
        setMessage({ type: 'error', text: error.message || 'Current password is incorrect.' })
      },
    },
  )

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setPasswordForm(prev => ({
      ...prev,
      [name]: value,
    }))
    // Clear message when user starts typing
    if (message.text) setMessage({ type: '', text: '' })
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage({ type: '', text: '' })

    try {
      // Validation
      if (passwordForm.newPassword.length < 6) {
        setMessage({ type: 'error', text: 'New password must be at least 6 characters' })
        return
      }

      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        setMessage({ type: 'error', text: 'New password confirmation does not match' })
        return
      }

      // Verify current password and update to new password
      updatePassword({ currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword })
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'An error occurred. Please try again.' })
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center">
        <div className="loading-spinner w-8 h-8" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-neutral-900 mb-4">Unable to load user data</h2>
          <Link href="/login" className="btn btn-primary">
            Go to Login
          </Link>
        </div>
      </div>
    )
  }

  // Format user name from first_name and last_name
  const userName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      {/* Header */}
      <header className="ielts-header">
        <div className="container">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="btn btn-ghost">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Link>
            </div>

            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-neutral-900">IELTS Platform</h1>
                <p className="text-sm text-neutral-600">Personal Information</p>
              </div>
            </div>

            <LogoutButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        <div className="w-full space-y-8">
          {/* Profile Info Card */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-xl font-semibold text-neutral-900">Personal Information</h2>
              <p className="text-sm text-neutral-600">Account information of your account</p>
            </div>
            <div className="card-body space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="form-label">
                    <User className="w-4 h-4 inline mr-2" />
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={userName ?? ''}
                    disabled
                    className="form-input bg-neutral-50 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="form-label">
                    <Mail className="w-4 h-4 inline mr-2" />
                    Email
                  </label>
                  <input
                    type="email"
                    value={user.email ?? ''}
                    disabled
                    className="form-input bg-neutral-50 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="form-label">User ID</label>
                  <input type="text" value={user.id} disabled className="form-input bg-neutral-50 cursor-not-allowed" />
                </div>

                <div>
                  <label className="form-label">Role</label>
                  <input
                    type="text"
                    value={(user.role as DirectusRoles)?.name ?? 'User'}
                    disabled
                    className="form-input bg-neutral-50 cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="p-4 bg-neutral-50 rounded-lg">
                <p className="text-sm text-neutral-600">
                  <strong>Note:</strong> Personal information can only be changed through the center. Please contact
                  directly if you need to update.
                </p>
              </div>
            </div>
          </div>

          {/* Change Password Card */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-xl font-semibold text-neutral-900">
                <Key className="w-5 h-5 inline mr-2" />
                Change Password
              </h2>
              <p className="text-sm text-neutral-600">Update password to secure your account</p>
            </div>
            <div className="card-body">
              {/* Message */}
              {message.text && (
                <div
                  className={`mb-6 p-4 rounded-lg flex items-center space-x-3 ${
                    message.type === 'success'
                      ? 'bg-success-50 border border-success-200'
                      : 'bg-accent-50 border border-accent-200'
                  }`}>
                  {message.type === 'success' ? (
                    <CheckCircle className="w-5 h-5 text-success-600 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-accent-600 flex-shrink-0" />
                  )}
                  <p className={`text-sm ${message.type === 'success' ? 'text-success-700' : 'text-accent-700'}`}>
                    {message.text}
                  </p>
                </div>
              )}

              <form onSubmit={handlePasswordSubmit} className="space-y-6">
                <div>
                  <label htmlFor="currentPassword" className="form-label">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      id="currentPassword"
                      name="currentPassword"
                      type={showCurrentPassword ? 'text' : 'password'}
                      required
                      value={passwordForm.currentPassword}
                      onChange={handlePasswordChange}
                      className="form-input pr-10"
                      placeholder="Enter current password"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}>
                      {showCurrentPassword ? (
                        <EyeOff className="h-4 w-4 text-neutral-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-neutral-400" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="newPassword" className="form-label">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      id="newPassword"
                      name="newPassword"
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      value={passwordForm.newPassword}
                      onChange={handlePasswordChange}
                      className="form-input pr-10"
                      placeholder="Enter new password"
                      minLength={6}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowNewPassword(!showNewPassword)}>
                      {showNewPassword ? (
                        <EyeOff className="h-4 w-4 text-neutral-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-neutral-400" />
                      )}
                    </button>
                  </div>
                  <p className="form-help">Password must be at least 6 characters</p>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="form-label">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={passwordForm.confirmPassword}
                      onChange={handlePasswordChange}
                      className="form-input pr-10"
                      placeholder="Re-enter new password"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4 text-neutral-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-neutral-400" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex space-x-4">
                  <button type="submit" disabled={isUpdating} className="btn btn-primary flex-1">
                    {isUpdating ? (
                      <>
                        <div className="loading-spinner w-4 h-4 mr-2" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Update Password
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPasswordForm({
                        currentPassword: '',
                        newPassword: '',
                        confirmPassword: '',
                      })
                      setMessage({ type: '', text: '' })
                    }}
                    className="btn btn-outline">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
