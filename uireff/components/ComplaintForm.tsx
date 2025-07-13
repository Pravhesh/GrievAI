"use client"

import type React from "react"

import { useState } from "react"
import { motion } from "framer-motion"
import { Send, Sparkles, Wallet } from "lucide-react"

interface ComplaintFormProps {
  onSubmit: (text: string, proofData: any) => Promise<void>
  loading: boolean
  account: string | null
}

export default function ComplaintForm({ onSubmit, loading, account }: ComplaintFormProps) {
  const [text, setText] = useState("")
  const [aiPrediction, setAiPrediction] = useState<any>(null)
  const [proofStatus, setProofStatus] = useState('');
  const [ipfsStatus, setIpfsStatus] = useState('');

  const generateProof = async (input: any) => {
    try {
      const res = await fetch("/api/prove", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input }),
      });
      if (!res.ok) throw new Error("Proof generation API failed");
      const data = await res.json();
      return data; // { proof, publicSignals }
    } catch (error) {
      console.error("Error generating proof: ", error);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    setProofStatus('Generating proof...');
    const proofData = await generateProof({ text });
    if (proofData) {
      setProofStatus('Proof generated successfully');
      console.log('ZK Proof generated successfully');
      // Simulate IPFS upload
      setIpfsStatus('Uploading to IPFS...');
      setTimeout(() => {
        setIpfsStatus('Uploaded to IPFS successfully');
      }, 2000);
      await onSubmit(text, proofData);
    } else {
      setProofStatus('Failed to generate proof');
      await onSubmit(text, null);
    }

    setText("");
    setAiPrediction(null);
  }

  const [typingTimer, setTypingTimer] = useState<NodeJS.Timeout | null>(null);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setText(value);

    if (typingTimer) clearTimeout(typingTimer);

    if (value.trim().length < 5) {
      setAiPrediction(null);
      return;
    }

    const newTimer = setTimeout(async () => {
      try {
        const res = await fetch("/api/classify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: value,
            labels: ["Water", "Electricity", "Sanitation", "Corruption", "Other"],
          }),
        });
        if (res.ok) {
          const data = await res.json();
          setAiPrediction({ label: data.label, confidence: data.confidence });
        } else {
          setAiPrediction(null);
        }
      } catch (err) {
        console.error("Classification error", err);
        setAiPrediction(null);
      }
    }, 600); // debounce 600ms

    setTypingTimer(newTimer);
  }

  if (!account) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center">
          <Wallet className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Connect Your Wallet</h3>
          <p className="text-gray-600 mb-6">
            Please connect your wallet to submit complaints and participate in governance.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Make sure you're connected to the Sepolia testnet to interact with the smart
              contract.
            </p>
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl flex items-center justify-center">
            <Send className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Submit a Complaint</h2>
            <p className="text-gray-600">Describe your grievance and let AI help categorize it</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Describe your grievance</label>
            <textarea
              value={text}
              onChange={handleTextChange}
              placeholder="e.g., Water leakage near my house causing traffic issues..."
              className="input-field min-h-[120px] resize-none"
              disabled={loading}
              required
            />
            <p className="text-xs text-gray-500 mt-2">Be specific and detailed to help with accurate categorization</p>
          </div>

          {/* AI Prediction */}
          {aiPrediction && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gradient-to-r from-violet-50 to-indigo-50 border border-violet-200 rounded-xl p-4"
            >
              <div className="flex items-center space-x-2 mb-2">
                <Sparkles className="w-5 h-5 text-violet-600" />
                <span className="font-medium text-violet-900">AI Classification</span>
              </div>
              <p className="text-sm text-violet-800">
                This complaint appears to be about <strong>{aiPrediction.label}</strong> with{' '}
                <strong>{Math.round(aiPrediction.confidence * 100)}%</strong> confidence
              </p>
            </motion.div>
          )}

          {/* Proof and IPFS Status */}
          {proofStatus && <p className="text-sm text-gray-600">Proof Status: {proofStatus}</p>}
          {ipfsStatus && <p className="text-sm text-gray-600">IPFS Status: {ipfsStatus}</p>}

          <button
            type="submit"
            disabled={loading || !text.trim()}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Submitting...</span>
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                <span>Submit Complaint</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-6 bg-gray-50 rounded-xl p-4">
          <h4 className="font-medium text-gray-900 mb-2">What happens next?</h4>
          <ol className="text-sm text-gray-600 space-y-1">
            <li>1. Your complaint is recorded on the blockchain</li>
            <li>2. AI categorizes it for proper routing</li>
            <li>3. Officials can propose resolutions</li>
            <li>4. Community votes on proposals</li>
          </ol>
        </div>
      </div>
    </motion.div>
  )
}
