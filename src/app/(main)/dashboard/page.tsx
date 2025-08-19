'use client'

import LogoutButton from '@/components/auth/LogoutButton'
import { appPaths } from '@/constants/appPaths'
import { useUser } from '@/hooks/auth'
import { UserTestGroup, useUserTestGroups } from '@/hooks/useUserTestGroups'
import { UserTest, useUserTests } from '@/hooks/useUserTests'
import {
  BarChart3,
  BookOpen,
  Calendar,
  CheckCircle,
  Clock,
  Eye,
  FileText,
  Headphones,
  Mic,
  PenTool,
  Play,
  Search,
  User,
  Users,
} from 'lucide-react'
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

  const getStatusColor = (status: UserTest['status']) => {
    switch (status) {
      case 'assigned':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'overdue':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusText = (status: UserTest['status']) => {
    switch (status) {
      case 'assigned':
        return 'Assigned'
      case 'in_progress':
        return 'In Progress'
      case 'completed':
        return 'Completed'
      case 'overdue':
        return 'Overdue'
      default:
        return status
    }
  }

  const getTypeIcon = (type: UserTest['type']) => {
    switch (type) {
      case 'listening':
        return <Headphones className="w-5 h-5" />
      case 'reading':
        return <FileText className="w-5 h-5" />
      case 'writing':
        return <PenTool className="w-5 h-5" />
      case 'speaking':
        return <Mic className="w-5 h-5" />
      case 'full':
        return <BookOpen className="w-5 h-5" />
    }
  }

  const getTypeColor = (type: UserTest['type']) => {
    switch (type) {
      case 'listening':
        return 'bg-blue-100 text-blue-700'
      case 'reading':
        return 'bg-green-100 text-green-700'
      case 'writing':
        return 'bg-purple-100 text-purple-700'
      case 'speaking':
        return 'bg-orange-100 text-orange-700'
      case 'full':
        return 'bg-indigo-100 text-indigo-700'
    }
  }

  const getTestGroupProgress = (group: UserTestGroup) => {
    const progressPercentage = group.totalTests > 0 ? (group.completedTests / group.totalTests) * 100 : 0
    return {
      percentage: progressPercentage,
      text: `${group.completedTests}/${group.totalTests} completed`,
    }
  }

  // Mini component for each included test in a full test group
  // Shows quick status (completed/pending), score/band if available, and a direct action
  const IncludedTestItem = ({
    test,
  }: {
    test: { id: string | number; name: string; type: string; time_limit?: number }
  }) => {
    // Lazy import to avoid top-level dependency if not used
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { useTestResults } = require('@/components/api/useTestResults.api')
    const { data: result, isLoading } = useTestResults(String(test.id))

    const hasResult = !!result
    const bandOrPercent = result?.bandScore ?? result?.percentage

    return (
      <div className="flex items-center gap-3 p-3 rounded-lg border border-neutral-200 bg-white hover:border-primary-200 hover:bg-primary-50/40 transition-colors">
        <div
          className={`w-8 h-8 rounded flex items-center justify-center ${getTypeColor(test.type as UserTest['type'])}`}>
          {getTypeIcon(test.type as UserTest['type'])}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-sm text-neutral-800 truncate">{test.name}</span>
            {isLoading ? (
              <span className="text-[10px] text-neutral-400">loading…</span>
            ) : hasResult ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-100 text-green-700">
                <CheckCircle className="w-3 h-3" /> Completed
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-neutral-100 text-neutral-600">
                Pending
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1 text-[11px] text-neutral-500">
            {typeof test.time_limit === 'number' && test.time_limit > 0 && (
              <span className="inline-flex items-center gap-1">
                <Clock className="w-3 h-3" /> {test.time_limit} min
              </span>
            )}
            {bandOrPercent !== undefined && (
              <span className="inline-flex items-center gap-1">
                <BarChart3 className="w-3 h-3" />
                {result?.bandScore !== undefined && result?.bandScore !== null
                  ? `Band ${result.bandScore}`
                  : `${result?.percentage}%`}
              </span>
            )}
          </div>
        </div>
        <Link
          href={hasResult ? `/test/${test.id}/results` : `${appPaths.tests}/${test.id}`}
          className={hasResult ? 'btn btn-outline btn-sm' : 'btn btn-primary btn-sm'}>
          {hasResult ? (
            <>
              <Eye className="w-4 h-4 mr-1" /> View
            </>
          ) : (
            <>
              <Play className="w-4 h-4 mr-1" /> Start
            </>
          )}
        </Link>
      </div>
    )
  }

  if (userLoading || isLoading) {
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
        <div className="card mb-8">
          <div className="card-body">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* View Mode Toggle */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setViewMode('tests')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    viewMode === 'tests' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}>
                  Individual Tests
                </button>
                <button
                  onClick={() => setViewMode('test-groups')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    viewMode === 'test-groups'
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}>
                  Test Groups (Full Tests)
                </button>
              </div>

              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    type="text"
                    placeholder={viewMode === 'tests' ? 'Search tests...' : 'Search test groups...'}
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="form-input pl-10"
                  />
                </div>
              </div>

              {/* Type Filter */}
              <div>
                <select
                  value={filterType}
                  onChange={e => setFilterType(e.target.value as typeof filterType)}
                  className="form-input">
                  <option value="all">All Types</option>
                  <option value="listening">Listening</option>
                  <option value="reading">Reading</option>
                  <option value="writing">Writing</option>
                  <option value="speaking">Speaking</option>
                  <option value="full">Full Test</option>
                </select>
              </div>

              {/* Status Filter - Only for individual tests */}
              {viewMode === 'tests' && (
                <div>
                  <select
                    value={filterStatus}
                    onChange={e => setFilterStatus(e.target.value as typeof filterStatus)}
                    className="form-input">
                    <option value="all">All Statuses</option>
                    <option value="assigned">Assigned</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="overdue">Overdue</option>
                  </select>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-4">
          {viewMode === 'test-groups' ? (
            // Test Groups View
            filteredTestGroups.length > 0 ? (
              filteredTestGroups.map(group => {
                const progress = getTestGroupProgress(group)
                return (
                  <div key={group.id} className="card card-hover">
                    <div className="card-body">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 flex-1">
                          <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-indigo-100 text-indigo-700">
                            <Users className="w-6 h-6" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h3 className="font-semibold text-neutral-900">{group.name}</h3>
                              {group.is_practice_test && (
                                <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-700 rounded">
                                  Practice
                                </span>
                              )}
                            </div>
                            <div className="flex items-center space-x-6 text-sm text-neutral-600 mb-2">
                              <div className="flex items-center space-x-1">
                                <FileText className="w-4 h-4" />
                                <span>{group.totalTests} tests</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Clock className="w-4 h-4" />
                                <span>
                                  Total: {group.tests.reduce((acc, test) => acc + (test.time_limit || 0), 0)} min
                                </span>
                              </div>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                              <div
                                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${progress.percentage}%` }}></div>
                            </div>
                            <p className="text-xs text-neutral-500">{progress.text}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Link href={`/test/full/${group.id}/results`} className="btn btn-outline">
                            <FileText className="w-4 h-4 mr-2" />
                            View Full Results
                          </Link>
                          <Link href={`/test/full/${group.id}`} className="btn btn-primary">
                            <Play className="w-4 h-4 mr-2" />
                            {progress.percentage === 100 ? 'Review' : 'Start Full Test'}
                          </Link>
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Included Tests</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {group.tests.map(test => (
                            <IncludedTestItem key={test.id} test={test} />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="card">
                <div className="card-body text-center py-12">
                  <Users className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
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
            filteredTests.map(test => (
              <div key={test.id} className="card card-hover">
                <div className="card-body">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div
                        className={`w-12 h-12 rounded-lg flex items-center justify-center ${getTypeColor(test.type)}`}>
                        {getTypeIcon(test.type)}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-neutral-900 mb-2">{test.title}</h3>
                        <div className="flex items-center space-x-6 text-sm text-neutral-600">
                          <div className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>{test.duration} min</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <FileText className="w-4 h-4" />
                            <span>{test.totalQuestions} questions</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>Due: {new Date(test.dueDate).toLocaleDateString('en-US')}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(test.status)}`}>
                        {getStatusText(test.status)}
                      </span>
                      <div className="flex items-center space-x-2">
                        {test.status === 'completed' ? (
                          <>
                            <Link href={`/test/${test.id}/attempts`} className="btn btn-outline">
                              <FileText className="w-4 h-4 mr-2" />
                              View Results
                            </Link>
                            <Link
                              href={test.type === 'full' ? `/test/full/${test.id}` : `${appPaths.tests}/${test.id}`}
                              className="btn btn-primary">
                              <Play className="w-4 h-4 mr-2" />
                              Take Test Again
                            </Link>
                          </>
                        ) : test.status === 'in_progress' ? (
                          <>
                            {/* Show history button if test has previous attempts */}
                            <Link href={`/test/${test.id}/attempts`} className="btn btn-outline btn-sm">
                              <FileText className="w-4 h-4 mr-2" />
                              View History
                            </Link>
                            <Link
                              href={test.type === 'full' ? `/test/full/${test.id}` : `${appPaths.tests}/${test.id}`}
                              className="btn btn-primary">
                              <Play className="w-4 h-4 mr-2" />
                              Continue
                            </Link>
                          </>
                        ) : (
                          <Link
                            href={test.type === 'full' ? `/test/full/${test.id}` : `${appPaths.tests}/${test.id}`}
                            className={test.status === 'overdue' ? 'btn btn-danger' : 'btn btn-primary'}>
                            <Play className="w-4 h-4 mr-2" />
                            Start
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
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
