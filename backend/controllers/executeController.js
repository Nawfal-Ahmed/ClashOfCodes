import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import crypto from "crypto";

// Helper function to run a command with stdin, stdout, stderr and timeout limits
const runLocalProcess = (command, args, cwd, stdin, timeout = 5000) => {
  return new Promise((resolve) => {
    try {
      const child = spawn(command, args, { cwd });
      let stdout = "";
      let stderr = "";
      let killedDueToTimeout = false;

      const timer = setTimeout(() => {
        killedDueToTimeout = true;
        child.kill("SIGKILL");
      }, timeout);

      if (stdin) {
        child.stdin.write(stdin);
      }
      child.stdin.end();

      child.stdout.on("data", (data) => {
        stdout += data.toString();
      });

      child.stderr.on("data", (data) => {
        stderr += data.toString();
      });

      child.on("error", (err) => {
        clearTimeout(timer);
        resolve({
          stdout,
          stderr: stderr ? `${stderr}\n${err.message}` : err.message,
          code: -1,
        });
      });

      child.on("close", (code) => {
        clearTimeout(timer);
        if (killedDueToTimeout) {
          resolve({
            stdout,
            stderr: stderr ? `${stderr}\nTimeout Limit Exceeded (${timeout / 1000}s)` : `Timeout Limit Exceeded (${timeout / 1000}s)`,
            code: -1,
          });
        } else {
          resolve({ stdout, stderr, code });
        }
      });
    } catch (err) {
      resolve({
        stdout: "",
        stderr: err.message,
        code: -1,
      });
    }
  });
};

