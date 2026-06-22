import { useNavigate } from "react-router-dom";
import { useEffect, useMemo } from "react";
import { API_BASE_URL } from "../config";

export default function Dashboard() {
  const navigate = useNavigate();

  useEffect(() => {
    const checkActiveLobby = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const response = await fetch(`${API_BASE_URL}/users/active-lobby`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (response.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/");
          return;
        }
        if (response.ok) {
          const data = await response.json();
          if (data.active && data.status === "started") {
            navigate(`/contest/${data.code}`);
          }
        }
      } catch (err) {
        console.error("Check active lobby error:", err);
      }
    };
    checkActiveLobby();
  }, [navigate]);

  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch {
      return null;
    }
  }, []);

  const handleCreateLobby = () => {
    navigate("/create-lobby");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white relative overflow-hidden flex flex-col">
      {/* Decorative Aurora background glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-900/15 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-violet-900/15 blur-[120px] pointer-events-none"></div>

      {/* Navbar */}
      <nav className="bg-slate-900/60 backdrop-blur-xl border-b border-slate-900 px-6 py-4.5 sticky top-0 z-50 shrink-0">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            </div>
            <h1 className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">
              Clash of Codes
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/history")}
              className="text-slate-300 hover:text-white font-semibold text-sm px-4 py-2 hover:bg-slate-800/40 rounded-xl transition cursor-pointer"
            >
              History
            </button>
            <button
              onClick={() => navigate("/profile")}
              className="text-slate-300 hover:text-white font-semibold text-sm px-4 py-2 hover:bg-slate-800/40 rounded-xl transition cursor-pointer"
            >
              Profile
            </button>
            <button
              onClick={handleLogout}
              className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/25 text-red-400 font-semibold text-sm px-4.5 py-2 rounded-xl transition cursor-pointer ml-2 shadow-inner"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-16 relative z-10">
        <div className="w-full max-w-lg bg-slate-900/40 border border-slate-800/80 rounded-[32px] shadow-[0_25px_60px_rgba(0,0,0,0.6)] p-8 md:p-10 backdrop-blur-2xl animate-slide-in relative overflow-hidden">
          {/* Subtle top right light beam */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-indigo-500/10 to-transparent blur-2xl rounded-full"></div>

          <div className="flex flex-col items-center">
            {/* Glowing Icon Badge */}
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600/10 to-violet-600/10 border border-indigo-500/20 flex items-center justify-center mb-6 shadow-inner">
              <svg className="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>

            <p className="text-slate-400 text-sm font-medium text-center max-w-xs leading-relaxed">
              Challenge your limits. Create a game room or join an existing clash lobby.
            </p>

            <div className="w-full flex flex-col gap-4 mt-10">
              <button
                onClick={handleCreateLobby}
                className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-sm tracking-wide py-4 rounded-2xl transition-all duration-200 shadow-[0_10px_25px_rgba(99,102,241,0.25)] hover:shadow-[0_12px_30px_rgba(99,102,241,0.35)] transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
              >
                <svg className="w-4.5 h-4.5 text-indigo-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                </svg>
                CREATE CLASH LOBBY
              </button>

              <button
                onClick={() => navigate("/join-lobby")}
                className="w-full bg-slate-800/40 hover:bg-slate-800/70 text-slate-200 border border-slate-700/50 font-bold text-sm tracking-wide py-4 rounded-2xl transition-all duration-200 shadow-md transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 hover:text-white"
              >
                <svg className="w-4.5 h-4.5 text-slate-400 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 16l-4-4m0 0l4-4m-4 4h14" />
                </svg>
                JOIN EXIST CLASH
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}