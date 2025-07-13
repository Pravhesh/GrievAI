"use client"

import { motion } from "framer-motion"
import { useEffect, useState } from "react"

export default function StatsSection() {
  const [isVisible, setIsVisible] = useState(false)

  const stats = [
    { number: 10000, label: "Complaints Resolved", suffix: "+" },
    { number: 500, label: "Communities Served", suffix: "+" },
    { number: 95, label: "Resolution Rate", suffix: "%" },
    { number: 24, label: "Average Response Time", suffix: "h" },
  ]

  const [animatedNumbers, setAnimatedNumbers] = useState(stats.map(() => 0))

  useEffect(() => {
    if (isVisible) {
      stats.forEach((stat, index) => {
        let start = 0
        const end = stat.number
        const duration = 2000
        const increment = end / (duration / 16)

        const timer = setInterval(() => {
          start += increment
          if (start >= end) {
            start = end
            clearInterval(timer)
          }
          setAnimatedNumbers((prev) => {
            const newNumbers = [...prev]
            newNumbers[index] = Math.floor(start)
            return newNumbers
          })
        }, 16)
      })
    }
  }, [isVisible])

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          onViewportEnter={() => setIsVisible(true)}
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-4 gap-8"
        >
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="text-4xl md:text-5xl font-bold text-violet-600 mb-2">
                {animatedNumbers[index]}
                {stat.suffix}
              </div>
              <div className="text-gray-600 font-medium">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
