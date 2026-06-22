import { Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Lobby from "./pages/Lobby";
import CreateLobby from "./pages/CreateLobby";
import Contest from "./pages/Contest";
import Results from "./pages/Results";
import History from "./pages/History";
import Profile from "./pages/Profile";
import JoinLobby from "./pages/JoinLobby";
import NotFound from "./pages/NotFound";

import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Login />} />

      <Route
        path="/register"
        element={<Register />}
      />

      {/* Protected Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/create-lobby"
        element={
          <ProtectedRoute>
            <CreateLobby />
          </ProtectedRoute>
        }
      />

      <Route
        path="/lobby/:code"
        element={
          <ProtectedRoute>
            <Lobby />
          </ProtectedRoute>
        }
      />

      <Route
        path="/contest/:code"
        element={
          <ProtectedRoute>
            <Contest />
          </ProtectedRoute>
        }
      />

      <Route
        path="/contest/:code/results"
        element={
          <ProtectedRoute>
            <Results />
          </ProtectedRoute>
        }
      />

      <Route
        path="/history"
        element={
          <ProtectedRoute>
            <History />
          </ProtectedRoute>
        }
      />

      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />

      <Route
        path="/join-lobby"
        element={
          <ProtectedRoute>
            <JoinLobby />
          </ProtectedRoute>
        }
      />

      {/* 404 */}
      <Route
        path="*"
        element={<NotFound />}
      />
    </Routes>
  );
}