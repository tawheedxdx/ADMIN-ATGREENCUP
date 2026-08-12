import { useEffect } from 'react'
import { X } from 'lucide-react'

interface BottomSheetProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
}

export function BottomSheet({ isOpen, onClose, title, children }: BottomSheetProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Bottom Sheet Drawer */}
      <div className="relative z-10 w-full max-h-[90vh] bg-graphite-900 border-t border-graphite-700/80 rounded-t-3xl shadow-2xl flex flex-col overflow-hidden animate-slide-up">
        {/* Grab Handle Header */}
        <div className="pt-3 pb-2 px-4 flex flex-col items-center border-b border-graphite-800/80 bg-graphite-900/90">
          <div className="w-12 h-1.5 bg-graphite-700 rounded-full mb-3" />
          <div className="w-full flex items-center justify-between">
            <h3 className="text-base font-bold text-graphite-100">{title || 'Details'}</h3>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-graphite-400 hover:text-graphite-100 hover:bg-graphite-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 overflow-y-auto custom-scrollbar max-h-[calc(90vh-60px)]">
          {children}
        </div>
      </div>
    </div>
  )
}
