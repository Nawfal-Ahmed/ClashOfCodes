import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const checkActiveLobbyAndRedirect = async (token) => {
    try {
      const response = await fetch("http://localhost:5000/users/active-lobby", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        return;
      }
      if (!response.ok) {
        throw new Error("Failed to check active lobby");
      }
      const data = await response.json();
      if (data.active && data.status === "started") {
        navigate(`/contest/${data.code}`);
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      console.error(err);
      navigate("/dashboard");
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      checkActiveLobbyAndRedirect(token);
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/login", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message);
      }

      // Save JWT token
      localStorage.setItem("token", data.token);

      // Save user info
      localStorage.setItem(
        "user",
        JSON.stringify(data.user)
      );

      await checkActiveLobbyAndRedirect(data.token);

    } catch (error) {
      setError(error.message);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">

      <div className="w-full max-w-md bg-slate-900 rounded-2xl shadow-xl p-8">

        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white">
            Clash of Codes
          </h1>

          <p className="text-slate-400 mt-2">
            Welcome back
          </p>
        </div>

        <form
          onSubmit={handleLogin}
          className="space-y-5"
        >

          <div>
            <label className="block text-sm text-slate-300 mb-2">
              Email
            </label>

            <input
              type="email"
              placeholder="Enter your email"
              className="w-full rounded-lg bg-slate-800 border border-slate-700 px-4 py-3 text-white outline-none focus:border-blue-500"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              required
            />
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-2">
              Password
            </label>

            <input
              type="password"
              placeholder="Enter your password"
              className="w-full rounded-lg bg-slate-800 border border-slate-700 px-4 py-3 text-white outline-none focus:border-blue-500"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              required
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 transition text-white font-semibold py-3 rounded-lg disabled:opacity-50"
          >
            {loading ? "Logging in..." : "Login"}
          </button>

        </form>
        <div className="mt-4 flex justify-center">
  <GoogleLogin
  onSuccess={async (credentialResponse) => {
    try {
      const response = await fetch("http://localhost:5000/google-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          credential: credentialResponse.credential,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message);
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      await checkActiveLobbyAndRedirect(data.token);
    } catch (error) {
      setError(error.message);
    }
  }}
  onError={() => {
    setError("Google Login Failed");
  }}
/>
</div>
        <div className="mt-6 text-center text-slate-400">
          Don't have an account?{" "}
          <Link
            to="/register"
            className="text-blue-500 hover:text-blue-400"
          >
            Create Account
          </Link>
        </div>

      </div>

    </div>
  );
}