import { Search } from 'lucide-react'

interface DashboardFiltersProps {
  viewMode: 'tests' | 'test-groups'
  setViewMode: (mode: 'tests' | 'test-groups') => void
  searchTerm: string
  setSearchTerm: (term: string) => void
  filterType: 'all' | 'listening' | 'reading' | 'writing' | 'speaking' | 'full'
  setFilterType: (type: 'all' | 'listening' | 'reading' | 'writing' | 'speaking' | 'full') => void
  filterStatus: 'all' | 'assigned' | 'in_progress' | 'completed' | 'overdue'
  setFilterStatus: (status: 'all' | 'assigned' | 'in_progress' | 'completed' | 'overdue') => void
}

export default function DashboardFilters({
  viewMode,
  setViewMode,
  searchTerm,
  setSearchTerm,
  filterType,
  setFilterType,
  filterStatus,
  setFilterStatus,
}: DashboardFiltersProps) {
  return (
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
                viewMode === 'test-groups' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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
  )
}
