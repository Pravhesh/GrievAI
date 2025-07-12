import { useState, useEffect } from "react";
import axios from "axios";
import { ethers } from "ethers";
import abi from "./contracts/ComplaintRegistryABI.json";
import { CONTRACT_ADDRESS, SEPOLIA_CHAIN_ID } from "./config";
import "./index.css";

// Helper to format addresses
const formatAddress = (addr) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

function App() {
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);
  const [account, setAccount] = useState(null);
  const [txHash, setTxHash] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [complaints, setComplaints] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [complaintsLoading, setComplaintsLoading] = useState(false);
  const [isOfficial, setIsOfficial] = useState(false);

  const handleSubmit = async (e) => {
    setError(null);
    e.preventDefault();
    if (!text.trim()) return;
    setLoading(true);
    try {
      // 1. AI Classification
      let aiRes;
      try {
        const res = await axios.post("http://localhost:8000/classify", { text });
        aiRes = res.data;
        setResult(aiRes);
      } catch (aiErr) {
        console.error(aiErr);
        setError("Failed to contact AI service");
        return;
      }

      // 2. On-chain submission (optional)
      if (window.ethereum && account) {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const signer = await provider.getSigner();
          const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, signer);
          const tx = await contract.submitComplaint(text);
          setTxHash(tx.hash);
          await tx.wait();
          await loadComplaints();
        } catch (chainErr) {
          console.error(chainErr);
          setError("Blockchain transaction failed");
        }
      }

      
    } catch (err) {
      console.error(err);
      alert("Error communicating with AI service");
    } finally {
      setLoading(false);
    }
    setText("");
  };

  // Load complaints and check official status
  const loadComplaints = async (signer) => {
    if (!window.ethereum) return;
    try {
      setComplaintsLoading(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, provider);
      
      // Load complaints
      const count = await contract.complaintCount();
      const total = Number(count);
      const ids = Array.from({ length: total }, (_, i) => i + 1);
      
      const all = await Promise.all(
        ids.map(async (id) => {
          const c = await contract.getComplaint(id);
          return {
            id,
            complainant: c.complainant,
            description: c.description,
            timestamp: Number(c.timestamp),
            status: Number(c.status)
          };
        })
      );
      setComplaints(all.reverse());
      
      // Load proposals if official
      if (signer) {
        const officialStatus = await contract.officials(await signer.getAddress());
        setIsOfficial(officialStatus);
        
        if (officialStatus) {
          const proposalCount = await contract.proposalCount();
          const proposalIds = Array.from({ length: Number(proposalCount) }, (_, i) => i + 1);
          
          const allProposals = await Promise.all(
            proposalIds.map(async (id) => {
              const p = await contract.proposals(id);
              const hasVoted = await contract.hasVoted(id, await signer.getAddress());
              return {
                id,
                complaintId: p.complaintId.toString(),
                isEscalation: p.isEscalation,
                voteStart: Number(p.voteStart),
                voteEnd: Number(p.voteEnd),
                forVotes: Number(p.forVotes),
                againstVotes: Number(p.againstVotes),
                executed: p.executed,
                hasVoted
              };
            })
          );
          setProposals(allProposals);
        }
      }
    } catch (err) {
      console.error("Error loading data:", err);
    } finally {
      setComplaintsLoading(false);
    }
  };

  // Handle proposing an action (resolve/escalate)
  const handleProposeAction = async (complaintId, isEscalation) => {
    if (!window.ethereum) return;
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, signer);
      
      const tx = await contract.proposeAction(complaintId, isEscalation);
      await tx.wait();
      await loadComplaints(signer);
      alert(`Proposal to ${isEscalation ? 'escalate' : 'resolve'} complaint #${complaintId} created!`);
    } catch (err) {
      console.error("Error creating proposal:", err);
      alert("Failed to create proposal: " + (err.reason || err.message));
    }
  };

  // Handle voting on a proposal
  const handleVote = async (proposalId, support) => {
    if (!window.ethereum) return;
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, signer);
      
      const tx = await contract.castVote(proposalId, support);
      await tx.wait();
      await loadComplaints(signer);
      alert(`Vote ${support ? 'for' : 'against'} proposal #${proposalId} recorded!`);
    } catch (err) {
      console.error("Error voting:", err);
      alert("Failed to vote: " + (err.reason || err.message));
    }
  };

  // Handle executing a proposal
  const handleExecuteProposal = async (proposalId) => {
    if (!window.ethereum) return;
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, signer);
      
      const tx = await contract.executeProposal(proposalId);
      await tx.wait();
      await loadComplaints(signer);
      alert(`Proposal #${proposalId} executed successfully!`);
    } catch (err) {
      console.error("Error executing proposal:", err);
      alert("Failed to execute proposal: " + (err.reason || err.message));
    }
  };

  // Fetch data on wallet connect & after transactions
  useEffect(() => {
    const init = async () => {
      if (window.ethereum && account) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        await loadComplaints(signer);
      }
    };
    init();
  }, [account]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-start p-4">
      <h1 className="text-3xl font-bold mb-6">GrievAI</h1>
      {!account && (
        <button
          onClick={async () => {
            if (!window.ethereum) return alert("MetaMask not detected");
            const [addr] = await window.ethereum.request({ method: "eth_requestAccounts" });
            const chainId = await window.ethereum.request({ method: "eth_chainId" });
            if (chainId !== SEPOLIA_CHAIN_ID) {
              return alert("Switch MetaMask to Sepolia network");
            }
            setAccount(addr);
          }}
          className="mb-4 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded"
        >
          Connect Wallet
        </button>
      )}
      {account && <p className="text-sm text-gray-600 mb-2">Connected: {account.slice(0,6)}...{account.slice(-4)}</p>}
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-xl bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4"
      >
        <label className="block text-gray-700 text-sm font-bold mb-2">
          Describe your grievance
        </label>
        <textarea
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          rows={4}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="e.g., Water leakage near my house"
        />
        <button
          type="submit"
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-4"
        >
          Submit Complaint
        </button>
      </form>
      {loading && <p className="text-gray-700">Processing...</p>}
      {result && (
        <div className="mt-4 p-4 bg-green-100 rounded">
          <p><strong>Predicted Category:</strong> {result.label}</p>
          <p><strong>Confidence:</strong> {(result.score * 100).toFixed(2)}%</p>
        </div>
      )}
    {error && (
        <p className="mt-2 text-red-600">{error}</p>
      )}
      {txHash && (
        <p className="mt-2 text-blue-600">
          Transaction submitted: <a className="underline" target="_blank" rel="noopener noreferrer" href={`https://sepolia.etherscan.io/tx/${txHash}`}>{txHash.slice(0,10)}...</a>
        </p>
      )}
      {complaintsLoading && <p className="mt-4 text-gray-700">Loading complaints...</p>}
      {!complaintsLoading && (
        <div className="w-full max-w-4xl mt-6">
          <h2 className="text-2xl font-semibold mb-4">Complaints</h2>
          <div className="grid gap-4">
            {complaints.map((c) => (
              <div key={c.id} className="bg-white rounded-lg shadow-md p-4 border border-gray-100">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-gray-500">ID #{c.id}</p>
                    <p className="font-medium text-lg mt-1">{c.description}</p>
                    <p className="text-sm mt-1">
                      Status: <span className={`font-medium ${
                        c.status === 0 ? 'text-yellow-600' : 
                        c.status === 1 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {['Submitted', 'Resolved', 'Escalated'][c.status]}
                      </span>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      By {formatAddress(c.complainant)} • {new Date(c.timestamp * 1000).toLocaleString()}
                    </p>
                  </div>
                  
                  {isOfficial && c.status === 0 && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleProposeAction(c.id, false)}
                        className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded hover:bg-green-200"
                      >
                        Propose Resolve
                      </button>
                      <button
                        onClick={() => handleProposeAction(c.id, true)}
                        className="px-3 py-1 bg-red-100 text-red-700 text-sm rounded hover:bg-red-200"
                      >
                        Propose Escalate
                      </button>
                    </div>
                  )}
                </div>
                
                {/* Show active proposals for this complaint */}
                {proposals
                  .filter(p => p.complaintId === c.id.toString() && !p.executed)
                  .map(p => (
                    <div key={p.id} className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-sm font-medium">
                        {p.isEscalation ? '🚨 Escalation' : '✅ Resolution'} Proposal #{p.id}
                      </p>
                      <div className="flex items-center mt-1">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full" 
                            style={{ width: `${(p.forVotes / (p.forVotes + p.againstVotes || 1)) * 100}%` }}
                          ></div>
                        </div>
                        <span className="ml-2 text-xs text-gray-600">
                          {p.forVotes} / {p.forVotes + p.againstVotes}
                        </span>
                      </div>
                      
                      {isOfficial && !p.hasVoted && (
                        <div className="flex space-x-2 mt-2">
                          <button
                            onClick={() => handleVote(p.id, true)}
                            className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                          >
                            Vote For
                          </button>
                          <button
                            onClick={() => handleVote(p.id, false)}
                            className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                          >
                            Vote Against
                          </button>
                        </div>
                      )}
                      
                      {isOfficial && p.voteEnd < Math.floor(Date.now() / 1000) && !p.executed && (
                        <button
                          onClick={() => handleExecuteProposal(p.id)}
                          className="mt-2 px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                        >
                          Execute Proposal
                        </button>
                      )}
                    </div>
                  ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
