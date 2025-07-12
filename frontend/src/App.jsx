import { useState, useEffect } from "react";
import axios from "axios";
import { ethers } from "ethers";
import contractData from "./contracts/ComplaintRegistry.json";
const abi = contractData.abi;
import { CONTRACT_ADDRESS, SEPOLIA_CHAIN_ID } from "./config";

// Safely normalize contract address (skip checksum if invalid)
let NORMALIZED_ADDRESS;
try {
  NORMALIZED_ADDRESS = ethers.getAddress(CONTRACT_ADDRESS);
} catch (_) {
  // Fallback: use raw address (ethers will still accept it when instantiating a Contract)
  console.warn("Warning: CONTRACT_ADDRESS failed checksum validation; using raw address");
  NORMALIZED_ADDRESS = CONTRACT_ADDRESS.toLowerCase();
}

// Helper to get a Contract instance from any provider or signer
const getContract = (providerOrSigner) => new ethers.Contract(NORMALIZED_ADDRESS, abi, providerOrSigner);
import "./index.css";

// Helper to format addresses
const formatAddress = (addr) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

function App() {
  const [text, setText] = useState("");
  const [aiResult, setAiResult] = useState(null);
  const [error, setError] = useState(null);
  const [txHash, setTxHash] = useState(null);
  const [account, setAccount] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [complaintsLoading, setComplaintsLoading] = useState(false);
  const [isOfficial, setIsOfficial] = useState(false);
  const [proposals, setProposals] = useState([]);

  const categories = [
    "Water",
    "Road",
    "Electricity",
    "Sanitation",
    "Health",
    "Education",
    "Other"
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setAiResult(null);
    setTxHash(null);

    if (!text.trim()) {
      setError("Please enter a complaint");
      return;
    }

    if (!window.ethereum) {
      setError("Please install MetaMask to submit a complaint");
      return;
    }

    try {
      setLoading(true);

      // 1. Get AI classification (fallback to 'Other' if service unavailable)
      let predictedCategory = 'Other';
      try {
        const aiResponse = await axios.post('http://localhost:8000/classify', { text });
        setAiResult(aiResponse.data);
        predictedCategory = aiResponse.data.label || 'Other';
      } catch (aiErr) {
        console.warn('AI service unavailable, defaulting category to Other', aiErr);
        // Keep aiResult null so UI can indicate defaulting
      }
      const categoryIndex = categories.indexOf(predictedCategory);
      
      if (categoryIndex === -1) {
        throw new Error("Failed to determine a valid category for the complaint");
      }

      console.log("Submitting complaint with category:", {
        text,
        category: predictedCategory,
        categoryIndex,
        contractAddress: CONTRACT_ADDRESS
      });

      // 2. Submit to blockchain with AI-determined category
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      const contract = getContract(signer);
      
      console.log("Contract instance created with address:", NORMALIZED_ADDRESS);
      
      // Debug: ensure contract code exists on-chain before submitting
      {
        const code = await provider.getCode(CONTRACT_ADDRESS);
        console.log('🚧 Debug – deployed code length:', code.length);
        if (code === '0x') {
          console.error('❌ No contract code found at address. Did you redeploy?');
          throw new Error('Contract not deployed at specified address');
        }
      }
      
      try {
        const tx = await contract.submitComplaint(text, categoryIndex);
        console.log("Transaction sent:", tx.hash);
        const submittedTx = tx;
        
        setTxHash(submittedTx.hash);
        await submittedTx.wait();
        
        // 3. Refresh complaints
        await loadComplaints(signer);
        
        // Clear form and show success message
        setText("");
        setAiResult(null);
        
        // Show success message with category
        alert(`✅ Complaint submitted successfully!\n\nCategory: ${predictedCategory}`);
      } catch (err) {
        console.error("Error in handleSubmit:", err);
        const errorMessage = err.response?.data?.detail || 
                           err.message || 
                           "Failed to submit complaint";
        setError(errorMessage);
        alert(`❌ Error: ${errorMessage}`);
      } finally {
        setLoading(false);
      }
    } catch (err) {
      console.error("Error in handleSubmit:", err);
      const errorMessage = err.response?.data?.detail || 
                         err.message || 
                         "Failed to submit complaint";
      setError(errorMessage);
      alert(`❌ Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  // Load complaints and check official status
  const loadComplaints = async (signer) => {
    console.log('Attempting to load complaints...');
    if (!window.ethereum) return;
    try {
      setComplaintsLoading(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      console.log('Provider and contract initialized.');
      const contract = getContract(provider);
      
      // Quick debug: is contract deployed?
      const code = await provider.getCode(CONTRACT_ADDRESS);
      console.log('Deployed code length:', code.length);
      if (code === '0x') {
        console.error('No contract code found at address. Did you redeploy?');
      }

      // Load complaints via past events instead of looping through mapping
      console.log('Fetching complaints via events...');
      const submittedEvents = await contract.queryFilter(contract.filters.ComplaintSubmitted());
      const resolvedEvents = await contract.queryFilter(contract.filters.ComplaintResolved());
      const escalatedEvents = await contract.queryFilter(contract.filters.ComplaintEscalated());

      // Build base complaints from ComplaintSubmitted events
      const baseComplaints = await Promise.all(
        submittedEvents.map(async (ev) => {
          const { id, complainant, description, category } = ev.args;
          const block = await provider.getBlock(ev.blockNumber);
          return {
            id: Number(id),
            complainant,
            description,
            category: Number(category),
            timestamp: Number(block.timestamp) * 1000, // to ms for Date()
            status: 0, // Submitted by default; may change below
          };
        })
      );

      const complaintsMap = {};
      baseComplaints.forEach((c) => {
        complaintsMap[c.id] = c;
      });

      // Apply status changes from other events
      resolvedEvents.forEach((ev) => {
        const { id } = ev.args;
        if (complaintsMap[Number(id)]) {
          complaintsMap[Number(id)].status = 1; // Resolved
        }
      });

      escalatedEvents.forEach((ev) => {
        const { id } = ev.args;
        if (complaintsMap[Number(id)]) {
          complaintsMap[Number(id)].status = 2; // Escalated
        }
      });

      const eventComplaints = Object.values(complaintsMap).sort((a, b) => b.timestamp - a.timestamp);
      console.log('Complaints from events:', eventComplaints);
      setComplaints(eventComplaints);
      
      // Load proposals if official
      if (signer) {
        try {
          const signerAddress = await signer.getAddress();
          console.log('Signer address:', signerAddress);
          const officialStatus = await contract.officials(signerAddress);
          console.log('Official status for', signerAddress, ':', officialStatus);
          setIsOfficial(officialStatus);
          
          if (officialStatus) {
            const proposalCount = await contract.proposalCount();
            console.log('Total proposals to load:', proposalCount);
            const proposalIds = Array.from({ length: Number(proposalCount) }, (_, i) => i + 1);
            
            const allProposals = await Promise.all(
              proposalIds.map(async (id) => {
                console.log(`Loading proposal with ID: ${id}`);
                try {
                  const p = await contract.proposals(id);
                  console.log('Proposal loaded:', p);
                  return {
                    id,
                    complaintId: p.complaintId.toString(),
                    isEscalation: p.isEscalation,
                    voteStart: Number(p.voteStart),
                    voteEnd: Number(p.voteEnd),
                    forVotes: Number(p.forVotes),
                    againstVotes: Number(p.againstVotes),
                    executed: p.executed,
                    hasVoted: false
                  };
                } catch (err) {
                  console.error(`Error loading proposal ${id}:`, err);
                  return null;
                }
              })
            ).then(proposals => proposals.filter(p => p !== null));
            console.log('All valid proposals loaded:', allProposals);
            setProposals(allProposals);
          }
        } catch (err) {
          console.error("Error loading official data:", err);
        }
      }
    } catch (err) {
      console.error("Error loading data:", err);
      setError("Failed to load complaints. Please try again later.");
    } finally {
      console.log('Complaints loading complete.');
      setComplaintsLoading(false);
    }
  };

  // Handle proposing an action (resolve/escalate)
  const handleProposeAction = async (complaintId, isEscalation) => {
    if (!window.ethereum) return;
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = getContract(signer);
      
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
    if (!window.ethereum) return alert("MetaMask not detected");
    
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = getContract(signer);
      
      // Check if the voting period is still active
      const proposal = await contract.proposals(proposalId);
      const currentBlock = await provider.getBlockNumber();
      
      if (currentBlock < proposal.voteStart) {
        return alert("Voting has not started yet for this proposal.");
      }
      
      if (currentBlock > proposal.voteEnd) {
        return alert("Voting period has ended for this proposal.");
      }
      
      // Check if already voted (note: this might not be 100% accurate due to ABI limitations)
      // We'll handle the actual voting state on-chain
      
      setLoading(true);
      
      try {
        const tx = await contract.castVote(proposalId, support);
        const receipt = await tx.wait();
        
        if (receipt.status === 1) {
          // Transaction was successful
          await loadComplaints(signer);
          alert(`Successfully voted ${support ? 'for' : 'against'} the proposal!`);
        } else {
          throw new Error("Transaction was not successful");
        }
      } catch (txError) {
        console.error("Transaction error:", txError);
        let errorMessage = txError.message || "Failed to submit vote";
        
        // Try to extract a more specific error message
        if (txError.receipt && txError.receipt.logs) {
          // Check for specific error events if any
          errorMessage = "Transaction reverted. You may have already voted or the voting period may have ended.";
        }
        
        alert(`Error: ${errorMessage}`);
      }
    } catch (err) {
      console.error("Error in handleVote:", err);
      alert(`Failed to vote: ${err.message || "Unknown error occurred"}`);
    } finally {
      setLoading(false);
    }
  };
  
  const handleExecuteProposal = async (proposalId) => {
    if (!window.ethereum) return alert("MetaMask not detected");
    if (!window.confirm("Are you sure you want to execute this proposal? This action cannot be undone.")) return;
    
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = getContract(signer);
      
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
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mb-3"
          rows={4}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="e.g., Water leakage near my house"
        />
        {aiResult && (
          <div className="mb-4 p-3 bg-blue-50 rounded-md">
            <p className="text-sm text-gray-700">
              <span className="font-medium">AI Prediction:</span> This complaint is about "{aiResult.label}" with {Math.round(aiResult.score * 100)}% confidence
            </p>
          </div>
        )}
        <button
          type="submit"
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-2 w-full"
          disabled={loading}
        >
          {loading ? 'Submitting...' : 'Submit Complaint'}
        </button>
      </form>
      {loading && <p className="text-gray-700">Processing...</p>}
      {aiResult && (
        <div className="mt-4 p-4 bg-green-100 rounded">
          <p><strong>Predicted Category:</strong> {aiResult.label}</p>
          <p><strong>Confidence:</strong> {(aiResult.score * 100).toFixed(2)}%</p>
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
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-gray-500">ID #{c.id}</p>
                      <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                        {categories[c.category] || 'Other'}
                      </span>
                    </div>
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
                          {p.forVotes} for / {p.againstVotes} against
                        </span>
                      </div>
                      
                      {isOfficial && (
                        <div className="flex space-x-2 mt-2">
                          <button
                            onClick={() => handleVote(p.id, true)}
                            className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 disabled:opacity-50"
                            disabled={p.executed}
                          >
                            👍 Vote For
                          </button>
                          <button
                            onClick={() => handleVote(p.id, false)}
                            className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 disabled:opacity-50"
                            disabled={p.executed}
                          >
                            👎 Vote Against
                          </button>
                          {isOfficial && p.voteEnd < Math.floor(Date.now() / 1000) && !p.executed && (
                            <button
                              onClick={() => handleExecuteProposal(p.id)}
                              className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200 ml-auto"
                            >
                              🚀 Execute Proposal
                            </button>
                          )}
                        </div>
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
