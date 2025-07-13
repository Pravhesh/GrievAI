"use client"

import { motion } from "framer-motion"
import type { ReactNode } from "react"

interface StatsCardProps {
  icon: ReactNode
  title: string
  value: string | number
  color: "blue" | "green" | "purple" | "orange"
}

export default function StatsCard({ icon, title, value, color }: StatsCardProps) {
  const colorClasses = {
    blue: "from-blue-500 to-cyan-500",
    green: "from-green-500 to-emerald-500",
    purple: "from-purple-500 to-violet-500",
    orange: "from-orange-500 to-amber-500",
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 card-hover"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <div
          className={`w-12 h-12 bg-gradient-to-r ${colorClasses[color]} rounded-xl flex items-center justify-center text-white`}
        >
          {icon}
        </div>
      </div>
    </motion.div>
  )
}
