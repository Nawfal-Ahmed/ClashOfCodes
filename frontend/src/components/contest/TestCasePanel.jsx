import { useEffect } from "react";

export default function TestCasePanel({
  testCases,
  currentTestCase,
  setCurrentTestCase,

  running,
  submitting,
  submitResult,
  handleRunCode,
  handleSubmit,

  testResults,
  testStatuses,
}) {
  const testCase = testCases?.[currentTestCase];

  return (
    <div className="bg-slate-900 rounded-2xl p-6 mt-6 border border-slate-800">

      {/* Header */}
      <div className="flex justify-between items-center mb-6">

        <h2 className="text-2xl font-bold">
          Test Cases
        </h2>

        <div className="flex gap-4">

          <button
            onClick={handleRunCode}
            disabled={running || submitting}
            className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-semibold transition disabled:opacity-50"
          >
            {running
              ? "Running..."
              : "Run"}
          </button>

          <button
            onClick={handleSubmit}
            disabled={running || submitting}
            className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg font-semibold transition disabled:opacity-50"
          >
            {submitting
              ? "Submitting..."
              : "Submit"}
          </button>

        </div>

      </div>

      {/* Submit Result Banner */}
      {submitResult && (
        <div className={`mb-6 p-4 rounded-xl border flex flex-col gap-2 transition-all ${
          submitResult.success
            ? "bg-green-950/30 border-green-800 text-green-400"
            : "bg-red-950/30 border-red-800 text-red-400"
        }`}>
          <div className="flex items-center gap-2 font-bold text-lg">
            {submitResult.success ? (
              <>
                <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Submission Passed!</span>
              </>
            ) : (
              <>
                <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Submission Failed</span>
              </>
            )}
          </div>
          <div className="text-sm font-medium">
            {submitResult.compileError ? (
              <pre className="mt-2 bg-slate-950/80 text-red-300 p-3 rounded-lg overflow-auto border border-red-900/50 font-mono text-xs max-h-48">
                {submitResult.compileError}
              </pre>
            ) : submitResult.success ? (
              <span>All test cases passed successfully! Points awarded: +{submitResult.pointsAdded || 0}</span>
            ) : (
              <span>
                {submitResult.message || "Some test cases failed."} (Passed {submitResult.results?.filter(r => r.passed)?.length || 0} / {submitResult.results?.length || 0} test cases).
              </span>
            )}
          </div>
        </div>
      )}

      {/* Test Case Tabs Navigator (Horizontal) */}
      <div className="flex flex-wrap gap-3 mb-6">
        {testCases?.map((_, index) => {
          const status = testStatuses[index];
          const isActive = currentTestCase === index;

          return (
            <button
              key={index}
              onClick={() => setCurrentTestCase(index)}
              className={`px-5 py-3 rounded-xl font-bold transition flex items-center gap-2 relative border ${
                isActive
                  ? "bg-blue-600 text-white border-blue-400 shadow-md scale-105"
                  : status === "passed"
                  ? "bg-green-600/10 text-green-400 border-green-500/30 hover:bg-green-600/20"
                  : status === "failed"
                  ? "bg-red-600/10 text-red-400 border-red-500/30 hover:bg-red-600/20"
                  : "bg-slate-800 text-slate-300 border-transparent hover:bg-slate-700"
              }`}
            >
              <span>{index + 1}</span>
              {status === "passed" && (
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
              )}
              {status === "failed" && (
                <span className="w-1.5 h-1.5 bg-red-400 rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* Active Test Case Detail Area */}
      {testCase ? (
        <div className="space-y-6 bg-slate-950/20 p-5 rounded-2xl border border-slate-800/40">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-slate-200">Input</h3>
              <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-medium uppercase tracking-wider">
                Public
              </span>
            </div>
            <pre className="bg-slate-950/80 text-slate-300 rounded-lg p-4 whitespace-pre-wrap overflow-auto font-mono text-sm border border-slate-900 shadow-inner">
              {testCase.input || "No input available"}
            </pre>
          </div>

          <div>
            <h3 className="font-semibold text-slate-200 mb-2">Expected Output</h3>
            <pre className="bg-slate-950/80 text-slate-300 rounded-lg p-4 whitespace-pre-wrap overflow-auto font-mono text-sm border border-slate-900 shadow-inner">
              {testCase.output || "No expected output"}
            </pre>
          </div>

          <div>
            <h3 className="font-semibold text-slate-200 mb-2">Your Output</h3>
            <pre className="bg-slate-950/80 text-slate-300 rounded-lg p-4 whitespace-pre-wrap overflow-auto font-mono text-sm border border-slate-900 shadow-inner min-h-[80px]">
              {testResults?.[currentTestCase] || "Run code to view output"}
            </pre>
          </div>
        </div>
      ) : (
        <div className="text-center text-slate-400 py-8">
          No test case selected.
        </div>
      )}

    </div>
  );
}