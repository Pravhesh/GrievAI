import { useState, useEffect } from "react";
import axios from "axios";
import { ethers } from "ethers";
import abi from "./contracts/ComplaintRegistryABI.json";
import { CONTRACT_ADDRESS, SEPOLIA_CHAIN_ID } from "./config";
import "./index.css";

function App() {
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);
  const [account, setAccount] = useState(null);
  const [txHash, setTxHash] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [complaints, setComplaints] = useState([]);
  const [complaintsLoading, setComplaintsLoading] = useState(false);

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

  // Load complaints from the blockchain
  const loadComplaints = async () => {
    if (!window.ethereum) return;
    try {
      setComplaintsLoading(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, provider);
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
      setComplaints(all.reverse()); // show newest first
    } catch (err) {
      console.error(err);
    } finally {
      setComplaintsLoading(false);
    }
  };

  // Fetch on wallet connect & after transactions
  useEffect(() => {
    if (account) {
      loadComplaints();
    }
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
      {!complaintsLoading && complaints.length > 0 && (
        <div className="w-full max-w-xl mt-6">
          <h2 className="text-xl font-semibold mb-2">Complaints</h2>
          {complaints.map((c) => (
            <div key={c.id} className="bg-white rounded shadow p-4 mb-4">
              <p className="text-sm text-gray-500">ID #{c.id}</p>
              <p className="font-medium">{c.description}</p>
              <p className="text-sm">Status: {['Submitted', 'Resolved', 'Escalated'][c.status]}</p>
              <p className="text-xs text-gray-400">By {c.complainant.slice(0, 6)}...{c.complainant.slice(-4)} on {new Date(c.timestamp * 1000).toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;