// Static code safety analysis for local execution mode
const isCodeSafe = (language, code) => {
  const lang = language.toLowerCase();

  // Strip out comments language-specifically
  let cleanCode = code;
  if (lang === "python" || lang === "python3" || lang === "py") {
    cleanCode = code.replace(/#.*|'{3}[\s\S]*?'{3}|"{3}[\s\S]*?"{3}/g, "");
  } else {
    cleanCode = code.replace(/\/\*[\s\S]*?\*\/|\/\/.*|'{3}[\s\S]*?'{3}|"{3}[\s\S]*?"{3}/g, "");
  }

  if (lang === "javascript" || lang === "js") {
    const dangerousPatterns = [
      /\bchild_process\b/,
      /\bfs\b/,
      /\bprocess\b/,
      /\brequire\s*\(\s*['"`](child_process|fs|path|http|https|net|dgram|os|cluster)['"`]\s*\)/,
      /\bimport\s+.*?\s+from\s+['"`](child_process|fs|path|http|https|net|dgram|os|cluster)['"`]/,
      /\bimport\s*\(\s*['"`](child_process|fs|path|http|https|net|dgram|os|cluster)['"`]\s*\)/,
      /\beval\s*\(/,
      /\bFunction\s*\(/,
      /\bglobalThis\b/,
    ];
    for (const pattern of dangerousPatterns) {
      if (pattern.test(cleanCode)) {
        return {
          safe: false,
          error: "Security Check Failed: File system access, process control, networking, or dynamic eval is restricted in local developer mode.",
        };
      }
    }
  } else if (lang === "python" || lang === "python3" || lang === "py") {
    const dangerousPatterns = [
      /\bimport\s+(os|sys|subprocess|shutil|socket|urllib|requests|pty|code)\b/,
      /\bfrom\s+(os|sys|subprocess|shutil|socket|urllib|requests|pty|code)\b/,
      /\b__import__\b/,
      /\beval\s*\(/,
      /\bexec\s*\(/,
      /\bopen\s*\(/,
    ];
    for (const pattern of dangerousPatterns) {
      if (pattern.test(cleanCode)) {
        return {
          safe: false,
          error: "Security Check Failed: Access to system modules (os, sys, subprocess), file operations (open), or dynamic exec is restricted in local developer mode.",
        };
      }
    }
  } else if (lang === "cpp" || lang === "c++") {
    const dangerousPatterns = [
      /\b(system|popen|fork|exec|execl|execv|execvp|dup|dup2)\s*\(/,
      /#include\s*<fstream>/,
      /#include\s*<unistd\.h>/,
      /#include\s*<filesystem>/,
    ];
    for (const pattern of dangerousPatterns) {
      if (pattern.test(cleanCode)) {
        return {
          safe: false,
          error: "Security Check Failed: Execution of system commands, direct file stream mapping, or process spawning is restricted in local developer mode.",
        };
      }
    }
  } else if (lang === "java") {
    const dangerousPatterns = [
      /\bRuntime\s*\.\s*getRuntime\s*\(\s*\)/,
      /\bProcessBuilder\b/,
      /\bjava\s*\.\s*io\s*\.\s*(File|FileReader|FileWriter|FileInputStream|FileOutputStream)\b/,
      /\bjava\s*\.\s*nio\s*\.\s*file\b/,
      /\bjava\s*\.\s*net\b/,
      /\bSystem\s*\.\s*exit\b/,
    ];
    for (const pattern of dangerousPatterns) {
      if (pattern.test(cleanCode)) {
        return {
          safe: false,
          error: "Security Check Failed: Spawning processes, file operations, network socket connections, or VM termination is restricted in local developer mode.",
        };
      }
    }
  }

  return { safe: true };
};

// --- Universal Code Evaluation Helpers ---

const parseInputToArgs = (inputStr) => {
  if (!inputStr || typeof inputStr !== "string") return [];
  const trimmed = inputStr.trim();
  try {
    const matches = [...trimmed.matchAll(/([a-zA-Z0-9_]+)\s*=/g)].map(m => m[1]);
    if (matches.length === 0) {
      return trimmed.split('\n').map(line => {
        const l = line.trim();
        try { return JSON.parse(l); } catch { return l; }
      });
    }
    const code = `
      let ${matches.join(", ")};
      ${trimmed};
      return [${matches.join(", ")}];
    `;
    return new Function(code)();
  } catch (e) {
    console.error("Failed to parse input to args:", e);
    return [trimmed];
  }
};

const normalizeOutput = (str) => {
  if (!str) return "";
  let s = str.trim();
  // Normalize Python boolean and None literals to JSON counterparts
  s = s.replace(/\bTrue\b/g, "true");
  s = s.replace(/\bFalse\b/g, "false");
  s = s.replace(/\bNone\b/g, "null");
  // Normalize single quotes to double quotes for JSON parsing
  s = s.replace(/'/g, '"');
  return s;
};

const areOutputsEqual = (actual, expected) => {
  const normActual = normalizeOutput(actual);
  const normExpected = normalizeOutput(expected);
  if (normActual === normExpected) return true;

  // Equivalence for null/undefined/empty outcomes, including empty arrays and empty objects
  const isActualNullLike = normActual === "null" || normActual === "undefined" || normActual === "" || normActual === "[]" || normActual === "{}";
  const isExpectedNullLike = normExpected === "null" || normExpected === "undefined" || normExpected === "" || normExpected === "[]" || normExpected === "{}";
  if (isActualNullLike && isExpectedNullLike) return true;

  try {
    const actObj = JSON.parse(normActual);
    const expObj = JSON.parse(normExpected);
    return JSON.stringify(actObj) === JSON.stringify(expObj);
  } catch (e) {
    return normActual.replace(/\s+/g, "") === normExpected.replace(/\s+/g, "");
  }
};

const getJsFuncName = (code) => {
  const match1 = code.match(/var\s+([a-zA-Z0-9_]+)\s*=\s*function/);
  if (match1) return match1[1];
  const match2 = code.match(/function\s+([a-zA-Z0-9_]+)\s*\(/);
  if (match2) return match2[1];
  return null;
};

const getPythonFuncName = (code) => {
  const match = code.match(/def\s+([a-zA-Z0-9_]+)\s*\(\s*self\b/);
  return match ? match[1] : null;
};

const getCppSignature = (code) => {
  const regex = /([a-zA-Z0-9_<>&:]+)\s+([a-zA-Z0-9_]+)\s*\(([^)]*)\)\s*\{/g;
  let match;
  while ((match = regex.exec(code)) !== null) {
    const [_, returnType, funcName, paramsText] = match;
    if (funcName !== "main" && funcName !== "Solution") {
      return { returnType, funcName, paramsText };
    }
  }
  return null;
};

const getJavaSignature = (code) => {
  const regex = /public\s+([a-zA-Z0-9_\[\]<>]+)\s+([a-zA-Z0-9_]+)\s*\(([^)]*)\)/;
  const match = code.match(regex);
  if (match) {
    return {
      returnType: match[1],
      funcName: match[2],
      paramsText: match[3]
    };
  }
  return null;
};

const parseParams = (paramsText) => {
  if (!paramsText || !paramsText.trim()) return [];
  return paramsText.split(",").map(param => {
    const parts = param.trim().split(/\s+/);
    let name = parts[parts.length - 1];
    let type = parts.slice(0, parts.length - 1).join(" ");
    if (name.startsWith("&") || name.startsWith("*")) {
      name = name.substring(1);
    }
    type = type.replace(/[&*]/g, "").trim();
    return { type, name };
  });
};

const serializeArgsForCompiled = (args, params) => {
  let result = "";
  for (let i = 0; i < params.length; i++) {
    const val = args[i] !== undefined ? args[i] : null;
    const type = params[i].type.trim();
    if (type.includes("vector<vector") || type.endsWith("[][]")) {
      if (Array.isArray(val)) {
        result += `${val.length}\n`;
        for (const row of val) {
          if (Array.isArray(row)) {
            result += `${row.length} ${row.join(" ")}\n`;
          } else {
            result += `0\n`;
          }
        }
      } else {
        result += `0\n`;
      }
    } else if (type.includes("vector") || type.endsWith("[]")) {
      if (Array.isArray(val)) {
        result += `${val.length}\n`;
        result += `${val.join(" ")}\n`;
      } else {
        result += `0\n\n`;
      }
    } else {
      result += `${val}\n`;
    }
  }
  return result;
};

const wrapJsCode = (userCode, funcName) => {
  return `
${userCode}

const fs = require('fs');
const stdin = fs.readFileSync(0, 'utf-8').trim();

if (stdin) {
  try {
    const args = JSON.parse(stdin);
    const result = ${funcName}(...args);
    console.log(JSON.stringify(result));
  } catch (e) {
    console.error("Runner Error:", e.message);
  }
}
`;
};

const wrapPythonCode = (userCode, funcName) => {
  return `
${userCode}

import sys
import json

stdin = sys.stdin.read().strip()
if stdin:
    try:
        args = json.loads(stdin)
        sol = Solution()
        result = getattr(sol, '${funcName}')(*args)
        print(json.dumps(result, separators=(',', ':')))
    except Exception as e:
        print("Runner Error:", str(e), file=sys.stderr)
`;
};

const wrapCppCode = (userCode, sig) => {
  const { returnType, funcName, paramsText } = sig;
  const params = parseParams(paramsText);
  let readerCode = "";
  let callArgs = [];
  params.forEach((param, index) => {
    const { type, name } = param;
    const varName = `param_${index}`;
    callArgs.push(varName);
    if (type.includes("vector<vector")) {
      readerCode += `
    int rows_${index};
    if (!(cin >> rows_${index})) return 0;
    ${type} ${varName}(rows_${index});
    for (int r = 0; r < rows_${index}; ++r) {
        int cols_${index};
        cin >> cols_${index};
        ${varName}[r].resize(cols_${index});
        for (int c = 0; c < cols_${index}; ++c) {
            cin >> ${varName}[r][c];
        }
    }
`;
    } else if (type.includes("vector")) {
      const innerTypeMatch = type.match(/vector<([^>]+)>/);
      const innerType = innerTypeMatch ? innerTypeMatch[1] : "int";
      readerCode += `
    int size_${index};
    if (!(cin >> size_${index})) return 0;
    ${type} ${varName}(size_${index});
    for (int i = 0; i < size_${index}; ++i) {
        cin >> ${varName}[i];
    }
`;
    } else {
      readerCode += `
    ${type} ${varName};
    cin >> ${varName};
`;
    }
  });
  let printerCode = "";
  const rType = returnType.trim();
  if (rType.includes("vector<vector")) {
    printerCode = `
    cout << "[";
    for (size_t r = 0; r < result.size(); ++r) {
        cout << "[";
        for (size_t c = 0; c < result[r].size(); ++c) {
            cout << result[r][c] << (c + 1 < result[r].size() ? "," : "");
        }
        cout << "]" << (r + 1 < result.size() ? "," : "");
    }
    cout << "]" << endl;
`;
  } else if (rType.includes("vector")) {
    printerCode = `
    cout << "[";
    for (size_t i = 0; i < result.size(); ++i) {
        cout << result[i] << (i + 1 < result.size() ? "," : "");
    }
    cout << "]" << endl;
`;
  } else if (rType === "string") {
    printerCode = `cout << "\\"" << result << "\\"" << endl;`;
  } else if (rType === "bool") {
    printerCode = `cout << (result ? "true" : "false") << endl;`;
  } else {
    printerCode = `cout << result << endl;`;
  }
  return `
#include <iostream>
#include <vector>
#include <string>
#include <algorithm>
using namespace std;
${userCode}
int main() {
    ${readerCode}
    Solution sol;
    ${rType} result = sol.${funcName}(${callArgs.join(", ")});
    ${printerCode}
    return 0;
}
`;
};

const wrapJavaCode = (userCode, sig) => {
  const { returnType, funcName, paramsText } = sig;
  const params = parseParams(paramsText);
  let readerCode = "";
  let callArgs = [];
  params.forEach((param, index) => {
    const { type, name } = param;
    const varName = `param_${index}`;
    callArgs.push(varName);
    if (type.endsWith("[][]")) {
      const baseType = type.substring(0, type.length - 4);
      readerCode += `
        int rows_${index} = scanner.nextInt();
        ${type} ${varName} = new ${baseType}[rows_${index}][];
        for (int r = 0; r < rows_${index}; r++) {
            int cols_${index} = scanner.nextInt();
            ${varName}[r] = new ${baseType}[cols_${index}];
            for (int c = 0; c < cols_${index}; c++) {
                ${varName}[r][c] = scanner.next${baseType.substring(0,1).toUpperCase() + baseType.substring(1)}();
            }
        }
`;
    } else if (type.endsWith("[]")) {
      const baseType = type.substring(0, type.length - 2);
      let readMethod = "nextInt";
      if (baseType.toLowerCase() === "double") readMethod = "nextDouble";
      if (baseType.toLowerCase() === "float") readMethod = "nextFloat";
      if (baseType.toLowerCase() === "string") readMethod = "next";
      readerCode += `
        int size_${index} = scanner.nextInt();
        ${type} ${varName} = new ${baseType}[size_${index}];
        for (int i = 0; i < size_${index}; i++) {
            ${varName}[i] = scanner.${readMethod}();
        }
`;
    } else {
      let readMethod = "nextInt";
      if (type.toLowerCase() === "double") readMethod = "nextDouble";
      if (type.toLowerCase() === "float") readMethod = "nextFloat";
      if (type.toLowerCase() === "string") readMethod = "next";
      if (type.toLowerCase() === "boolean") readMethod = "nextBoolean";
      readerCode += `
        ${type} ${varName} = scanner.${readMethod}();
`;
    }
  });
  let printerCode = "";
  const rType = returnType.trim();
  if (rType.endsWith("[][]")) {
    printerCode = `
        System.out.print("[");
        for (int r = 0; r < result.length; r++) {
            System.out.print("[");
            for (int c = 0; c < result[r].length; c++) {
                System.out.print(result[r][c] + (c + 1 < result[r].length ? "," : ""));
            }
            System.out.print("]" + (r + 1 < result.length ? "," : ""));
        }
        System.out.println("]");
`;
  } else if (rType.endsWith("[]")) {
    printerCode = `
        System.out.print("[");
        for (int i = 0; i < result.length; i++) {
            System.out.print(result[i] + (i + 1 < result.length ? "," : ""));
        }
        System.out.println("]");
`;
  } else if (rType === "String") {
    printerCode = `System.out.println("\\"" + result + "\\"");`;
  } else if (rType === "boolean") {
    printerCode = `System.out.println(result ? "true" : "false");`;
  } else {
    printerCode = `System.out.println(result);`;
  }
  const processedUserCode = userCode.replace(/public\s+class\s+Solution/g, "class Solution");
  return `
import java.util.Scanner;
import java.util.Arrays;
${processedUserCode}
public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        ${readerCode}
        Solution sol = new Solution();
        ${rType} result = sol.${funcName}(${callArgs.join(", ")});
        ${printerCode}
    }
}
`;
};

// --- End Universal Code Evaluation Helpers ---

// Get the compile and run specifications based on language
const getExecutionSpec = (language, filename, tempDir) => {
  const lang = language.toLowerCase();
  let compileCmd = "";
  let compileArgs = [];
  let execCmd = "";
  let execArgs = [];

  switch (lang) {
    case "javascript":
    case "js":
      execCmd = "node";
      execArgs = [filename];
      break;
    case "python":
    case "python3":
    case "py":
      execCmd = "python";
      execArgs = [filename];
      break;
    case "cpp":
    case "c++":
      compileCmd = "g++";
      compileArgs = ["-O3", filename, "-o", "solution.exe"];
      execCmd = process.platform === "win32" ? ".\\solution.exe" : "./solution.exe";
      execArgs = [];
      break;
    case "java":
      execCmd = "java";
      execArgs = [filename];
      break;
  }

  return { compileCmd, compileArgs, execCmd, execArgs };
};

const prepareWrappedExecution = (language, codeValue, rawStdin) => {
  const lang = language.toLowerCase();
  let wrappedCode = codeValue;
  let serializedStdin = rawStdin;

  try {
    const args = parseInputToArgs(rawStdin);

    if (lang === "javascript" || lang === "js") {
      const funcName = getJsFuncName(codeValue);
      if (funcName) {
        wrappedCode = wrapJsCode(codeValue, funcName);
        serializedStdin = JSON.stringify(args);
      }
    } else if (lang === "python" || lang === "python3" || lang === "py") {
      const funcName = getPythonFuncName(codeValue);
      if (funcName) {
        wrappedCode = wrapPythonCode(codeValue, funcName);
        serializedStdin = JSON.stringify(args);
      }
    } else if (lang === "cpp" || lang === "c++") {
      const sig = getCppSignature(codeValue);
      if (sig) {
        wrappedCode = wrapCppCode(codeValue, sig);
        const params = parseParams(sig.paramsText);
        serializedStdin = serializeArgsForCompiled(args, params);
      }
    } else if (lang === "java") {
      const sig = getJavaSignature(codeValue);
      if (sig) {
        wrappedCode = wrapJavaCode(codeValue, sig);
        const params = parseParams(sig.paramsText);
        serializedStdin = serializeArgsForCompiled(args, params);
      }
    }
  } catch (err) {
    console.error("Wrapping execution failed, falling back to raw execution:", err);
  }

  return { wrappedCode, serializedStdin };
};

export const executeCode = async (req, res) => {
  try {
    const { language, version, files, stdin } = req.body;

    if (!files || !files[0] || typeof files[0].content !== "string") {
      return res.status(400).json({
        message: "Invalid request payload. 'files[0].content' is required.",
      });
    }

    const codeValue = files[0].content;
    const mode = process.env.EXECUTION_MODE || "local";

    if (mode === "piston-proxy") {
      const response = await fetch("https://emkc.org/api/v2/piston/execute", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          language,
          version: version || "*",
          files,
          stdin: stdin || "",
        }),
      });

      const data = await response.json();
      return res.status(response.status).json(data);
    }

    // Static code safety analysis for local developer mode
    if (mode === "local") {
      const safety = isCodeSafe(language, codeValue);
      if (!safety.safe) {
        return res.json({
          run: {
            stdout: "",
            stderr: safety.error,
            output: safety.error,
            code: -1,
            signal: null,
          },
        });
      }
    }

    // Local Execution
    const runId = crypto.randomUUID();
    const tempDir = path.resolve(`./temp_exec/run_${runId}`);
    fs.mkdirSync(tempDir, { recursive: true });

    let filename = "";
    const lang = language.toLowerCase();
    switch (lang) {
      case "javascript":
      case "js":
        filename = "index.cjs";
        break;
      case "python":
      case "python3":
      case "py":
        filename = "solution.py";
        break;
      case "cpp":
      case "c++":
        filename = "solution.cpp";
        break;
      case "java":
        filename = "Main.java";
        break;
      default:
        fs.rmSync(tempDir, { recursive: true, force: true });
        return res.status(400).json({
          message: `Language '${language}' is not supported in ${mode} execution mode.`,
        });
    }

    const { wrappedCode, serializedStdin } = prepareWrappedExecution(language, codeValue, stdin || "");
    fs.writeFileSync(path.join(tempDir, filename), wrappedCode);

    const spec = getExecutionSpec(language, filename, tempDir);

    // Compile if necessary
    if (spec.compileCmd) {
      const compileResult = await runLocalProcess(spec.compileCmd, spec.compileArgs, tempDir, "", 15000);
      if (compileResult.code !== 0) {
        fs.rmSync(tempDir, { recursive: true, force: true });
        return res.json({
          run: {
            stdout: "",
            stderr: `Compilation Error:\n${compileResult.stderr}`,
            output: `Compilation Error:\n${compileResult.stderr}`,
            code: compileResult.code,
            signal: null,
          },
        });
      }
    }

    // Execute
    const runResult = await runLocalProcess(spec.execCmd, spec.execArgs, tempDir, serializedStdin, 5000);

    fs.rmSync(tempDir, { recursive: true, force: true });

    return res.json({
      run: {
        stdout: runResult.stdout,
        stderr: runResult.stderr,
        output: runResult.stderr || runResult.stdout || "No output",
        code: runResult.code,
        signal: null,
      },
    });

  } catch (error) {
    console.error("Code execution backend error:", error);
    return res.status(500).json({
      message: "An internal server error occurred while executing the code.",
      error: error.message,
    });
  }
};

export const runCodeAgainstTestCases = async (language, codeValue, testCases) => {
  const mode = process.env.EXECUTION_MODE || "local";

  if (mode === "piston-proxy") {
    const promises = testCases.map(async (tc) => {
      try {
        const response = await fetch("https://emkc.org/api/v2/piston/execute", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            language,
            version: "*",
            files: [
              {
                content: codeValue,
              },
            ],
            stdin: tc.input || "",
          }),
        });

        if (!response.ok) {
          return {
            passed: false,
            error: `Piston API error: status ${response.status}`,
          };
        }

        const data = await response.json();
        const output = (
          data.run?.stdout ||
          data.run?.stderr ||
          data.run?.output ||
          ""
        ).trim();
        const expected = (tc.output || "").trim();
        const passed = output === expected;

        return {
          passed,
          actual: output,
          expected,
          error: data.run?.stderr || null,
        };
      } catch (err) {
        return {
          passed: false,
          error: err.message,
        };
      }
    });

    const results = await Promise.all(promises);
    const allPassed = results.every((r) => r.passed);
    return { allPassed, results };
  }

  // Static code safety analysis for local developer mode
  if (mode === "local") {
    const safety = isCodeSafe(language, codeValue);
    if (!safety.safe) {
      return {
        allPassed: false,
        compileError: safety.error,
        results: testCases.map(() => ({ passed: false, error: safety.error })),
      };
    }
  }

  // Local Execution
  const runId = crypto.randomUUID();
  const tempDir = path.resolve(`./temp_exec/run_${runId}`);
  fs.mkdirSync(tempDir, { recursive: true });

  let filename = "";
  const lang = language.toLowerCase();
  switch (lang) {
    case "javascript":
    case "js":
      filename = "index.cjs";
      break;
    case "python":
    case "python3":
    case "py":
      filename = "solution.py";
      break;
    case "cpp":
    case "c++":
      filename = "solution.cpp";
      break;
    case "java":
      filename = "Main.java";
      break;
    default:
      fs.rmSync(tempDir, { recursive: true, force: true });
      return {
        allPassed: false,
        compileError: `Language '${language}' is not supported in ${mode} execution mode.`,
        results: [],
      };
  }

  const { wrappedCode } = prepareWrappedExecution(language, codeValue, "");
  fs.writeFileSync(path.join(tempDir, filename), wrappedCode);

  const spec = getExecutionSpec(language, filename, tempDir);

  // Compile if needed
  if (spec.compileCmd) {
    const compileResult = await runLocalProcess(spec.compileCmd, spec.compileArgs, tempDir, "", 15000);
    if (compileResult.code !== 0) {
      fs.rmSync(tempDir, { recursive: true, force: true });
      return {
        allPassed: false,
        compileError: compileResult.stderr,
        results: testCases.map(() => ({ passed: false, error: "Compilation Error" })),
      };
    }
  }

  const results = [];
  for (const tc of testCases) {
    const { serializedStdin } = prepareWrappedExecution(language, codeValue, tc.input || "");
    const runResult = await runLocalProcess(spec.execCmd, spec.execArgs, tempDir, serializedStdin, 5000);

    const output = (runResult.stdout || "").trim();
    const error = runResult.stderr || null;
    const expected = (tc.output || "").trim();
    const passed = runResult.code === 0 && !error && areOutputsEqual(output, expected);

    results.push({
      passed,
      actual: output,
      expected,
      error,
    });
  }

  fs.rmSync(tempDir, { recursive: true, force: true });
  const allPassed = results.every((r) => r.passed);
  return { allPassed, results };
};
