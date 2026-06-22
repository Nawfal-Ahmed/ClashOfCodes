import { useEffect, useState } from "react";
import {
  useParams,
  useNavigate,
} from "react-router-dom";
import socket from "../socket";
import { API_BASE_URL } from "../config";

export default function Lobby() {
  const { code } = useParams();
  const navigate = useNavigate();

  const [lobby, setLobby] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showLobbyDeletedModal, setShowLobbyDeletedModal] = useState(false);

  const currentUser = JSON.parse(
    localStorage.getItem("user")
  );

  useEffect(() => {
    fetchLobby();

    socket.emit("joinLobby", code);

    socket.on("connect_error", (err) => {
      console.error("Socket.io Connection Error:", err.message);
    });

    socket.on("lobbyUpdated", fetchLobby);
    
    socket.on("contestStarted", () => {
      navigate(`/contest/${code}`);
    });

    let deleteTimeout;
    socket.on("lobbyDeleted", () => {
      setShowLobbyDeletedModal(true);
      deleteTimeout = setTimeout(() => {
        navigate("/dashboard");
      }, 3000);
    });

    return () => {
      socket.emit("leaveLobby", code);

      socket.off("connect_error");
      socket.off("lobbyUpdated");
      socket.off("lobbyDeleted");
      socket.off("contestStarted");
      if (deleteTimeout) {
        clearTimeout(deleteTimeout);
      }
    };
  }, []);

  const fetchLobby = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_BASE_URL}/lobbies/${code}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message);
      }

      setLobby(data);
    } catch (error) {
      console.error(error);
      alert(error.message);
    }

    setLoading(false);
  };

  const handleLeaveLobby = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `${API_BASE_URL}/lobbies/${code}/leave`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message);
      }

      navigate("/dashboard");
    } catch (error) {
      alert(error.message);
    }
  };

  const handleStartContest = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `${API_BASE_URL}/lobbies/${code}/start`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message);
      }

    } catch (error) {
      alert(error.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white text-xl">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 font-semibold text-sm text-slate-400">Loading Lobby...</p>
      </div>
    );
  }

  if (!lobby) {
    return null;
  }

  const isHost = currentUser?.id === lobby.host._id;

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-16 relative overflow-hidden flex flex-col">
      {/* Decorative Aurora background glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-900/15 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-violet-900/15 blur-[120px] pointer-events-none"></div>

      <div className="max-w-5xl mx-auto w-full px-6 mt-10 relative z-10 flex-1 flex flex-col gap-6 min-h-0">

        {/* Header Card */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 md:p-8 backdrop-blur-2xl shadow-2xl animate-slide-in relative overflow-hidden shrink-0">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-indigo-500/5 to-transparent blur-xl rounded-full"></div>
          
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xxs font-bold bg-indigo-500/10 border border-indigo-500/25 text-indigo-400 tracking-wider uppercase">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></span>
                  Lobby Active
                </span>
              </div>
              <h1 className="text-4xl font-extrabold tracking-tight text-white mt-3">
                Room Code: <span className="font-mono bg-slate-950/60 border border-slate-850 px-3 py-1 rounded-xl text-indigo-400 ml-1 shadow-inner">{lobby.code}</span>
              </h1>
              <p className="text-slate-400 mt-3 font-semibold text-sm">
                Gathering developers. Waiting for the host to start the clash...
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {isHost && (
                <button
                  onClick={handleStartContest}
                  className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white px-6 py-3.5 rounded-2xl font-bold text-sm tracking-wide transition shadow-lg shadow-indigo-600/15 transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                >
                  Start Contest
                </button>
              )}

              <button
                onClick={() => setShowLeaveConfirm(true)}
                className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/25 text-red-400 px-6 py-3.5 rounded-2xl font-bold text-sm tracking-wide transition transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-md"
              >
                Leave Lobby
              </button>
            </div>
          </div>
        </div>

        {/* Split Grid */}
        <div className="grid md:grid-cols-2 gap-6 flex-1 min-h-0 mb-6">

          {/* Players List Card */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 backdrop-blur-2xl shadow-2xl flex flex-col min-h-[300px] md:min-h-0 animate-slide-in">
            <h2 className="text-xl font-extrabold text-white tracking-tight mb-4 flex justify-between items-center shrink-0">
              <span>Connected Players</span>
              <span className="text-sm font-semibold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-lg">
                {lobby.participants.length} / {lobby.maxPlayers || 10}
              </span>
            </h2>

            <div className="space-y-3 overflow-y-auto pr-1 flex-1 min-h-0 scrollbar-thin">
              {lobby.participants.map((player) => (
                <div
                  key={player._id}
                  className="bg-slate-950/40 border border-slate-800 hover:border-slate-700/80 rounded-2xl px-4.5 py-4 flex justify-between items-center transition group shadow-sm"
                >
                  <div className="space-y-1">
                    <p className="text-white font-bold text-sm group-hover:text-indigo-300 transition">
                      {player.username}
                    </p>
                  </div>

                  {player._id === lobby.host._id && (
                    <span className="bg-amber-500/10 border border-amber-500/30 text-amber-400 px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm">
                      👑 Host
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Contest Settings Card */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 backdrop-blur-2xl shadow-2xl flex flex-col min-h-[300px] md:min-h-0 animate-slide-in">
            <h2 className="text-xl font-extrabold text-white tracking-tight mb-4 shrink-0">
              Contest Settings
            </h2>

            <div className="space-y-3.5 overflow-y-auto pr-1 flex-1 min-h-0 scrollbar-thin pb-2">
              <div className="bg-slate-950/40 border border-slate-800 rounded-2xl p-4 flex justify-between items-center shadow-sm">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Questions</span>
                <span className="text-indigo-400 font-extrabold text-lg">{lobby.questionCount}</span>
              </div>

              <div className="bg-slate-950/40 border border-slate-800 rounded-2xl p-4 flex justify-between items-center shadow-sm">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Difficulty Level</span>
                <span className="text-white font-bold text-sm bg-slate-900 border border-slate-800 px-3 py-1 rounded-xl">{lobby.difficulty}</span>
              </div>

              <div className="bg-slate-950/40 border border-slate-800 rounded-2xl p-4 flex justify-between items-center shadow-sm">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Clash Duration</span>
                <span className="text-white font-bold text-sm bg-slate-900 border border-slate-800 px-3 py-1 rounded-xl">{lobby.duration} mins</span>
              </div>

              <div className="bg-slate-950/40 border border-slate-800 rounded-2xl p-4 flex justify-between items-center shadow-sm">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Room Visibility</span>
                <span className="text-white font-bold text-sm bg-slate-900 border border-slate-800 px-3 py-1 rounded-xl">{lobby.visibility}</span>
              </div>

              <div className="bg-slate-950/40 border border-slate-800 rounded-2xl p-4 flex justify-between items-center shadow-sm">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Max Capacity</span>
                <span className="text-white font-bold text-sm bg-slate-900 border border-slate-800 px-3 py-1 rounded-xl">{lobby.maxPlayers || 10} Players</span>
              </div>

              <div className="bg-slate-950/40 border border-slate-800 rounded-2xl p-4 flex flex-col gap-2.5 shadow-sm">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Clash Topics</span>
                <div className="flex flex-wrap gap-2">
                  {lobby.topics.map((topic) => (
                    <span
                      key={topic}
                      className="px-3 py-1.5 rounded-xl border text-xs font-semibold bg-indigo-600/15 border-indigo-500/30 text-indigo-300 shadow-sm"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Leave Confirmation Modal */}
      {showLeaveConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md transition-opacity duration-300">
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl relative overflow-hidden animate-scale-in text-center">
            {/* Red decorative glow */}
            <div className="absolute top-[-20%] left-[-20%] w-[50%] h-[50%] rounded-full bg-red-500/10 blur-[50px] pointer-events-none"></div>
            
            <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6 text-red-400">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
              </svg>
            </div>

            <h3 className="text-2xl font-extrabold text-white mb-3">
              {isHost ? "Delete Lobby?" : "Leave Lobby?"}
            </h3>
            
            <p className="text-slate-400 mb-8 text-sm leading-relaxed">
              {isHost 
                ? "Are you sure you wish to leave? Since you are the host, this will permanently delete the lobby and disconnect all players."
                : "Are you sure you want to leave this lobby? You will have to join again if you want to participate."}
            </p>

            <div className="flex gap-4">
              <button
                onClick={() => setShowLeaveConfirm(false)}
                className="flex-1 py-3.5 px-5 rounded-2xl border border-slate-700 bg-slate-850 hover:bg-slate-800 text-slate-300 font-bold text-sm transition transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowLeaveConfirm(false);
                  handleLeaveLobby();
                }}
                className="flex-1 py-3.5 px-5 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-sm transition transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-lg shadow-red-600/20"
              >
                {isHost ? "Leave & Delete" : "Leave Lobby"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lobby Deleted Modal */}
      {showLobbyDeletedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md transition-opacity duration-300">
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl relative overflow-hidden animate-scale-in text-center">
            {/* Indigo decorative glow */}
            <div className="absolute top-[-20%] left-[-20%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 blur-[50px] pointer-events-none"></div>

            <div className="w-16 h-16 bg-indigo-500/10 border border-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-6 text-indigo-400">
              <svg className="w-8 h-8 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>

            <h3 className="text-2xl font-extrabold text-white mb-3">Lobby Deleted</h3>
            <p className="text-slate-400 mb-8 text-sm leading-relaxed">
              The host has left and the lobby has been disbanded. Returning to the dashboard shortly...
            </p>

            <div className="flex flex-col items-center gap-4">
              <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              
              <button
                onClick={() => navigate("/dashboard")}
                className="w-full mt-4 py-3.5 px-5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-lg shadow-indigo-600/20"
              >
                Return to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}