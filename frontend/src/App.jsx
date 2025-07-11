import { useState } from "react";
import "./index.css";

function App() {
  const [text, setText] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    // TODO: integrate with backend API
    alert(`Submitted grievance: ${text}`);
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
    </div>
  );
}

export default App;
