import { useState } from "react";
import axios from "axios";
import "./index.css";

function App() {
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setLoading(true);
    try {
      const res = await axios.post("http://localhost:8000/classify", { text });
      setResult(res.data);
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
      {loading && <p className="text-gray-700">Classifying...</p>}
      {result && (
        <div className="mt-4 p-4 bg-green-100 rounded">
          <p><strong>Predicted Category:</strong> {result.label}</p>
          <p><strong>Confidence:</strong> {(result.score * 100).toFixed(2)}%</p>
        </div>
      )}
    </div>
  );
}

export default App;
