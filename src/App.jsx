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

function App() {
  const [session, setSession] = useState(null);
  const [teamId, setTeamId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Admin session
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    // Team session
    const team = localStorage.getItem("team_id");
    if (team) setTeamId(team);

    setLoading(false);
  }, []);

  if (loading) return <p>Loading...</p>;

  return (
    <BrowserRouter>
      <Routes>
        {/* ================= NOT LOGGED IN ================= */}
        {!session && !teamId && (
          <>
            <Route path="*" element={<Login />} />
          </>
        )}

        {/* ================= ADMIN ================= */}
        {session && (
          <>
            <Route path="/" element={<Dashboard />} />
            <Route path="/qr-manager" element={<QRManager />} />
            <Route path="/riddle-manager" element={<RiddleManager />} />
            <Route path="/admin/teams" element={<TeamManager />} />

            {/* fallback */}
            <Route path="*" element={<Navigate to="/" />} />
          </>
        )}

        {/* ================= TEAM ================= */}
        {teamId && !session && (
          <>
            <Route path="/scan" element={<ScanQR />} />
            <Route path="/riddle" element={<RiddlePage />} />

            {/* redirect all to scan */}
            <Route path="*" element={<Navigate to="/scan" />} />
          </>
        )}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
