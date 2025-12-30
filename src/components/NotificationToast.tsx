import React from "react"
import { X } from "lucide-react"

interface NotificationToastProps {
  title: string
  time?: string
  onClose: () => void
  onClick: () => void
}

export const NotificationToast: React.FC<NotificationToastProps> = ({
  title,
  time,
  onClose,
  onClick
}) => {
  return (
    <div
      className="fixed bottom-4 right-4 z-[60] animate-in fade-in slide-in-from-bottom-4"
    >
      <div
        onClick={onClick}
        className="bg-white shadow-xl border border-gray-200 rounded-xl px-4 py-3 w-72 
        flex items-start gap-3 cursor-pointer hover:bg-gray-50 active:scale-[0.98] transition"
      >
        <div className="mt-1 h-2 w-2 rounded-full bg-blue-600" />

        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-900">{title}</p>
          {time && <p className="text-xs text-gray-500 mt-1">{time}</p>}
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation()
            onClose()
          }}
          className="p-1 rounded hover:bg-gray-100"
        >
          <X className="h-4 w-4 text-gray-500" />
        </button>
      </div>
    </div>
  )
}
