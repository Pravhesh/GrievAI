import { useState } from "react";
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
        } catch (chainErr) {
          console.error(chainErr);
          setError("Blockchain transaction failed");
        }
      }

      // On-chain submission
      if (window.ethereum && account) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, signer);
        const tx = await contract.submitComplaint(text);
        setTxHash(tx.hash);
        await tx.wait();
      }
    } catch (err) {
      console.error(err);
      alert("Error communicating with AI service");
    } finally {
      setLoading(false);
    }
    setText("");
  };

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
    </div>
  );
}

export default App;
