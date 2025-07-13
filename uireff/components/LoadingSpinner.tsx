"use client"

import { motion } from "framer-motion"

export default function LoadingSpinner() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-white rounded-2xl p-8 shadow-2xl border border-gray-100"
    >
      <div className="flex flex-col items-center space-y-4">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-violet-200 rounded-full animate-spin">
            <div className="absolute top-0 left-0 w-12 h-12 border-4 border-transparent border-t-violet-600 rounded-full animate-spin"></div>
          </div>
        </div>
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Processing Transaction</h3>
          <p className="text-sm text-gray-600">Please wait while we process your request...</p>
        </div>
      </div>
    </motion.div>
  )
}
