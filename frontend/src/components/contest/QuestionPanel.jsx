export default function QuestionPanel({
  question,
}) {
  return (
    <div className="bg-slate-900 rounded-2xl p-6 overflow-y-auto h-full border border-slate-800">

      <h2 className="text-2xl font-bold">
        {question.title}
      </h2>

      <div 
        className="mt-4 text-slate-300 space-y-3 text-sm leading-relaxed"
        dangerouslySetInnerHTML={{ __html: question.description || "" }}
      />

      {/* Examples */}
      <div className="mt-6">

        <h3 className="font-semibold mb-3">
          Examples
        </h3>

        {question.examples?.map(
          (example, index) => (
            <div
              key={index}
              className="bg-slate-800 rounded-lg p-4 mb-3"
            >
              <p>
                <strong>Input:</strong>{" "}
                {example.input}
              </p>

              <p>
                <strong>Output:</strong>{" "}
                {example.output}
              </p>

              {example.explanation && (
                <p>
                  <strong>
                    Explanation:
                  </strong>{" "}
                  {example.explanation}
                </p>
              )}
            </div>
          )
        )}

      </div>

      {/* Constraints */}
      {question.constraints?.length >
        0 && (
        <div className="mt-6">

          <h3 className="font-semibold mb-3">
            Constraints
          </h3>

          <ul className="list-disc list-inside text-slate-300 space-y-1">

            {question.constraints.map(
              (
                constraint,
                index
              ) => (
                <li key={index}>
                  {constraint}
                </li>
              )
            )}

          </ul>

        </div>
      )}

    </div>
  );
}