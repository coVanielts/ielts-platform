'use client'

import LogoutButton from '@/components/auth/LogoutButton'
import DashboardFilters from '@/components/dashboard/DashboardFilters'
import FullTestGroupItem from '@/components/dashboard/FullTestGroupItem'
import IndividualTestItem from '@/components/dashboard/IndividualTestItem'
import { useUser } from '@/hooks/auth'
import { useUserTestGroups } from '@/hooks/useUserTestGroups'
import { useUserTests } from '@/hooks/useUserTests'
import { BookOpen, FileText, User } from 'lucide-react'
import Link from 'next/link'
import { useMemo, useState } from 'react'

export default function DashboardPage() {
  const { data: user, isLoading: userLoading } = useUser()
  const { data: tests = [], isLoading: testsLoading } = useUserTests()
  const { data: testGroups = [], isLoading: testGroupsLoading } = useUserTestGroups()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'listening' | 'reading' | 'writing' | 'speaking' | 'full'>('all')
  const [filterStatus, setFilterStatus] = useState<'all' | 'assigned' | 'in_progress' | 'completed' | 'overdue'>('all')
  const [viewMode, setViewMode] = useState<'tests' | 'test-groups'>('tests')

  const isLoading = userLoading || testsLoading || testGroupsLoading

  // Filter tests
  const filteredTests = useMemo(() => {
    if (!tests) return []

    return tests.filter(test => {
      const matchesSearch = test.title.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesType = filterType === 'all' || test.type === filterType
      const matchesStatus = filterStatus === 'all' || test.status === filterStatus
      return matchesSearch && matchesType && matchesStatus
    })
  }, [tests, searchTerm, filterType, filterStatus])

  // Filter test groups
  const filteredTestGroups = useMemo(() => {
    if (!testGroups) return []

    return testGroups.filter(group => {
      const matchesSearch = group.name.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesType = filterType === 'all' || group.tests.some(test => test.type === filterType)
      return matchesSearch && matchesType
    })
  }, [testGroups, searchTerm, filterType])

  if (userLoading) {
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center">
        <div className="loading-spinner w-8 h-8" />
      </div>
    )
  }

  const userName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="ielts-header sticky top-0 z-40">
        <div className="container">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-neutral-900">IELTS Platform</h1>
                <p className="text-sm text-neutral-600">Hệ thống luyện thi</p>
              </div>
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              <Link href="/profile" className="flex items-center space-x-3 hover:bg-primary-50 rounded-lg p-2">
                <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-neutral-900">{userName}</p>
                  <p className="text-xs text-neutral-600">{user.email}</p>
                </div>
              </Link>
              <LogoutButton variant="icon" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-neutral-900 mb-2">Hello, {userName}! 👋</h2>
          <p className="text-neutral-600">
            {viewMode === 'tests'
              ? 'Below are the tests assigned to you. Complete them on time!'
              : 'Below are your test groups. Each group contains multiple tests for comprehensive practice.'}
          </p>
        </div>

        {/* Filters */}
        <DashboardFilters
          viewMode={viewMode}
          setViewMode={setViewMode}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          filterType={filterType}
          setFilterType={setFilterType}
          filterStatus={filterStatus}
          setFilterStatus={setFilterStatus}
        />

        {/* Content */}
        <div className="space-y-4">
          {viewMode === 'test-groups' ? (
            // Test Groups View
            filteredTestGroups.length > 0 ? (
              filteredTestGroups.map(group => <FullTestGroupItem key={group.id} group={group} />)
            ) : (
              <div className="card">
                <div className="card-body text-center py-12">
                  <div className="w-12 h-12 text-neutral-400 mx-auto mb-4 flex items-center justify-center">
                    <FileText className="w-12 h-12" />
                  </div>
                  <h3 className="text-lg font-medium text-neutral-900 mb-2">No test groups found</h3>
                  <p className="text-neutral-600">
                    {searchTerm || filterType !== 'all'
                      ? 'Try changing filters to see more test groups'
                      : 'No test groups have been assigned to you'}
                  </p>
                </div>
              </div>
            )
          ) : // Individual Tests View
          filteredTests.length > 0 ? (
            filteredTests.map(test => <IndividualTestItem key={test.id} test={test} />)
          ) : (
            <div className="card">
              <div className="card-body text-center py-12">
                <FileText className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-neutral-900 mb-2">No tests found</h3>
                <p className="text-neutral-600">
                  {searchTerm || filterType !== 'all' || filterStatus !== 'all'
                    ? 'Try changing filters to see more tests'
                    : 'No tests have been assigned to you'}
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
