import { useEffect, useRef, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { supabase } from "../supabase";
import { useNavigate } from "react-router-dom";

function ScanQR() {
  const navigate = useNavigate();
  const hasScanned = useRef(false);
  const [loading, setLoading] = useState(true);

  /* =============================
     CHECK TEAM LOGIN
  ============================= */
  useEffect(() => {
    const teamId = localStorage.getItem("team_id");
    if (!teamId) {
      navigate("/login");
      return;
    }
    setLoading(false);
  }, [navigate]);

  /* =============================
     QR SCANNER
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
     MAIN SCAN LOGIC
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

      // Validate QR
      const { data: qrData, error: qrError } = await supabase
        .from("qr_codes")
        .select("*")
        .eq("qr_value", qrValue)
        .single();

      if (qrError || !qrData) {
        alert("Invalid QR");
        hasScanned.current = false;
        return;
      }

      if (!qrData.is_active) {
        alert("QR expired");
        hasScanned.current = false;
        return;
      }

      // ✅ INSERT SCAN (CRITICAL FIX)
      const { error: scanError } = await supabase
        .from("scans")
        .insert({
          qr_id: qrData.id,
          team_id: teamId,
          scanned_at: new Date().toISOString(),
        });

      if (scanError) {
        console.error("Scan insert failed:", scanError);
        alert("Scan could not be recorded");
        hasScanned.current = false;
        return;
      }

      // Assign riddle
      const { error: rpcError } = await supabase.rpc("handle_qr_scan", {
        p_user: teamId,
        p_qr: qrData.id,
      });

      if (rpcError) {
        alert(rpcError.message);
        hasScanned.current = false;
        return;
      }

      navigate("/riddle");
    } catch (err) {
      console.error(err);
      alert("Scan failed");
      hasScanned.current = false;
    }
  };

  /* =============================
     LOGOUT
  ============================= */
  const logout = () => {
    localStorage.removeItem("team_id");
    navigate("/login");
  };

  /* =============================
     UI
  ============================= */
  return (
    <div style={{ padding: 20 }}>
      <h2>Scan QR</h2>

      <div id="qr-reader" style={{ width: "100%" }} />

      <button
        onClick={() => navigate("/leaderboard")}
        style={{
          marginTop: 15,
          background: "#1e90ff",
          color: "white",
          padding: "10px 16px",
          border: "none",
          borderRadius: 6,
        }}
      >
        View Leaderboard
      </button>

      <br />

      <button
        onClick={logout}
        style={{
          marginTop: 10,
          background: "crimson",
          color: "white",
          padding: "10px 16px",
          border: "none",
          borderRadius: 6,
        }}
      >
        Logout
      </button>
    </div>
  );
}

export default ScanQR;
