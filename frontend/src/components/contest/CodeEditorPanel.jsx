import Editor from "@monaco-editor/react";

export default function CodeEditorPanel({
  language,
  setLanguage,
  codeValue,
  setCodeValue,
}) {
  return (
    <div className="bg-slate-900 rounded-2xl p-6 h-full flex flex-col min-h-0 border border-slate-800">

      {/* Header */}
      <div className="flex justify-between items-center mb-4 shrink-0">

        <h2 className="text-xl font-bold flex items-center gap-2">
          <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
          Code Editor
        </h2>

        <select
          value={language}
          onChange={(e) =>
            setLanguage(e.target.value)
          }
          className="bg-slate-800 text-white px-4 py-2 rounded-lg outline-none border border-slate-700 transition focus:border-indigo-500 cursor-pointer"
        >
          <option value="javascript">
            JavaScript
          </option>

          <option value="python">
            Python
          </option>

          <option value="cpp">
            C++
          </option>

          <option value="java">
            Java
          </option>

        </select>

      </div>

      {/* Monaco Editor Wrapper */}
      <div className="flex-1 min-h-0 rounded-lg overflow-hidden border border-slate-950">
        <Editor
          height="100%"
          theme="vs-dark"
          language={
            language === "cpp"
              ? "cpp"
              : language
          }
          value={codeValue}
          onChange={(value) =>
            setCodeValue(value || "")
          }
          options={{
            fontSize: 16,

            minimap: {
              enabled: false,
            },

            scrollBeyondLastLine: false,

            automaticLayout: true,
          }}
        />
      </div>

    </div>
  );
}