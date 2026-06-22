import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { API_BASE_URL } from "../config";

export default function Profile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Form Fields
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/");
        return;
      }

      const response = await fetch(`${API_BASE_URL}/users/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch profile");
      }

      setProfile(data);
      setUsername(data.username || "");
      setEmail(data.email || "");
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    // Client-side validations
    if (!username.trim() || !email.trim()) {
      setError("Username and email are required.");
      return;
    }

    if (password) {
      if (password.length < 6) {
        setError("Password must be at least 6 characters long.");
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
    }

    try {
      setSaving(true);
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/users/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          username,
          email,
          ...(password ? { password } : {}),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update profile");
      }

      // Update state and localStorage
      setProfile(data.user);
      localStorage.setItem("user", JSON.stringify(data.user));
      setMessage("Profile updated successfully!");
      setEditMode(false);
      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setUsername(profile.username || "");
      setEmail(profile.email || "");
    }
    setPassword("");
    setConfirmPassword("");
    setError(null);
    setMessage(null);
    setEditMode(false);
  };

  const handleDeleteAccount = async () => {
    try {
      setError(null);
      setMessage(null);
      const token = localStorage.getItem("token");

      const response = await fetch(`${API_BASE_URL}/users/profile`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to delete account");
      }

      localStorage.removeItem("token");
      localStorage.removeItem("user");
      navigate("/");
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  };

  const getInitials = (name) => {
    if (!name) return "?";
    return name.slice(0, 2).toUpperCase();
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    const options = { year: "numeric", month: "long", day: "numeric" };
    return new Date(dateStr).toLocaleDateString(undefined, options);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-16">
      {/* Navbar */}
      <nav className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-6 py-4 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
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
              My Profile
            </h1>
          </div>

          <Link
            to="/dashboard"
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium px-4 py-2 rounded-lg transition"
          >
            Dashboard
          </Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 mt-10">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-400 mt-4">Loading profile details...</p>
          </div>
        ) : !profile ? (
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-center max-w-md mx-auto my-12">
            <h3 className="text-xl font-bold text-red-400">Failed to load profile</h3>
            <p className="text-slate-300 mt-2">Please log in again or check your server connection.</p>
            <button
              onClick={() => navigate("/")}
              className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition"
            >
              Back to Login
            </button>
          </div>
        ) : (
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 backdrop-blur-sm max-w-2xl mx-auto animate-slide-in relative overflow-hidden">
            {/* Header Avatar and Rating */}
            <div className="flex flex-col sm:flex-row items-center gap-6 pb-8 border-b border-slate-800">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-3xl font-extrabold text-white shadow-xl shadow-indigo-950/30 shrink-0 border border-indigo-400/20">
                {getInitials(profile.username)}
              </div>
              <div className="text-center sm:text-left flex-1 space-y-1">
                <h2 className="text-2xl font-bold text-slate-100">{profile.username}</h2>
                <p className="text-slate-400 text-sm">{profile.email}</p>
                <div className="flex justify-center sm:justify-start gap-4 mt-2">
                  <div className="bg-slate-800 border border-slate-700 text-slate-400 text-xs font-medium px-3 py-1 rounded-full">
                    Member since {formatDate(profile.createdAt)}
                  </div>
                </div>
              </div>
            </div>

            {/* Notification Alerts */}
            {message && (
              <div className="mt-6 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-emerald-400 text-sm flex items-center gap-2 animate-slide-in">
                <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {message}
              </div>
            )}

            {error && (
              <div className="mt-6 bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm flex items-center gap-2 animate-slide-in">
                <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                {error}
              </div>
            )}

            {/* Profile Info Details Form / View */}
            {!editMode ? (
              <div className="mt-8 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Username</label>
                    <p className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-slate-200">{profile.username}</p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Email Address</label>
                    <p className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-slate-200">{profile.email}</p>
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    onClick={() => setEditMode(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-2.5 rounded-xl transition flex items-center gap-2 shadow-lg shadow-indigo-600/15"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit Profile
                  </button>
                </div>

                {/* Danger Zone */}
                <div className="mt-8 border-t border-slate-800 pt-8">
                  <div className="bg-red-500/5 border border-red-500/10 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                      <h3 className="text-md font-bold text-red-400">Danger Zone</h3>
                      <p className="text-xs text-slate-400 mt-1 max-w-sm">
                        Once you delete your account, there is no going back. All your stats, history, and active lobbies will be permanently removed.
                      </p>
                    </div>
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/25 text-red-400 px-5 py-2.5 rounded-xl font-semibold text-sm transition transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-md"
                    >
                      Delete Account
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleUpdateProfile} className="mt-8 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">Username</label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full rounded-xl bg-slate-900 border border-slate-800 px-4 py-3 text-white outline-none focus:border-indigo-500 transition"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">Email Address</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-xl bg-slate-900 border border-slate-800 px-4 py-3 text-white outline-none focus:border-indigo-500 transition"
                      required
                    />
                  </div>
                </div>

                {/* Password Update Fields */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 mt-6 space-y-4">
                  <h3 className="text-sm font-semibold text-indigo-400 flex items-center gap-1.5">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Change Password (Optional)
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">New Password</label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full rounded-xl bg-slate-900 border border-slate-800 px-4 py-2.5 text-white outline-none focus:border-indigo-500 transition"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Confirm New Password</label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full rounded-xl bg-slate-900 border border-slate-800 px-4 py-2.5 text-white outline-none focus:border-indigo-500 transition"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold px-5 py-2.5 rounded-xl transition border border-slate-700"
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-600/50 text-white font-semibold px-6 py-2.5 rounded-xl transition flex items-center gap-2 shadow-lg shadow-indigo-600/15"
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Saving...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>

      {/* Delete Account Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md transition-opacity duration-300">
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl relative overflow-hidden animate-scale-in text-center">
            {/* Red decorative glow */}
            <div className="absolute top-[-20%] left-[-20%] w-[50%] h-[50%] rounded-full bg-red-500/10 blur-[50px] pointer-events-none"></div>
            
            <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6 text-red-400">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
              </svg>
            </div>

            <h3 className="text-2xl font-extrabold text-white mb-3">Delete Account?</h3>
            <p className="text-slate-400 mb-8 text-sm leading-relaxed">
              Are you sure you want to delete your account? This action is permanent and cannot be undone. All your progress will be lost.
            </p>

            <div className="flex gap-4">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-3.5 px-5 rounded-2xl border border-slate-700 bg-slate-850 hover:bg-slate-800 text-slate-300 font-bold text-sm transition transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                className="flex-1 py-3.5 px-5 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-sm transition transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-lg shadow-red-600/20"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
