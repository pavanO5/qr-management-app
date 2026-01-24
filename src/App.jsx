import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { supabase } from "./supabase";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ScanResult from "./pages/ScanResult";
import RiddlePage from "./pages/RiddlePage";

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
          // 🔒 Not logged in
          <Route path="*" element={<Login />} />
        ) : (
          <>
            {/* Dashboard */}
            <Route path="/" element={<Dashboard />} />

            {/* After QR scan */}
            <Route path="/scan-result" element={<ScanResult />} />

            {/* Riddle page */}
            <Route path="/riddle" element={<RiddlePage />} />

            {/* Fallback */}
            <Route path="*" element={<Dashboard />} />
          </>
        )}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
