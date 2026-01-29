import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { supabase } from "./supabase";

/* Pages */
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import QRManager from "./pages/QRManager";
import RiddleManager from "./pages/RiddleManager";
import ScanQR from "./pages/ScanQR";
import RiddlePage from "./pages/RiddlePage";
import TeamManager from "./pages/TeamManager";
import Leaderboard from "./pages/Leaderboard"; // ✅ ADD THIS

function App() {
  const [session, setSession] = useState(null);
  const [teamId, setTeamId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      setTeamId(localStorage.getItem("team_id"));
      setLoading(false);
    };

    load();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  if (loading) return <p>Loading...</p>;

  return (
    <BrowserRouter>
      <Routes>
        {/* PUBLIC */}
        <Route path="/login" element={<Login />} />

        {/* ADMIN ROUTES */}
        <Route
          path="/"
          element={session ? <Dashboard /> : <Navigate to="/login" />}
        />
        <Route
          path="/qr-manager"
          element={session ? <QRManager /> : <Navigate to="/login" />}
        />
        <Route
          path="/riddle-manager"
          element={session ? <RiddleManager /> : <Navigate to="/login" />}
        />
        <Route
          path="/admin/teams"
          element={session ? <TeamManager /> : <Navigate to="/login" />}
        />

        {/* TEAM ROUTES */}
        <Route
          path="/scan"
          element={teamId ? <ScanQR /> : <Navigate to="/login" />}
        />
        <Route
          path="/riddle"
          element={teamId ? <RiddlePage /> : <Navigate to="/login" />}
        />

        {/* ✅ NEW LEADERBOARD PAGE */}
        <Route
          path="/leaderboard"
          element={teamId ? <Leaderboard /> : <Navigate to="/login" />}
        />

        {/* FALLBACK */}
        <Route
          path="*"
          element={
            session ? (
              <Navigate to="/" />
            ) : teamId ? (
              <Navigate to="/scan" />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
