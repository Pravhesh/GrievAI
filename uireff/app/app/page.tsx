"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { FileText, Users, Vote, CheckCircle, Send, Eye } from "lucide-react"

import AppHeader from "@/components/AppHeader"
import ComplaintForm from "@/components/ComplaintForm"
import ComplaintCard from "@/components/ComplaintCard"
import ProposalCard from "@/components/ProposalCard"
import LoadingSpinner from "@/components/LoadingSpinner"
import Toast from "@/components/Toast"
import StatsCard from "@/components/StatsCard"

// Contract configuration
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "0x5FbDB2315678afecb367f032d93F642f64180aa3"
const SEPOLIA_CHAIN_ID = "0xaa36a7"
const SEPOLIA_RPC_URL = process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || "https://sepolia.infura.io/v3/YOUR_PROJECT_ID"

const categories = ["Water", "Road", "Electricity", "Sanitation", "Health", "Education", "Other"]

export default function AppPage() {
  const [account, setAccount] = useState<string | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [activeTab, setActiveTab] = useState<"submit" | "complaints" | "governance">("submit")
  const [complaints, setComplaints] = useState<any[]>([])
  const [proposals, setProposals] = useState<any[]>([])
  const [isOfficial, setIsOfficial] = useState(false)
  const [loading, setLoading] = useState(false)
  const [toasts, setToasts] = useState<any[]>([])

  // Stats
  const [stats, setStats] = useState({
    totalComplaints: 0,
    resolvedComplaints: 0,
    activeProposals: 0,
    participationRate: 0,
  })

  const addToast = (message: string, type: "success" | "error" | "info" = "success") => {
    const id = Date.now() + Math.random()
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => removeToast(id), 4000)
  }

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  const connectWallet = async () => {
    if (!window.ethereum) {
      addToast("Please install MetaMask to continue", "error")
      return
    }

    try {
      setIsConnecting(true)

      // Check and switch to Sepolia if needed
      const chainId = await window.ethereum.request({ method: "eth_chainId" })
      if (chainId !== SEPOLIA_CHAIN_ID) {
        try {
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: SEPOLIA_CHAIN_ID }],
          })
        } catch (switchError: any) {
          if (switchError.code === 4902) {
            await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [
                {
                  chainId: SEPOLIA_CHAIN_ID,
                  chainName: "Sepolia Testnet",
                  rpcUrls: [SEPOLIA_RPC_URL],
                  nativeCurrency: { name: "SepoliaETH", symbol: "ETH", decimals: 18 },
                  blockExplorerUrls: ["https://sepolia.etherscan.io"],
                },
              ],
            })
          } else {
            throw switchError
          }
        }
      }

      const [address] = await window.ethereum.request({ method: "eth_requestAccounts" })
      setAccount(address)
      addToast("Wallet connected successfully!", "success")

      // Load data after connection
      await loadData()
    } catch (error: any) {
      console.error("Wallet connection error:", error)
      addToast("Failed to connect wallet", "error")
    } finally {
      setIsConnecting(false)
    }
  }

  const loadData = async () => {
    try {
      setLoading(true)

      // Mock data for demonstration
      const mockComplaints = [
        {
          id: 1,
          description: "Water leakage in main street causing traffic issues",
          category: 0,
          status: 0,
          complainant: "0x1234...5678",
          timestamp: Date.now() - 86400000,
        },
        {
          id: 2,
          description: "Broken streetlight near school area",
          category: 2,
          status: 1,
          complainant: "0x8765...4321",
          timestamp: Date.now() - 172800000,
        },
      ]

      const mockProposals = [
        {
          id: 1,
          complaintId: "1",
          isEscalation: false,
          forVotes: 15,
          againstVotes: 3,
          executed: false,
          voteEnd: Math.floor(Date.now() / 1000) + 86400,
        },
      ]

      setComplaints(mockComplaints)
      setProposals(mockProposals)
      setStats({
        totalComplaints: mockComplaints.length,
        resolvedComplaints: mockComplaints.filter((c) => c.status === 1).length,
        activeProposals: mockProposals.filter((p) => !p.executed).length,
        participationRate: 78,
      })

      // Check if user is official (mock)
      setIsOfficial(account?.toLowerCase().includes("a") || false)
    } catch (error) {
      console.error("Error loading data:", error)
      addToast("Failed to load data", "error")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitComplaint = async (text: string) => {
    if (!account) {
      addToast("Please connect your wallet first", "error")
      return
    }

    try {
      setLoading(true)

      // AI Classification (mock)
      let predictedCategory = "Other"
      try {
        // In real implementation, call your AI service
        // const aiResponse = await axios.post('http://localhost:8000/classify', { text })
        // predictedCategory = aiResponse.data.label || 'Other'
        predictedCategory = "Water" // Mock classification
      } catch (aiErr) {
        console.warn("AI service unavailable, defaulting to Other")
      }

      const categoryIndex = categories.indexOf(predictedCategory)

      // Mock blockchain submission
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Add to complaints list
      const newComplaint = {
        id: complaints.length + 1,
        description: text,
        category: categoryIndex,
        status: 0,
        complainant: account,
        timestamp: Date.now(),
      }

      setComplaints((prev) => [newComplaint, ...prev])
      addToast(`Complaint submitted successfully! Category: ${predictedCategory}`, "success")
    } catch (error: any) {
      console.error("Error submitting complaint:", error)
      addToast("Failed to submit complaint", "error")
    } finally {
      setLoading(false)
    }
  }

  const handleProposeAction = async (complaintId: number, isEscalation: boolean) => {
    try {
      setLoading(true)

      // Mock proposal creation
      await new Promise((resolve) => setTimeout(resolve, 1500))

      const newProposal = {
        id: proposals.length + 1,
        complaintId: complaintId.toString(),
        isEscalation,
        forVotes: 0,
        againstVotes: 0,
        executed: false,
        voteEnd: Math.floor(Date.now() / 1000) + 86400,
      }

      setProposals((prev) => [...prev, newProposal])
      addToast(`Proposal to ${isEscalation ? "escalate" : "resolve"} complaint created!`, "success")
    } catch (error) {
      console.error("Error creating proposal:", error)
      addToast("Failed to create proposal", "error")
    } finally {
      setLoading(false)
    }
  }

  const handleVote = async (proposalId: number, support: boolean) => {
    try {
      setLoading(true)

      // Mock voting
      await new Promise((resolve) => setTimeout(resolve, 1000))

      setProposals((prev) =>
        prev.map((p) =>
          p.id === proposalId
            ? {
                ...p,
                forVotes: support ? p.forVotes + 1 : p.forVotes,
                againstVotes: !support ? p.againstVotes + 1 : p.againstVotes,
              }
            : p,
        ),
      )

      addToast(`Vote ${support ? "for" : "against"} proposal submitted!`, "success")
    } catch (error) {
      console.error("Error voting:", error)
      addToast("Failed to submit vote", "error")
    } finally {
      setLoading(false)
    }
  }

  const handleExecuteProposal = async (proposalId: number) => {
    try {
      setLoading(true)

      // Mock execution
      await new Promise((resolve) => setTimeout(resolve, 1500))

      setProposals((prev) => prev.map((p) => (p.id === proposalId ? { ...p, executed: true } : p)))

      addToast("Proposal executed successfully!", "success")
    } catch (error) {
      console.error("Error executing proposal:", error)
      addToast("Failed to execute proposal", "error")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (account) {
      loadData()
    }
  }, [account])

  const tabVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <AppHeader account={account} isConnecting={isConnecting} onConnect={connectWallet} />

      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        {account && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
          >
            <StatsCard
              icon={<FileText className="w-6 h-6" />}
              title="Total Complaints"
              value={stats.totalComplaints}
              color="blue"
            />
            <StatsCard
              icon={<CheckCircle className="w-6 h-6" />}
              title="Resolved"
              value={stats.resolvedComplaints}
              color="green"
            />
            <StatsCard
              icon={<Vote className="w-6 h-6" />}
              title="Active Proposals"
              value={stats.activeProposals}
              color="purple"
            />
            <StatsCard
              icon={<Users className="w-6 h-6" />}
              title="Participation"
              value={`${stats.participationRate}%`}
              color="orange"
            />
          </motion.div>
        )}

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-2xl p-2 shadow-lg border border-gray-100">
            <div className="flex space-x-2">
              {[
                { key: "submit", label: "Submit Complaint", icon: <Send className="w-4 h-4" /> },
                { key: "complaints", label: "View Complaints", icon: <Eye className="w-4 h-4" /> },
                { key: "governance", label: "Governance", icon: <Vote className="w-4 h-4" /> },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                    activeTab === tab.key
                      ? "bg-violet-600 text-white shadow-lg"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === "submit" && (
            <motion.div
              key="submit"
              variants={tabVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ duration: 0.3 }}
            >
              <ComplaintForm onSubmit={handleSubmitComplaint} loading={loading} account={account} />
            </motion.div>
          )}

          {activeTab === "complaints" && (
            <motion.div
              key="complaints"
              variants={tabVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">Community Complaints</h2>
                <div className="flex items-center space-x-4">
                  <select className="input-field max-w-xs">
                    <option>All Categories</option>
                    {categories.map((cat) => (
                      <option key={cat}>{cat}</option>
                    ))}
                  </select>
                  <select className="input-field max-w-xs">
                    <option>All Status</option>
                    <option>Submitted</option>
                    <option>Resolved</option>
                    <option>Escalated</option>
                  </select>
                </div>
              </div>

              {loading ? (
                <div className="grid gap-6">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white rounded-2xl p-6 shadow-lg animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid gap-6">
                  {complaints.map((complaint, index) => (
                    <ComplaintCard
                      key={complaint.id}
                      complaint={complaint}
                      categories={categories}
                      isOfficial={isOfficial}
                      proposals={proposals.filter((p) => p.complaintId === complaint.id.toString())}
                      onProposeAction={handleProposeAction}
                      onVote={handleVote}
                      onExecuteProposal={handleExecuteProposal}
                      index={index}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "governance" && (
            <motion.div
              key="governance"
              variants={tabVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">Governance Proposals</h2>
                {isOfficial && (
                  <div className="bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium">
                    Official Account
                  </div>
                )}
              </div>

              {loading ? (
                <div className="grid gap-6">
                  {[1, 2].map((i) => (
                    <div key={i} className="bg-white rounded-2xl p-6 shadow-lg animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-2/3 mb-4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                      <div className="h-8 bg-gray-200 rounded w-full"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid gap-6">
                  {proposals.map((proposal, index) => (
                    <ProposalCard
                      key={proposal.id}
                      proposal={proposal}
                      complaints={complaints}
                      isOfficial={isOfficial}
                      onVote={handleVote}
                      onExecute={handleExecuteProposal}
                      index={index}
                    />
                  ))}
                  {proposals.length === 0 && (
                    <div className="text-center py-12">
                      <Vote className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-600 mb-2">No Active Proposals</h3>
                      <p className="text-gray-500">Proposals will appear here when officials create them</p>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
          <LoadingSpinner />
        </div>
      )}

      {/* Toast Container */}
      <div className="fixed bottom-6 right-6 space-y-2 z-50">
        <AnimatePresence>
          {toasts.map((toast) => (
            <Toast key={toast.id} message={toast.message} type={toast.type} onClose={() => removeToast(toast.id)} />
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
