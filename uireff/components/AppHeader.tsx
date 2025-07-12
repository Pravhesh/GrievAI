"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowLeft, Wallet } from "lucide-react"

interface AppHeaderProps {
  account: string | null
  isConnecting: boolean
  onConnect: () => void
}

export default function AppHeader({ account, isConnecting, onConnect }: AppHeaderProps) {
  const formatAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Back */}
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors">
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back to Home</span>
            </Link>
            <div className="w-px h-6 bg-gray-300" />
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">G</span>
              </div>
              <span className="text-xl font-bold text-gray-900">GrievAI</span>
            </div>
          </div>

          {/* Wallet Connection */}
          <div className="flex items-center space-x-4">
            {account ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center space-x-3 bg-green-50 border border-green-200 rounded-xl px-4 py-2"
              >
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <Wallet className="w-4 h-4 text-green-600" />
                <span className="font-mono text-sm text-green-800">{formatAddress(account)}</span>
              </motion.div>
            ) : (
              <button
                onClick={onConnect}
                disabled={isConnecting}
                className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Wallet className="w-4 h-4" />
                <span>{isConnecting ? "Connecting..." : "Connect Wallet"}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
