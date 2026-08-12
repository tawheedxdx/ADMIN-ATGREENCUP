import { Inbox } from 'lucide-react'

interface EmptyStateProps {
  title?: string
  message?: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  icon?: React.ReactNode
}

export function EmptyState({
  title = 'No Data Available',
  message,
  description = 'There are no records to display at this time.',
  actionLabel,
  onAction,
  icon,
}: EmptyStateProps) {
  const displayMessage = message || description
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-graphite-900/60 border border-graphite-800/80 rounded-2xl my-4">
      <div className="w-12 h-12 rounded-full bg-graphite-800/80 flex items-center justify-center text-graphite-400 mb-3">
        {icon || <Inbox className="w-6 h-6" />}
      </div>
      <h3 className="text-base font-semibold text-graphite-200 mb-1">{title}</h3>
      <p className="text-xs text-graphite-400 max-w-xs mb-4">{displayMessage}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-semibold shadow-md active:scale-95 transition-all"
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}
