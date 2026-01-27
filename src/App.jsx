import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) return <p>Loading...</p>;

return (
  <BrowserRouter>
    <Routes>
      {/* If admin OR team logged in */}
      {session || localStorage.getItem("team_id") ? (
        <>
          {/* ADMIN ROUTES */}
          <Route path="/" element={<Dashboard />} />
          <Route path="/qr-manager" element={<QRManager />} />
          <Route path="/riddle-manager" element={<RiddleManager />} />
          <Route path="/admin/teams" element={<TeamManager />} />

          {/* TEAM ROUTES */}
          <Route path="/scan" element={<ScanQR />} />
          <Route path="/riddle" element={<RiddlePage />} />

          {/* FALLBACK */}
          <Route path="*" element={<Dashboard />} />
        </>
      ) : (
        <Route path="*" element={<Login />} />
      )}
    </Routes>
  </BrowserRouter>
);
}

export default App;
