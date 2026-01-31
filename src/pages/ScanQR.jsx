import { useEffect, useRef, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { supabase } from "../supabase";
import { useNavigate } from "react-router-dom";

function ScanQR() {
  const navigate = useNavigate();
  const hasScanned = useRef(false);
  const [loading, setLoading] = useState(true);

  /* =============================
     CHECK TEAM LOGIN (PERSISTENT)
  ============================= */
  useEffect(() => {
    const teamId = localStorage.getItem("team_id");

    // ✅ user stays logged in across reloads
    if (!teamId) {
      navigate("/login", { replace: true });
      return;
    }

    setLoading(false);
  }, [navigate]);

  /* =============================
     QR SCANNER (UNCHANGED LOGIC)
  ============================= */
  useEffect(() => {
    if (loading) return;

    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
      },
      false
    );

    scanner.render(
      async (decodedText) => {
        if (hasScanned.current) return;
        hasScanned.current = true;

        await scanner.clear();
        await handleScan(decodedText);
      },
      () => {}
    );

    return () => {
      scanner.clear().catch(() => {});
    };
  }, [loading]);

  /* =============================
     MAIN SCAN LOGIC (DO NOT TOUCH)
  ============================= */
  const handleScan = async (rawQrValue) => {
    try {
      const teamId = localStorage.getItem("team_id");
      if (!teamId) {
        alert("Session expired");
        navigate("/login");
        return;
      }

      const qrValue = rawQrValue.trim();

      const { data: qrData, error: qrError } = await supabase
        .from("qr_codes")
        .select("id")
        .eq("qr_value", qrValue)
        .single();

      if (qrError || !qrData) {
        alert("Invalid QR");
        hasScanned.current = false;
        return;
      }

      const { error: rpcError } = await supabase.rpc("handle_qr_scan", {
        p_user: teamId,
        p_qr: qrData.id,
      });

      if (rpcError) {
        alert(rpcError.message);
        hasScanned.current = false;
        return;
      }

      navigate("/riddle", { replace: true });
    } catch (err) {
      console.error(err);
      alert("Scan failed");
      hasScanned.current = false;
    }
  };

  /* =============================
     LOGOUT (EXPLICIT ONLY)
  ============================= */
  const logout = () => {
    localStorage.removeItem("team_id");
    navigate("/login", { replace: true });
  };

  /* =============================
     UI
  ============================= */
  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #0f2a44 0%, #1e5fa3 50%, #ffffff 100%)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 20,
      }}
    >
      {/* ================= HEADER ================= */}
      <header style={{ textAlign: "center", color: "white" }}>
        <h1
          style={{
            fontSize: 38,
            fontWeight: 900,
            letterSpacing: 3,
          }}
        >
          TREASURE HUNT
        </h1>
      </header>

      {/* ================= MAIN ================= */}
      <main
        style={{
          background: "white",
          borderRadius: 14,
          padding: 25,
          maxWidth: 420,
          margin: "0 auto",
          boxShadow: "0 15px 40px rgba(0,0,0,0.25)",
          textAlign: "center",
        }}
      >
        <h2
          style={{
            fontSize: 26,
            fontWeight: 800,
            marginBottom: 15,
            letterSpacing: 1.5,
          }}
        >
          SCAN QR
        </h2>

        <div id="qr-reader" style={{ width: "100%" }} />

        <button
          onClick={() => navigate("/leaderboard")}
          style={{
            marginTop: 18,
            width: "100%",
            background: "#1e5fa3",
            color: "white",
            padding: "12px",
            border: "none",
            borderRadius: 8,
            fontWeight: 700,
            letterSpacing: 1,
          }}
        >
          VIEW LEADERBOARD
        </button>

        <button
          onClick={logout}
          style={{
            marginTop: 10,
            width: "100%",
            background: "crimson",
            color: "white",
            padding: "12px",
            border: "none",
            borderRadius: 8,
            fontWeight: 700,
          }}
        >
          LOGOUT
        </button>
      </main>

      {/* ================= FOOTER ================= */}
      <footer style={{ textAlign: "center" }}>
        <h3
          style={{
            fontSize: 20,
            fontWeight: 900,
            letterSpacing: 2,
            marginBottom: 2,
          }}
        >
          KARUKRIT
        </h3>
        <p
          style={{
            fontSize: 11,
            letterSpacing: 1.2,
          }}
        >
          A FEST BY DEPARTMENT OF CSE
        </p>
      </footer>
    </div>
  );
}

export default ScanQR;
