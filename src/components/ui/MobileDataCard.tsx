interface MobileDataCardProps {
  title: string
  subtitle?: string
  badge?: React.ReactNode
  meta?: { label: string; value: string | number | React.ReactNode }[]
  image?: string
  actions?: React.ReactNode
  onClick?: () => void
  className?: string
}

export function MobileDataCard({
  title,
  subtitle,
  badge,
  meta,
  image,
  actions,
  onClick,
  className = '',
}: MobileDataCardProps) {
  return (
    <div
      onClick={onClick}
      className={`bg-graphite-900/90 border border-graphite-800/90 rounded-2xl p-3.5 space-y-3 shadow-md active:scale-[0.99] transition-all ${
        onClick ? 'cursor-pointer hover:border-graphite-700' : ''
      } ${className}`}
    >
      {/* Top Header: Image / Badge / Title */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {image && (
            <img
              src={image}
              alt={title}
              className="w-12 h-12 rounded-xl object-cover border border-graphite-700/80 bg-graphite-950 flex-shrink-0"
            />
          )}
          <div className="min-w-0">
            <h4 className="text-sm font-bold text-graphite-100 truncate">{title}</h4>
            {subtitle && <p className="text-xs text-graphite-400 truncate">{subtitle}</p>}
          </div>
        </div>
        {badge && <div className="flex-shrink-0">{badge}</div>}
      </div>

      {/* Meta Grid */}
      {meta && meta.length > 0 && (
        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-graphite-800/60">
          {meta.map((item, idx) => (
            <div key={idx} className="bg-graphite-950/40 p-2 rounded-xl border border-graphite-800/40">
              <span className="text-[10px] font-medium text-graphite-500 block uppercase tracking-wider">
                {item.label}
              </span>
              <span className="text-xs font-semibold text-graphite-200 truncate block mt-0.5">
                {item.value || '—'}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Actions Footer */}
      {actions && (
        <div className="pt-2 flex items-center justify-end gap-2 border-t border-graphite-800/60">
          {actions}
        </div>
      )}
    </div>
  )
}
