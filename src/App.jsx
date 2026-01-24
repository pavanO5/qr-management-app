import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { supabase } from "./supabase";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ScanResult from "./pages/ScanResult";
import RiddlePage from "./pages/RiddlePage";
import ScanQR from "./pages/ScanQR";

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
        {!session ? (
          /* 🔐 NOT LOGGED IN */
          <Route path="*" element={<Login />} />
        ) : (
          <>
            {/* MAIN DASHBOARD */}
            <Route path="/" element={<Dashboard />} />

            {/* QR SCANNER */}
            <Route path="/scan" element={<ScanQR />} />

            {/* SCAN RESULT (optional) */}
            <Route path="/scan-result" element={<ScanResult />} />

            {/* RIDDLE PAGE (IMPORTANT) */}
            <Route path="/riddle/:id" element={<RiddlePage />} />

            {/* FALLBACK */}
            <Route path="*" element={<Dashboard />} />
          </>
        )}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
