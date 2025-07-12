"use client"

import { motion } from "framer-motion"
import { Vote, Clock, ThumbsUp, ThumbsDown, Play, CheckCircle } from "lucide-react"

interface ProposalCardProps {
  proposal: any
  complaints: any[]
  isOfficial: boolean
  onVote: (proposalId: number, support: boolean) => void
  onExecute: (proposalId: number) => void
  index: number
}

export default function ProposalCard({
  proposal,
  complaints,
  isOfficial,
  onVote,
  onExecute,
  index,
}: ProposalCardProps) {
  const relatedComplaint = complaints.find((c) => c.id.toString() === proposal.complaintId)
  const totalVotes = proposal.forVotes + proposal.againstVotes
  const forPercentage = totalVotes > 0 ? (proposal.forVotes / totalVotes) * 100 : 0
  const isVotingActive = proposal.voteEnd > Math.floor(Date.now() / 1000)
  const timeLeft = proposal.voteEnd - Math.floor(Date.now() / 1000)

  const formatTimeLeft = (seconds: number) => {
    if (seconds <= 0) return "Voting ended"
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) return `${hours}h ${minutes}m left`
    return `${minutes}m left`
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
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold ${
              proposal.isEscalation
                ? "bg-gradient-to-r from-red-500 to-pink-500"
                : "bg-gradient-to-r from-green-500 to-emerald-500"
            }`}
          >
            <Vote className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">
              {proposal.isEscalation ? "Escalation" : "Resolution"} Proposal #{proposal.id}
            </h3>
            <p className="text-sm text-gray-600">For Complaint #{proposal.complaintId}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {proposal.executed ? (
            <span className="flex items-center space-x-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
              <CheckCircle className="w-3 h-3" />
              <span>Executed</span>
            </span>
          ) : (
            <span
              className={`flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium ${
                isVotingActive ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"
              }`}
            >
              <Clock className="w-3 h-3" />
              <span>{formatTimeLeft(timeLeft)}</span>
            </span>
          )}
        </div>
      </div>

      {/* Related Complaint */}
      {relatedComplaint && (
        <div className="bg-gray-50 rounded-xl p-4 mb-4">
          <h4 className="font-medium text-gray-900 mb-2">Related Complaint</h4>
          <p className="text-sm text-gray-700 leading-relaxed">{relatedComplaint.description}</p>
        </div>
      )}

      {/* Voting Progress */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Voting Progress</span>
          <span className="text-sm text-gray-600">
            {totalVotes} vote{totalVotes !== 1 ? "s" : ""} cast
          </span>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
          <div
            className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full transition-all duration-500"
            style={{ width: `${forPercentage}%` }}
          />
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-green-600 font-medium">
            For: {proposal.forVotes} ({Math.round(forPercentage)}%)
          </span>
          <span className="text-red-600 font-medium">
            Against: {proposal.againstVotes} ({Math.round(100 - forPercentage)}%)
          </span>
        </div>
      </div>

      {/* Actions */}
      {isOfficial && !proposal.executed && (
        <div className="flex items-center space-x-3">
          {isVotingActive ? (
            <>
              <button
                onClick={() => onVote(proposal.id, true)}
                className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-green-100 text-green-700 rounded-xl hover:bg-green-200 transition-colors font-medium"
              >
                <ThumbsUp className="w-4 h-4" />
                <span>Vote For</span>
              </button>
              <button
                onClick={() => onVote(proposal.id, false)}
                className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-red-100 text-red-700 rounded-xl hover:bg-red-200 transition-colors font-medium"
              >
                <ThumbsDown className="w-4 h-4" />
                <span>Vote Against</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => onExecute(proposal.id)}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-xl hover:bg-purple-200 transition-colors font-medium"
            >
              <Play className="w-4 h-4" />
              <span>Execute Proposal</span>
            </button>
          )}
        </div>
      )}

      {!isOfficial && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
          <p className="text-sm text-blue-800">
            Only officials can vote on proposals. Connect with an official account to participate.
          </p>
        </div>
      )}
    </motion.div>
  )
}
