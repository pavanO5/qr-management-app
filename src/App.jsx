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
  const teamId = localStorage.getItem("team_id");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_, session) => setSession(session)
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        {/* LOGIN */}
        {!session && !teamId && (
          <Route path="*" element={<Login />} />
        )}

        {/* ADMIN */}
        {session && (
          <>
            <Route path="/" element={<Dashboard />} />
            <Route path="/qr-manager" element={<QRManager />} />
            <Route path="/riddle-manager" element={<RiddleManager />} />
            <Route path="/admin/teams" element={<TeamManager />} />
          </>
        )}

        {/* TEAM */}
        {teamId && (
          <>
            <Route path="/scan" element={<ScanQR />} />
            <Route path="/riddle" element={<RiddlePage />} />
          </>
        )}

        {/* FALLBACK */}
        <Route
          path="*"
          element={
            session ? (
              <Navigate to="/" />
            ) : teamId ? (
              <Navigate to="/scan" />
            ) : (
              <Navigate to="/" />
            )
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
