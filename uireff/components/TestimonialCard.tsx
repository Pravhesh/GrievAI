"use client"

import { motion } from "framer-motion"
import { Star } from "lucide-react"
import Image from "next/image"

interface TestimonialCardProps {
  name: string
  role: string
  content: string
  avatar: string
  index: number
}

export default function TestimonialCard({ name, role, content, avatar, index }: TestimonialCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      viewport={{ once: true }}
      className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 card-hover"
    >
      {/* Stars */}
      <div className="flex space-x-1 mb-6">
        {[...Array(5)].map((_, i) => (
          <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
        ))}
      </div>

      {/* Content */}
      <p className="text-gray-700 leading-relaxed mb-6 italic">"{content}"</p>

      {/* Author */}
      <div className="flex items-center space-x-4">
        <Image src={avatar || "/placeholder.svg"} alt={name} width={48} height={48} className="rounded-full" />
        <div>
          <h4 className="font-semibold text-gray-900">{name}</h4>
          <p className="text-sm text-gray-600">{role}</p>
        </div>
      </div>
    </motion.div>
  )
}
