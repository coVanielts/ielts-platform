import { getTypeColor, getTypeIcon } from '@/components/dashboard/IndividualTestItem'
import { UserTest } from '@/hooks/useUserTests'
import { Clock } from 'lucide-react'

interface IncludedTestItemProps {
  test: { id: string | number; name: string; type: string; time_limit?: number; status?: UserTest['status'] }
  isCompleted: boolean
}

export default function IncludedTestItem({ test, isCompleted }: IncludedTestItemProps) {
  const type = test.type.toLowerCase() as UserTest['type']

  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-lg border ${
        isCompleted ? 'border-green-200 bg-green-50' : 'border-neutral-200 bg-white'
      }`}>
      <div className={`w-8 h-8 rounded flex items-center justify-center ${getTypeColor(type)}`}>
        {getTypeIcon(type)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="text-sm text-neutral-800 truncate">{test.name}</span>
          <span className={`text-xs font-medium ${isCompleted ? 'text-green-700' : 'text-neutral-500'}`}>
            {isCompleted ? 'Completed' : 'Pending'}
          </span>
        </div>
        <div className="flex items-center gap-3 mt-1 text-[11px] text-neutral-500">
          {typeof test.time_limit === 'number' && test.time_limit > 0 && (
            <span className="inline-flex items-center gap-1">
              <Clock className="w-3 h-3" /> {test.time_limit} min
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
