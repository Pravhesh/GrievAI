"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { FileText, Users, Vote, CheckCircle, Send, Eye } from "lucide-react"
import { ethers, BrowserProvider, Contract } from "ethers"
import ComplaintRegistryAbi from "@/abi/ComplaintRegistry.json"

import AppHeader from "@/components/AppHeader"
import ComplaintForm from "@/components/ComplaintForm"
import ComplaintCard from "@/components/ComplaintCard"
import ProposalCard from "@/components/ProposalCard"
import LoadingSpinner from "@/components/LoadingSpinner"
import Toast from "@/components/Toast"
import StatsCard from "@/components/StatsCard"

// Contract configuration
const CONTRACT_ADDRESS = "0xd6460d886166a266F9fd42EAa9475a5397831996"
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
  const [filterCriteria, setFilterCriteria] = useState({ category: 'All', status: 'All' })

  // Stats
  const [stats, setStats] = useState({
    totalComplaints: 0,
    resolvedComplaints: 0,
    activeProposals: 0,
    participationRate: 0, // Note: participation rate is hard to calculate on-chain without total official count
  })

  const addToast = (message: string, type: "success" | "error" | "info" = "success") => {
    const id = Date.now() + Math.random()
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => removeToast(id), 5000)
  }

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  const getContract = async (signer = false) => {
    if (!window.ethereum) {
      addToast("Please install MetaMask", "error")
      return null
    }
    const provider = new BrowserProvider(window.ethereum)
    if (signer) {
      const signer = await provider.getSigner()
      return new Contract(CONTRACT_ADDRESS, ComplaintRegistryAbi, signer)
    }
    return new Contract(CONTRACT_ADDRESS, ComplaintRegistryAbi, provider)
  }

  const connectWallet = async () => {
    if (!window.ethereum) {
      addToast("Please install MetaMask to continue", "error")
      return
    }

    try {
      setIsConnecting(true)

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
    } catch (error: any) {
      console.error("Wallet connection error:", error)
      addToast(error.message || "Failed to connect wallet", "error")
    } finally {
      setIsConnecting(false)
    }
  }

  const loadData = async () => {
    try {
      setLoading(true)
      const contract = await getContract()
      if (!contract) return

      const [complaintCountBigInt, proposalCountBigInt, isUserOfficial] = await Promise.all([
        contract.complaintCount(),
        contract.proposalCount(),
        account ? contract.officials(account) : Promise.resolve(false),
      ])

      const complaintCount = Number(complaintCountBigInt)
      const proposalCount = Number(proposalCountBigInt)

      const complaintsPromises = []
      for (let i = 1; i <= complaintCount; i++) {
        complaintsPromises.push(contract.getComplaint(i))
      }

      const proposalsPromises = []
      for (let i = 1; i <= proposalCount; i++) {
        proposalsPromises.push(contract.proposals(i))
      }

      const rawComplaints = await Promise.all(complaintsPromises)
      const rawProposals = await Promise.all(proposalsPromises)

      const parsedComplaints = rawComplaints.map((c, i) => ({
        id: i + 1,
        description: c.description,
        category: Number(c.category),
        status: Number(c.status),
        complainant: c.complainant,
        timestamp: Number(c.timestamp) * 1000,
      })).filter(c => c.timestamp > 0).reverse() // Filter out empty complaints and reverse to show newest first

      const parsedProposals = rawProposals.map((p, i) => ({
        id: i + 1,
        complaintId: p.complaintId.toString(),
        isEscalation: p.isEscalation,
        forVotes: Number(p.forVotes),
        againstVotes: Number(p.againstVotes),
        executed: p.executed,
        voteEnd: Number(p.voteEnd),
      })).reverse() // show newest first

      setComplaints(parsedComplaints)
      setProposals(parsedProposals)
      setIsOfficial(isUserOfficial)

      setStats({
        totalComplaints: parsedComplaints.length,
        resolvedComplaints: parsedComplaints.filter((c) => c.status === 1).length,
        activeProposals: parsedProposals.filter((p) => !p.executed).length,
        participationRate: 0, // Cannot calculate easily
      })

    } catch (error: any) {
      console.error("Error loading blockchain data:", error)
      addToast(error.message || "Failed to load blockchain data.", "error")
    } finally {
      setLoading(false)
    }
  }

  const handleTransaction = async (tx: any, successMessage: string) => {
    try {
      setLoading(true)
      addToast("Sending transaction...", "info")
      const receipt = await tx.wait()
      addToast(successMessage, "success")
      console.log("Transaction receipt:", receipt)
      await loadData() // Refresh data after successful transaction
    } catch (error) {
      console.error("Transaction failed:", error)
      addToast(error.reason || error.message || "Transaction failed", "error")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitComplaint = async (text: string, proofData: any) => {
    if (!account) {
      addToast("Please connect your wallet first", "error")
      return
    }

    let predictedCategory = "Other"
    try {
      setLoading(true)
      const res = await fetch("/api/classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, labels: categories }),
      });
      if (res.ok) {
        const data = await res.json()
        predictedCategory = data.label || "Other"
      } else {
        addToast("AI service failed, defaulting to 'Other'", "info")
      }
    } catch (aiErr) {
      console.warn("AI service unavailable, defaulting to Other")
      addToast("AI service unavailable, defaulting to 'Other'", "info")
    } finally {
      setLoading(false)
    }

    const categoryIndex = categories.indexOf(predictedCategory)
    const contract = await getContract(true)
    if (!contract) return

    const tx = await contract.submitComplaint(text, categoryIndex)
    await handleTransaction(tx, `Complaint submitted! Category: ${predictedCategory}`)
  }

  const handleProposeAction = async (complaintId: number, isEscalation: boolean) => {
    const contract = await getContract(true)
    if (!contract) return
    const tx = await contract.proposeAction(complaintId, isEscalation)
    await handleTransaction(tx, `Proposal to ${isEscalation ? "escalate" : "resolve"} created!`)
  }

  const handleVote = async (proposalId: number, support: boolean) => {
    const contract = await getContract(true)
    if (!contract) return
    const tx = await contract.castVote(proposalId, support)
    await handleTransaction(tx, `Vote ${support ? "for" : "against"} proposal submitted!`)
  }

  const handleExecuteProposal = async (proposalId: number) => {
    const contract = await getContract(true)
    if (!contract) return
    const tx = await contract.executeProposal(proposalId)
    await handleTransaction(tx, "Proposal executed successfully!")
  }

  const filterComplaints = () => {
    return complaints.filter(complaint => {
      const categoryMatch = filterCriteria.category === 'All' || complaint.category === categories.indexOf(filterCriteria.category);
      const statusMatch = filterCriteria.status === 'All' || complaint.status === parseInt(filterCriteria.status);
      return categoryMatch && statusMatch;
    });
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilterCriteria(prev => ({ ...prev, [name]: value }));
  };

  const filteredComplaints = filterComplaints();

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
                  <select name="category" onChange={handleFilterChange} value={filterCriteria.category}>
                    <option value="All">All Categories</option>
                    {categories.map((cat, index) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <select name="status" onChange={handleFilterChange} value={filterCriteria.status}>
                    <option value="All">All Statuses</option>
                    <option value="0">Submitted</option>
                    <option value="1">Resolved</option>
                    <option value="2">Escalated</option>
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
                  {filteredComplaints.map((complaint, index) => (
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
