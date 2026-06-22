import { useMemo } from "react";

export default function LeaderboardModal({ contest, currentUser, onClose }) {
  const leaderboardData = useMemo(() => {
    if (!contest || !contest.participants) return [];

    return contest.participants
      .map((p) => {
        const score = contest.scores?.[p._id] || 0;
        const solvedCount = contest.solvedQuestions?.[p._id]?.length || 0;
        return {
          id: p._id,
          username: p.username,
          email: p.email,
          score,
          solvedCount,
        };
      })
      .sort((a, b) => b.score - a.score || b.solvedCount - a.solvedCount);
  }, [contest]);

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl relative overflow-hidden flex flex-col max-h-[85vh] text-white">
        
        {/* Modal Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-800">
          <h2 className="text-2xl font-bold flex items-center gap-2 text-indigo-400">
            <svg className="w-6 h-6 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            Leaderboard
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 p-2 rounded-xl transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                <th className="pb-3 text-center w-16">Rank</th>
                <th className="pb-3 pl-4">Player</th>
                <th className="pb-3 text-center w-32">Solved</th>
                <th className="pb-3 text-right w-24 pr-4">Score</th>
              </tr>
            </thead>
            <tbody>
              {leaderboardData.map((player, index) => {
                const isSelf = player.id === currentUser?.id;
                const rank = index + 1;

                let rankBadge = <span>{rank}</span>;
                if (rank === 1) {
                  rankBadge = <span className="text-xl">👑</span>;
                } else if (rank === 2) {
                  rankBadge = <span className="text-xl">🥈</span>;
                } else if (rank === 3) {
                  rankBadge = <span className="text-xl">🥉</span>;
                }

                return (
                  <tr
                    key={player.id}
                    className={`border-b border-slate-800/50 hover:bg-slate-800/30 transition ${
                      isSelf ? "bg-indigo-600/10 border-l-4 border-l-indigo-500" : ""
                    }`}
                  >
                    <td className="py-4 text-center font-bold text-slate-300">
                      {rankBadge}
                    </td>
                    <td className="py-4 pl-4">
                      <span className="font-semibold text-slate-100 flex items-center gap-1.5">
                        {player.username}
                        {isSelf && (
                          <span className="text-[10px] bg-indigo-500 text-white font-bold px-1.5 py-0.5 rounded">
                            YOU
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="py-4 text-center text-slate-300 font-medium">
                      {player.solvedCount}
                    </td>
                    <td className="py-4 text-right pr-4 font-bold text-green-400">
                      {player.score} pts
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {leaderboardData.length === 0 && (
            <div className="text-center text-slate-400 py-8">
              No participants found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
