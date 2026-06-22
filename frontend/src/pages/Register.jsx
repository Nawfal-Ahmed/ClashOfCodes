import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { API_BASE_URL } from "../config";

export default function Register() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/register`, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          username,
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message);
      }

      setSuccess("Account created successfully!");

      // Redirect to login after 1.5 seconds
      setTimeout(() => {
        navigate("/");
      }, 1500);

    } catch (error) {
      setError(error.message);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-4 relative overflow-hidden">
      {/* Decorative Aurora background glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-900/15 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-violet-900/15 blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md bg-slate-900/40 border border-slate-800/80 rounded-3xl p-8 backdrop-blur-2xl shadow-2xl relative overflow-hidden animate-slide-in">
        {/* Decorative inner glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-indigo-500/5 to-transparent blur-xl rounded-full"></div>

        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xxs font-bold bg-indigo-500/10 border border-indigo-500/25 text-indigo-400 tracking-wider uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></span>
              Join the Arena
            </span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white">
            Clash of <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">Codes</span>
          </h1>
          <p className="text-slate-400 mt-2 font-medium text-sm">
            Create your account to start playing
          </p>
        </div>

        <form onSubmit={handleRegister} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Username
            </label>
            <input
              type="text"
              placeholder="Choose a username"
              className="w-full rounded-2xl bg-slate-950/60 border border-slate-800 px-4 py-3.5 text-white outline-none focus:border-indigo-500/80 transition text-sm shadow-inner"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Email
            </label>
            <input
              type="email"
              placeholder="Enter your email"
              className="w-full rounded-2xl bg-slate-950/60 border border-slate-800 px-4 py-3.5 text-white outline-none focus:border-indigo-500/80 transition text-sm shadow-inner"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Password
            </label>
            <input
              type="password"
              placeholder="Create a password"
              className="w-full rounded-2xl bg-slate-950/60 border border-slate-800 px-4 py-3.5 text-white outline-none focus:border-indigo-500/80 transition text-sm shadow-inner"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl p-3.5 text-xs font-semibold flex items-center gap-2 animate-slide-in">
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              {error}
            </div>
          )}

          {success && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl p-3.5 text-xs font-semibold flex items-center gap-2 animate-slide-in">
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold py-3.5 rounded-2xl transition shadow-lg shadow-indigo-600/15 transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 text-sm tracking-wide cursor-pointer"
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <div className="mt-6 text-center text-slate-400 text-sm font-medium">
          Already have an account?{" "}
          <Link
            to="/"
            className="text-indigo-400 hover:text-indigo-300 font-bold transition ml-0.5"
          >
            Login
          </Link>
        </div>
      </div>
    </div>
  );
}