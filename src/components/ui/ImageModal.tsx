import { useState } from 'react'
import { X, ZoomIn, ZoomOut, RotateCw } from 'lucide-react'

interface ImageModalProps {
  src: string
  alt?: string
  onClose: () => void
}

export function ImageModal({ src, alt = 'Image preview', onClose }: ImageModalProps) {
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)

  const handleZoomIn = () => setZoom(z => Math.min(z + 0.25, 3))
  const handleZoomOut = () => setZoom(z => Math.max(z - 0.25, 0.5))
  const handleRotate = () => setRotation(r => (r + 90) % 360)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 flex flex-col items-center max-w-[95vw] max-h-[90vh]">
        {/* Controls Bar */}
        <div className="flex items-center gap-2 mb-3 bg-graphite-900/90 rounded-full px-4 py-2 border border-graphite-700/80 shadow-xl backdrop-blur-md">
          <button onClick={handleZoomOut} className="p-1.5 rounded-full text-graphite-300 hover:bg-graphite-800 active:scale-95" title="Zoom out">
            <ZoomOut size={18} />
          </button>
          <span className="text-xs font-bold text-graphite-200 min-w-[40px] text-center">{Math.round(zoom * 100)}%</span>
          <button onClick={handleZoomIn} className="p-1.5 rounded-full text-graphite-300 hover:bg-graphite-800 active:scale-95" title="Zoom in">
            <ZoomIn size={18} />
          </button>
          <div className="w-px h-4 bg-graphite-700" />
          <button onClick={handleRotate} className="p-1.5 rounded-full text-graphite-300 hover:bg-graphite-800 active:scale-95" title="Rotate">
            <RotateCw size={18} />
          </button>
          <div className="w-px h-4 bg-graphite-700" />
          <button onClick={onClose} className="p-1.5 rounded-full text-red-400 hover:bg-red-950/60 active:scale-95" title="Close">
            <X size={18} />
          </button>
        </div>

        {/* Image Display */}
        <div className="overflow-auto max-w-full max-h-[75vh] rounded-2xl border border-graphite-800 bg-graphite-950/80 shadow-2xl flex items-center justify-center">
          <img
            src={src}
            alt={alt}
            className="transition-transform duration-200 object-contain max-h-[75vh]"
            style={{
              transform: `scale(${zoom}) rotate(${rotation}deg)`,
              transformOrigin: 'center center',
            }}
          />
        </div>
      </div>
    </div>
  )
}
