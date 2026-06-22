import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import socket from "../socket";
import { API_BASE_URL } from "../config";

export default function JoinLobby() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("public"); // "public" or "private"
  const [publicLobbies, setPublicLobbies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lobbyCode, setLobbyCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (activeTab === "public") {
      fetchPublicLobbies();
    }
  }, [activeTab]);

  useEffect(() => {
    const handleUpdate = () => {
      if (activeTab === "public") {
        fetchPublicLobbies();
      }
    };
    socket.on("publicLobbiesUpdated", handleUpdate);
    return () => {
      socket.off("publicLobbiesUpdated", handleUpdate);
    };
  }, [activeTab]);

  const fetchPublicLobbies = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/");
        return;
      }

      const response = await fetch(`${API_BASE_URL}/lobbies/public`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch public lobbies");
      }

      setPublicLobbies(data);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinLobby = async (code) => {
    const codeToJoin = (code || lobbyCode).trim();
    if (!codeToJoin) {
      setError("Please enter a lobby code");
      return;
    }

    try {
      setJoining(true);
      setError(null);
      const token = localStorage.getItem("token");

      const response = await fetch(`${API_BASE_URL}/lobbies/join`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          code: codeToJoin,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to join lobby");
      }

      navigate(`/lobby/${data.lobby.code}`);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setJoining(false);
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case "Easy":
        return "bg-green-500/10 text-green-400 border border-green-500/20";
      case "Medium":
        return "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20";
      case "Hard":
        return "bg-red-500/10 text-red-400 border border-red-500/20";
      default:
        return "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20";
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-16 relative overflow-hidden flex flex-col">
      {/* Decorative Aurora background glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-900/15 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-violet-900/15 blur-[120px] pointer-events-none"></div>

      {/* Navbar */}
      <nav className="bg-slate-900/60 backdrop-blur-xl border-b border-slate-900 px-6 py-4.5 sticky top-0 z-50 shrink-0">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/dashboard")}
              className="text-slate-400 hover:text-white transition p-2 hover:bg-slate-800 rounded-lg cursor-pointer"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <h1 className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">
              Join a Clash
            </h1>
          </div>

          <Link
            to="/dashboard"
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/50 font-semibold px-4.5 py-2 rounded-xl transition text-sm shadow-md"
          >
            Dashboard
          </Link>
        </div>
      </nav>

      {/* Main Container */}
      <div className="max-w-4xl mx-auto w-full px-6 mt-10 relative z-10 flex-1 flex flex-col min-h-0">
        
        {/* Toggle Switch */}
        <div className="flex bg-slate-900/50 border border-slate-800/80 p-1 rounded-2xl w-full max-w-sm mx-auto mb-10 shadow-lg backdrop-blur-xl shrink-0">
          <button
            onClick={() => {
              setActiveTab("public");
              setError(null);
            }}
            className={`flex-1 py-3 text-sm font-bold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer outline-none focus:outline-none ${
              activeTab === "public"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
            </svg>
            Public Lobbies
          </button>
          <button
            onClick={() => {
              setActiveTab("private");
              setError(null);
            }}
            className={`flex-1 py-3 text-sm font-bold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer outline-none focus:outline-none ${
              activeTab === "private"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Private Lobby
          </button>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl p-4 mb-6 flex items-center gap-2 max-w-2xl mx-auto animate-slide-in shrink-0">
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="font-semibold text-xs">{error}</span>
          </div>
        )}

        {/* Dynamic Content */}
        <div className="max-w-2xl mx-auto w-full flex-1 flex flex-col min-h-0">
          {activeTab === "public" ? (
            /* PUBLIC LOBBIES TAB */
            loading ? (
              <div className="flex flex-col items-center justify-center py-20 shrink-0">
                <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-slate-400 mt-4 font-semibold text-sm">Scanning public lobbies...</p>
              </div>
            ) : publicLobbies.length === 0 ? (
              <div className="text-center py-16 bg-slate-900/40 border border-slate-800 rounded-3xl p-8 animate-slide-in shadow-xl backdrop-blur-sm shrink-0">
                <div className="bg-slate-950/50 border border-slate-800 w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-inner">
                  <svg className="w-7 h-7 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0a2 2 0 01-2 2H6a2 2 0 01-2-2m16 0V9a2 2 0 00-2-2H6a2 2 0 00-2 2v2m16 4h-2a2 2 0 00-2 2v3a2 2 0 002 2h2a2 2 0 002-2v-3a2 2 0 00-2-2zm-12 0H6a2 2 0 00-2 2v3a2 2 0 002 2h2a2 2 0 002-2v-3a2 2 0 00-2-2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-extrabold text-slate-100 tracking-tight">No Open Lobbies</h3>
                <p className="text-slate-400 mt-2 max-w-sm mx-auto text-sm font-medium leading-relaxed">
                  There are currently no public game lobbies waiting for players. Start one yourself and invite others!
                </p>
                <Link
                  to="/create-lobby"
                  className="inline-block mt-6 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold px-5 py-3 rounded-xl transition shadow-lg shadow-indigo-600/15 transform hover:scale-[1.02]"
                >
                  Create Public Lobby
                </Link>
              </div>
            ) : (
              <div className="space-y-4 animate-slide-in flex-1 flex flex-col min-h-0">
                <div className="flex justify-between items-center mb-2 shrink-0">
                  <h2 className="text-lg font-extrabold text-white tracking-tight">Open Public Lobbies ({publicLobbies.length})</h2>
                  <button
                    onClick={fetchPublicLobbies}
                    className="text-indigo-400 hover:text-indigo-300 text-xs font-bold flex items-center gap-1.5 p-1.5 hover:bg-slate-800/40 rounded-lg transition cursor-pointer"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H18.2" />
                    </svg>
                    Refresh
                  </button>
                </div>

                <div className="space-y-4 overflow-y-auto pr-1 flex-1 min-h-0 scrollbar-thin pb-4">
                  {publicLobbies.map((lobby) => {
                    const isFull = lobby.participants?.length >= (lobby.maxPlayers || 10);
                    return (
                      <div
                        key={lobby._id}
                        className="bg-slate-900/40 border border-slate-800/85 hover:border-indigo-500/30 rounded-2xl p-5 flex flex-col sm:flex-row justify-between sm:items-center gap-4 transition-all duration-200 group backdrop-blur-sm shadow-md hover:shadow-lg"
                      >
                        <div className="space-y-2.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded font-mono font-bold">
                              CODE: {lobby.code}
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${getDifficultyColor(lobby.difficulty)}`}>
                              {lobby.difficulty}
                            </span>
                            <span className="text-slate-400 text-xs font-semibold">
                              • Host: {lobby.host?.username || "Anonymous"}
                            </span>
                          </div>

                          {/* Description of Lobby */}
                          <div className="flex items-center gap-3 text-slate-300 text-sm flex-wrap">
                            <span className="flex items-center gap-1.5 bg-slate-950/40 border border-slate-800/60 px-3 py-1 rounded-xl shadow-inner">
                              <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                              </svg>
                              Clash of <strong className="text-indigo-400 font-extrabold">{lobby.questionCount}</strong> problems
                            </span>
                            <span className="flex items-center gap-1.5 bg-slate-950/40 border border-slate-800/60 px-3 py-1 rounded-xl shadow-inner">
                              <svg className="w-4 h-4 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              in <strong className="text-violet-400 font-extrabold">{lobby.duration}</strong> minutes
                            </span>
                          </div>

                          {/* Topics covered */}
                          {lobby.topics && lobby.topics.length > 0 && (
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {lobby.topics.map((topic, i) => (
                                <span
                                  key={i}
                                  className="px-3 py-1.5 rounded-xl border text-xs font-semibold bg-indigo-600/15 border-indigo-500/30 text-indigo-300 shadow-sm"
                                >
                                  {topic}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 border-slate-800 pt-3 sm:pt-0 shrink-0">
                          <div className="text-left sm:text-right">
                            <p className="text-xxs text-slate-500 uppercase tracking-wider font-semibold">Players</p>
                            <p className="text-sm font-bold text-slate-300">
                              {lobby.participants?.length || 1} / {lobby.maxPlayers || 10} joined
                            </p>
                          </div>

                          <button
                            onClick={() => handleJoinLobby(lobby.code)}
                            disabled={joining || isFull}
                            className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-800 disabled:text-slate-500 disabled:border disabled:border-slate-700/50 text-xs font-bold px-4.5 py-2.5 rounded-xl transition shadow-lg shadow-indigo-600/10 shrink-0 transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                          >
                            {isFull ? "Lobby Full" : "Join Clash"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )
          ) : (
            /* PRIVATE LOBBY TAB */
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-8 backdrop-blur-2xl animate-slide-in text-center relative overflow-hidden max-w-lg mx-auto shadow-2xl w-full shrink-0">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-indigo-500/5 to-transparent blur-xl rounded-full"></div>
              <div className="bg-slate-950/50 border border-slate-800 w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-inner">
                <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>

              <h2 className="text-2xl font-extrabold tracking-tight text-white">Join Private Lobby</h2>
              <p className="text-slate-400 text-sm font-medium mt-2 max-w-sm mx-auto leading-relaxed">
                Private lobbies are accessible only via a shared room code. Enter your 6-character room code below.
              </p>

              <div className="mt-8 max-w-xs mx-auto">
                <input
                  type="text"
                  placeholder="ENTER CODE (e.g. AB12XY)"
                  value={lobbyCode}
                  onChange={(e) => setLobbyCode(e.target.value.toUpperCase())}
                  className="w-full text-center tracking-widest font-mono rounded-xl bg-slate-950 border border-slate-800 px-4 py-3.5 text-white outline-none focus:border-indigo-500 transition text-lg uppercase shadow-inner"
                  maxLength={10}
                />

                <button
                  onClick={() => handleJoinLobby()}
                  disabled={joining || !lobbyCode.trim()}
                  className="w-full mt-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:from-indigo-600/40 disabled:to-violet-600/40 text-white font-bold py-3.5 rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/15 cursor-pointer transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  {joining ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Entering Room...
                    </>
                  ) : (
                    "Join Room"
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
