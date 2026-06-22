import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { API_BASE_URL } from "../config";

export default function History() {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/");
        return;
      }

      const response = await fetch(`${API_BASE_URL}/lobbies/history`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch contest history");
      }

      setHistory(data);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Compute stats
  const totalContests = history.length;
  const totalPoints = history.reduce((sum, item) => sum + item.userScore, 0);
  const totalSolved = history.reduce((sum, item) => sum + item.solvedCount, 0);
  const avgScore = totalContests > 0 ? Math.round(totalPoints / totalContests) : 0;

  const formatDate = (dateStr) => {
    const options = { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" };
    return new Date(dateStr).toLocaleDateString(undefined, options);
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
    <div className="min-h-screen bg-slate-950 text-white pb-16">
      {/* Navbar */}
      <nav className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-6 py-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/dashboard")}
              className="text-slate-400 hover:text-white transition p-2 hover:bg-slate-800 rounded-lg"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
              Contest History
            </h1>
          </div>

          <Link
            to="/dashboard"
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 rounded-lg transition shadow-md shadow-indigo-600/15"
          >
            Dashboard
          </Link>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 mt-10">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-400 mt-4 text-lg">Fetching your gaming history...</p>
          </div>
        ) : error ? (
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-center max-w-xl mx-auto my-12">
            <svg className="w-12 h-12 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h3 className="text-xl font-bold text-red-400">Oops, something went wrong</h3>
            <p className="text-slate-300 mt-2">{error}</p>
            <button
              onClick={fetchHistory}
              className="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition"
            >
              Retry
            </button>
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-20 bg-slate-900/50 border border-slate-800 rounded-3xl p-8 max-w-2xl mx-auto animate-slide-in">
            <div className="bg-slate-800 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-slate-100">No Battles Fought Yet</h3>
            <p className="text-slate-400 mt-2 max-w-md mx-auto">
              You haven't participated in any coding contests yet. Head over to the Dashboard to create a lobby or join an existing one.
            </p>
            <Link
              to="/dashboard"
              className="inline-block mt-8 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3 rounded-xl transition shadow-lg shadow-indigo-600/20"
            >
              Go to Dashboard
            </Link>
          </div>
        ) : (
          <div className="animate-slide-in">
            {/* Stats Summary Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm">
                <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Contests Played</p>
                <h3 className="text-3xl font-extrabold text-white mt-2">{totalContests}</h3>
              </div>
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm">
                <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Total Score</p>
                <h3 className="text-3xl font-extrabold text-indigo-400 mt-2">{totalPoints} <span className="text-xs font-normal text-slate-400">pts</span></h3>
              </div>
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm">
                <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Solved Problems</p>
                <h3 className="text-3xl font-extrabold text-emerald-400 mt-2">{totalSolved}</h3>
              </div>
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm">
                <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Avg. Score</p>
                <h3 className="text-3xl font-extrabold text-amber-400 mt-2">
                  {avgScore} <span className="text-xs font-normal text-slate-400">pts</span>
                </h3>
              </div>
            </div>

            {/* History Feed list */}
            <h2 className="text-xl font-bold mb-6 text-slate-200">Past Matches</h2>
            <div className="space-y-6">
              {history.map((match) => (
                <div
                  key={match._id}
                  className="bg-slate-900/40 border border-slate-800 hover:border-slate-700 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 transition hover:shadow-xl hover:shadow-indigo-950/10 group"
                >
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-mono text-indigo-400 font-bold bg-indigo-500/5 px-2.5 py-1 rounded border border-indigo-500/10">
                        CODE: {match.code}
                      </span>
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${getDifficultyColor(match.difficulty)}`}>
                        {match.difficulty}
                      </span>
                      <span className="text-slate-500 text-sm flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {match.duration}m
                      </span>
                    </div>

                    <div className="flex items-center gap-6 text-slate-400 text-sm">
                      <span className="flex items-center gap-1.5">
                        <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        {match.participantCount} Players
                      </span>
                      <span className="flex items-center gap-1.5">
                        <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        {match.questionCount} Problems
                      </span>
                      <span className="hidden sm:inline text-slate-500">
                        • {formatDate(match.contestEndsAt)}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-row md:flex-col items-center md:items-end justify-between w-full md:w-auto pt-4 md:pt-0 border-t border-slate-800 md:border-none gap-4">
                    <div className="flex items-center gap-4">
                      <div className="text-left md:text-right">
                        <p className="text-xs text-slate-500 uppercase tracking-wider">Score</p>
                        <p className="text-lg font-bold text-slate-200">
                          {match.userScore} <span className="text-xs font-normal text-slate-500">pts</span>
                        </p>
                      </div>

                      <div className="text-left md:text-right pl-4 border-l border-slate-800">
                        <p className="text-xs text-slate-500 uppercase tracking-wider">Solved</p>
                        <p className="text-lg font-bold text-emerald-400">
                          {match.solvedCount} / {match.questionCount}
                        </p>
                      </div>
                    </div>


                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
