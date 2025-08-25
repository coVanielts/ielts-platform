import React from 'react'
function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

interface AppHeaderProps {
  title?: React.ReactNode
  subtitle?: React.ReactNode
  left?: React.ReactNode
  right?: React.ReactNode
  sticky?: boolean
  tall?: boolean
  className?: string
}

export default function AppHeader({
  title,
  subtitle,
  left,
  right,
  sticky,
  tall,
  className,
}: AppHeaderProps) {
  return (
  <header className={cx('ielts-header', sticky && 'sticky top-0 z-40', className)}>
      <div className="container">
    <div className={cx('flex items-center justify-between', tall ? 'h-20' : 'h-16')}>
          <div className="flex items-center space-x-4">
            {left}
            {(title || subtitle) && (
              <div>
                {title && <h1 className="text-lg font-semibold text-neutral-900">{title}</h1>}
                {subtitle && <p className="text-sm text-neutral-600">{subtitle}</p>}
              </div>
            )}
          </div>
          {right && <div className="flex items-center space-x-4">{right}</div>}
        </div>
      </div>
    </header>
  )
}
