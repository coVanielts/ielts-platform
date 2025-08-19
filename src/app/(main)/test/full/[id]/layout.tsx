import { ReactNode } from 'react'

interface FullTestLayoutProps {
  children: ReactNode
}

export default function FullTestLayout({ children }: FullTestLayoutProps) {
  return <div className="min-h-screen bg-neutral-50">{children}</div>
}
