import { appPaths } from '@/constants/appPaths'
import { UserTest } from '@/hooks/useUserTests'
import { Calendar, Clock, FileText, Headphones, Mic, PenTool, Play } from 'lucide-react'
import Link from 'next/link'

interface IndividualTestItemProps {
  test: UserTest
}

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

export const getTypeIcon = (type: UserTest['type']) => {
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
      return <FileText className="w-5 h-5" />
  }
}

export const getTypeColor = (type: UserTest['type']) => {
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

export default function IndividualTestItem({ test }: IndividualTestItemProps) {
  return (
    <div className="card card-hover">
      <div className="card-body">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${getTypeColor(test.type)}`}>
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
            <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(test.status)}`}>
              {getStatusText(test.status)}
            </span>
            <div className="flex items-center space-x-2">
              {test.status === 'completed' ? (
                <>
                  <Link href={`/test/${test.id}/attempts`} className="btn btn-outline">
                    <FileText className="w-4 h-4 mr-2" />
                    View Results
                  </Link>
                  <Link href={`${appPaths.tests}/${test.id}`} className="btn btn-primary">
                    <Play className="w-4 h-4 mr-2" />
                    Take Test Again
                  </Link>
                </>
              ) : test.status === 'in_progress' ? (
                <>
                  <Link href={`/test/${test.id}/attempts`} className="btn btn-outline btn-sm">
                    <FileText className="w-4 h-4 mr-2" />
                    View History
                  </Link>
                  <Link href={`${appPaths.tests}/${test.id}`} className="btn btn-primary">
                    <Play className="w-4 h-4 mr-2" />
                    Continue
                  </Link>
                </>
              ) : (
                <Link
                  href={`${appPaths.tests}/${test.id}`}
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
  )
}
