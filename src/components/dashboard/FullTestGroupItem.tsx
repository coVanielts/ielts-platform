import { appPaths } from '@/constants/appPaths'
import { UserTestGroup } from '@/hooks/useUserTestGroups'
import { Clock, FileText, Play, Users } from 'lucide-react'
import Link from 'next/link'
import IncludedTestItem from './IncludedTestItem'

interface FullTestGroupItemProps {
  group: UserTestGroup
}

const ORDER: Array<'listening' | 'reading' | 'writing'> = ['listening', 'reading', 'writing']

export default function FullTestGroupItem({ group }: FullTestGroupItemProps) {
  // Sort tests by the strict order L->R->W
  const sorted = [...group.tests].sort((a, b) => {
    const ia = ORDER.indexOf((a.type as any)?.toLowerCase())
    const ib = ORDER.indexOf((b.type as any)?.toLowerCase())
    return ia - ib
  })

  return (
    <div className="card card-hover">
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
                  <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-700 rounded">Practice</span>
                )}
              </div>
              <div className="flex items-center space-x-6 text-sm text-neutral-600">
                <div className="flex items-center space-x-1">
                  <FileText className="w-4 h-4" />
                  <span>{group.totalTests} tests</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="w-4 h-4" />
                  <span>Total: {group.tests.reduce((acc, test) => acc + (test.time_limit || 0), 0)} min</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {group.status === 'completed' ? (
              <>
                <Link href={`${appPaths.fullTests}/${group.id}/attempts`} className="btn btn-outline">
                  <FileText className="w-4 h-4 mr-2" />
                  View Results
                </Link>
                <Link href={`${appPaths.fullTests}/${group.id}`} className="btn btn-primary">
                  <Play className="w-4 h-4 mr-2" />
                  Take Test Again
                </Link>
              </>
            ) : group.status === 'in_progress' ? (
              <>
                <Link href={`${appPaths.fullTests}/${group.id}/attempts`} className="btn btn-outline btn-sm">
                  <FileText className="w-4 h-4 mr-2" />
                  View History
                </Link>
                <Link href={`${appPaths.fullTests}/${group.id}`} className="btn btn-primary">
                  <Play className="w-4 h-4 mr-2" />
                  Continue
                </Link>
              </>
            ) : (
              <Link
                href={`${appPaths.fullTests}/${group.id}`}
                className={group.status === 'overdue' ? 'btn btn-danger' : 'btn btn-primary'}>
                <Play className="w-4 h-4 mr-2" />
                Start
              </Link>
            )}
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Included Tests</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {sorted.map((test, idx) => (
              <IncludedTestItem
                key={test.id}
                test={{ ...test, status: (test as any).status }}
                isCompleted={idx < group.completedTests}
                isInProgress={idx === group.completedTests && group.status === 'in_progress'}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
