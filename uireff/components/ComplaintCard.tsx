"use client"

import { motion } from "framer-motion"
import { Clock, User, Tag, ThumbsUp, ThumbsDown, Play } from "lucide-react"

interface ComplaintCardProps {
  complaint: any
  categories: string[]
  isOfficial: boolean
  proposals: any[]
  onProposeAction: (complaintId: number, isEscalation: boolean) => void
  onVote: (proposalId: number, support: boolean) => void
  onExecuteProposal: (proposalId: number) => void
  index: number
}

export default function ComplaintCard({
  complaint,
  categories,
  isOfficial,
  proposals,
  onProposeAction,
  onVote,
  onExecuteProposal,
  index,
}: ComplaintCardProps) {
  const formatAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`
  const formatDate = (timestamp: number) => new Date(timestamp).toLocaleDateString()

  const getStatusColor = (status: number) => {
    switch (status) {
      case 0:
        return "status-submitted"
      case 1:
        return "status-resolved"
      case 2:
        return "status-escalated"
      default:
        return "status-submitted"
    }
  }

  const getStatusText = (status: number) => {
    switch (status) {
      case 0:
        return "Submitted"
      case 1:
        return "Resolved"
      case 2:
        return "Escalated"
      default:
        return "Unknown"
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 card-hover"
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center text-white font-bold">
            #{complaint.id}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(complaint.status)}`}>
                {getStatusText(complaint.status)}
              </span>
              <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                <Tag className="w-3 h-3 inline mr-1" />
                {categories[complaint.category] || "Other"}
              </span>
            </div>
          </div>
        </div>

        {/* Official Actions */}
        {isOfficial && complaint.status === 0 && (
          <div className="flex space-x-2">
            <button
              onClick={() => onProposeAction(complaint.id, false)}
              className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded-lg hover:bg-green-200 transition-colors"
            >
              Propose Resolve
            </button>
            <button
              onClick={() => onProposeAction(complaint.id, true)}
              className="px-3 py-1 bg-red-100 text-red-700 text-sm rounded-lg hover:bg-red-200 transition-colors"
            >
              Propose Escalate
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <p className="text-gray-900 font-medium text-lg mb-4 leading-relaxed">{complaint.description}</p>

      {/* Meta */}
      <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
        <div className="flex items-center space-x-1">
          <User className="w-4 h-4" />
          <span>{formatAddress(complaint.complainant)}</span>
        </div>
        <div className="flex items-center space-x-1">
          <Clock className="w-4 h-4" />
          <span>{formatDate(complaint.timestamp)}</span>
        </div>
      </div>

      {/* Proposals */}
      {proposals.length > 0 && (
        <div className="border-t border-gray-100 pt-4 mt-4 space-y-4">
          <h4 className="font-medium text-gray-900">Active Proposals</h4>
          {proposals.map((proposal) => (
            <div key={proposal.id} className="bg-gray-50 rounded-xl p-4">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center space-x-2">
                  <span
                    className={`px-2 py-1 rounded-lg text-xs font-medium ${
                      proposal.isEscalation ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                    }`}
                  >
                    {proposal.isEscalation ? "🚨 Escalation" : "✅ Resolution"} Proposal #{proposal.id}
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  Ends: {new Date(proposal.voteEnd * 1000).toLocaleDateString()}
                </div>
              </div>

              {/* Vote Progress */}
              <div className="mb-3">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>For: {proposal.forVotes}</span>
                  <span>Against: {proposal.againstVotes}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${(proposal.forVotes / (proposal.forVotes + proposal.againstVotes || 1)) * 100}%`,
                    }}
                  />
                </div>
              </div>

              {/* Voting Actions */}
              {isOfficial && !proposal.executed && (
                <div className="flex items-center space-x-2">
                  {proposal.voteEnd > Math.floor(Date.now() / 1000) ? (
                    <>
                      <button
                        onClick={() => onVote(proposal.id, true)}
                        className="flex items-center space-x-1 px-3 py-1 bg-green-100 text-green-700 text-sm rounded-lg hover:bg-green-200 transition-colors"
                      >
                        <ThumbsUp className="w-3 h-3" />
                        <span>Vote For</span>
                      </button>
                      <button
                        onClick={() => onVote(proposal.id, false)}
                        className="flex items-center space-x-1 px-3 py-1 bg-red-100 text-red-700 text-sm rounded-lg hover:bg-red-200 transition-colors"
                      >
                        <ThumbsDown className="w-3 h-3" />
                        <span>Vote Against</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">Voting Closed</span>
                      {!proposal.executed && (
                        <button
                          onClick={() => onExecuteProposal(proposal.id)}
                          className="flex items-center space-x-1 px-3 py-1 bg-purple-100 text-purple-700 text-sm rounded-lg hover:bg-purple-200 transition-colors"
                        >
                          <Play className="w-3 h-3" />
                          <span>Execute</span>
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </motion.div>
  )
}
