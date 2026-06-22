export default function ContestHeader({
  contest,
  timeLeft,
  score = 0,
  onOpenLeaderboard,
  isHost,
  onEndContest,
}) {
  return (
    <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">

      <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">
        Contest {contest.code}
      </h1>

      <div className="flex gap-6 items-center">

        <div className="text-slate-300">
          Duration: {contest.duration} mins
        </div>

        {isHost && (
          <button
            onClick={onEndContest}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2.5 rounded-xl transition flex items-center gap-2 shadow-md hover:scale-[1.02] active:scale-[0.98]"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            End Contest
          </button>
        )}

        <button
          onClick={onOpenLeaderboard}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2.5 rounded-xl transition flex items-center gap-2 shadow-md hover:scale-[1.02] active:scale-[0.98]"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Leaderboard
        </button>

        <div className="bg-slate-900 border border-slate-800 text-green-400 font-bold text-xl px-4 py-2 rounded-xl flex items-center gap-2 shadow-inner">
          <span className="text-slate-500 text-xs uppercase tracking-wider">Score</span>
          <span>{score}</span>
        </div>

        <div className="text-red-400 font-bold text-2xl">
          Time Left:{" "}
          {Math.floor(timeLeft / 60)}:
          {(timeLeft % 60)
            .toString()
            .padStart(2, "0")}
        </div>

      </div>

    </div>
  );
}