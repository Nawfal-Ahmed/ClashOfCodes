import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { API_BASE_URL } from "../config";

const TOPICS = [
  "Arrays",
  "Strings",
  "Linked List",
  "Stack",
  "Queue",
  "Hashing",
  "Recursion",
  "Binary Search",
  "Trees",
  "Heap",
  "Graph",
  "Dynamic Programming",
  "Greedy",
  "Backtracking",
];

export default function CreateLobby() {
  const navigate = useNavigate();

  const [questionCount, setQuestionCount] = useState(3);
  const [difficulty, setDifficulty] = useState("Mixed");
  const [visibility, setVisibility] = useState("Private");
  const [duration, setDuration] = useState(30);
  const [selectedTopics, setSelectedTopics] = useState([]);
  const [maxPlayers, setMaxPlayers] = useState(10);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);

  const toggleTopic = (topic) => {
    if (selectedTopics.includes(topic)) {
      setSelectedTopics(selectedTopics.filter((t) => t !== topic));
    } else {
      setSelectedTopics([...selectedTopics, topic]);
    }
  };

  const handleCreateLobby = async (e) => {
    e.preventDefault();
    if (selectedTopics.length === 0) {
      setError("Please select at least one topic");
      return;
    }

    try {
      setCreating(true);
      setError(null);
      const token = localStorage.getItem("token");

      const response = await fetch(`${API_BASE_URL}/lobbies`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          questionCount,
          difficulty,
          visibility,
          duration,
          topics: selectedTopics,
          maxPlayers,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create lobby");
      }

      navigate(`/lobby/${data.lobby.code}`);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-slate-950 text-white overflow-hidden">
      {/* Navbar */}
      <nav className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-6 py-4 shrink-0">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/dashboard")}
              className="text-slate-400 hover:text-white transition p-2 hover:bg-slate-800 rounded-lg cursor-pointer"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
              Create a Clash
            </h1>
          </div>

          <Link
            to="/dashboard"
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium px-4 py-2 rounded-lg transition"
          >
            Dashboard
          </Link>
        </div>
      </nav>

      {/* Main Content Area (Centered Card constrained within viewport) */}
      <div className="flex-1 flex items-center justify-center p-6 min-h-0">
        <div className="w-full max-w-4xl bg-slate-900/60 border border-slate-800 rounded-3xl p-8 backdrop-blur-md flex flex-col h-full max-h-[580px] shadow-2xl justify-between min-h-0 animate-slide-in">
          
          <form onSubmit={handleCreateLobby} className="flex flex-col h-full justify-between min-h-0">
            
            {/* Split layout: Config (Left) vs Topics (Right) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 flex-1 min-h-0 mb-6">
              
              {/* Left Column: Basic Settings */}
              <div className="space-y-5 flex flex-col justify-center">
                
                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl p-3 text-xs flex items-center gap-1.5 animate-slide-in">
                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    {error}
                  </div>
                )}

                {/* Question Count & Duration (Inline Grid) */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">Questions</label>
                    <select
                      value={questionCount}
                      onChange={(e) => setQuestionCount(Number(e.target.value))}
                      className="w-full rounded-xl bg-slate-950 border border-slate-800 px-4 py-3 text-white outline-none focus:border-indigo-500 transition cursor-pointer text-sm"
                    >
                      <option value={1}>1 Question</option>
                      <option value={2}>2 Questions</option>
                      <option value={3}>3 Questions</option>
                      <option value={5}>5 Questions</option>
                      <option value={8}>8 Questions</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">Duration</label>
                    <select
                      value={duration}
                      onChange={(e) => setDuration(Number(e.target.value))}
                      className="w-full rounded-xl bg-slate-950 border border-slate-800 px-4 py-3 text-white outline-none focus:border-indigo-500 transition cursor-pointer text-sm"
                    >
                      <option value={15}>15 Minutes</option>
                      <option value={30}>30 Minutes</option>
                      <option value={45}>45 Minutes</option>
                      <option value={60}>60 Minutes</option>
                      <option value={90}>90 Minutes</option>
                    </select>
                  </div>
                </div>

                {/* Difficulty Selector (Custom Segmented Tabs) */}
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Difficulty</label>
                  <div className="flex bg-slate-950 border border-slate-800 p-1 rounded-xl">
                    {["Easy", "Medium", "Hard", "Mixed"].map((level) => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setDifficulty(level)}
                        className={`flex-1 py-2 text-xs font-semibold rounded-lg transition cursor-pointer outline-none focus:outline-none ${
                          difficulty === level
                            ? "bg-indigo-600 text-white shadow shadow-indigo-600/10"
                            : "text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Visibility Selector (Custom Segmented Tabs) */}
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Visibility</label>
                  <div className="flex bg-slate-950 border border-slate-800 p-1 rounded-xl">
                    {["Private", "Public"].map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setVisibility(type)}
                        className={`flex-1 py-2 text-xs font-semibold rounded-lg transition cursor-pointer outline-none focus:outline-none ${
                          visibility === type
                            ? "bg-indigo-600 text-white shadow shadow-indigo-600/10"
                            : "text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Max Players Selector (Custom Segmented Tabs) */}
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Max Players</label>
                  <div className="flex bg-slate-950 border border-slate-800 p-1 rounded-xl">
                    {[5, 10, 20].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setMaxPlayers(num)}
                        className={`flex-1 py-2 text-xs font-semibold rounded-lg transition cursor-pointer outline-none focus:outline-none ${
                          maxPlayers === num
                            ? "bg-indigo-600 text-white shadow shadow-indigo-600/10"
                            : "text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        {num} Players
                      </button>
                    ))}
                  </div>
                </div>

              </div>

              {/* Right Column: Topics Selector */}
              <div className="flex flex-col min-h-0">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                    Choose Topics ({selectedTopics.length} selected)
                  </label>
                  {selectedTopics.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedTopics([])}
                      className="text-xxs font-bold text-indigo-400 hover:text-indigo-300 transition outline-none focus:outline-none"
                    >
                      Clear All
                    </button>
                  )}
                </div>

                {/* Scrollable grid of topics */}
                <div className="flex-1 overflow-y-auto pr-1 gap-2 flex flex-wrap content-start bg-slate-950/40 border border-slate-800 rounded-2xl p-4 min-h-0 scrollbar-thin">
                  {TOPICS.map((topic) => {
                    const isSelected = selectedTopics.includes(topic);
                    return (
                      <button
                        key={topic}
                        type="button"
                        onClick={() => toggleTopic(topic)}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer outline-none focus:outline-none ${
                          isSelected
                            ? "bg-indigo-600/15 border-indigo-500 text-indigo-300 shadow-sm"
                            : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300"
                        }`}
                      >
                        {topic}
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Submit Button Section */}
            <div className="pt-4 border-t border-slate-800/80 shrink-0 flex justify-end">
              <button
                type="submit"
                disabled={creating}
                className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-600/50 text-white font-bold py-3.5 px-10 rounded-2xl transition shadow-lg shadow-indigo-600/15 flex items-center justify-center gap-2 cursor-pointer outline-none focus:outline-none"
              >
                {creating ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Spawning Arena...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Create Lobby
                  </>
                )}
              </button>
            </div>

          </form>

        </div>
      </div>
    </div>
  );
}