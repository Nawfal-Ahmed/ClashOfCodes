export default function QuestionNavigator({
  questions,
  currentQuestion,
  setCurrentQuestion,
  solvedQuestionIds = [],
}) {
  return (
    <div className="mb-8">

      <h2 className="text-lg font-semibold text-slate-300 mb-3">
        Questions
      </h2>

      <div className="flex flex-wrap gap-3">

        {questions.map((question, index) => {
          const isSolved = solvedQuestionIds.includes(question._id);
          return (
            <button
              key={question._id || index}
              onClick={() =>
                setCurrentQuestion(index)
              }
              className={`w-12 h-12 rounded-xl font-bold transition flex items-center justify-center relative ${
                currentQuestion === index
                  ? "bg-blue-600 text-white scale-105 border-2 border-blue-400"
                  : isSolved
                  ? "bg-green-600/20 text-green-400 border border-green-500 hover:bg-green-600/30"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              {index + 1}
              {isSolved && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-950" />
              )}
            </button>
          );
        })}

      </div>

    </div>
  );
}