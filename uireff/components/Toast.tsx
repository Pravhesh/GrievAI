"use client"

import { motion } from "framer-motion"
import { CheckCircle, XCircle, Info, X } from "lucide-react"

interface ToastProps {
  message: string
  type: "success" | "error" | "info"
  onClose: () => void
}

export default function Toast({ message, type, onClose }: ToastProps) {
  const icons = {
    success: <CheckCircle className="w-5 h-5" />,
    error: <XCircle className="w-5 h-5" />,
    info: <Info className="w-5 h-5" />,
  }

  const colors = {
    success: "bg-green-50 border-green-200 text-green-800",
    error: "bg-red-50 border-red-200 text-red-800",
    info: "bg-blue-50 border-blue-200 text-blue-800",
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 300 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 300 }}
      className={`flex items-center space-x-3 p-4 rounded-xl border shadow-lg max-w-sm ${colors[type]}`}
    >
      {icons[type]}
      <p className="flex-1 text-sm font-medium">{message}</p>
      <button onClick={onClose} className="p-1 hover:bg-black/10 rounded-lg transition-colors">
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  )
}
