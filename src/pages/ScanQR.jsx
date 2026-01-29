import { useEffect, useRef, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { supabase } from "../supabase";
import { useNavigate } from "react-router-dom";

function ScanQR() {
  const navigate = useNavigate();
  const hasScanned = useRef(false);

  const [loading, setLoading] = useState(true);
  const [leaderboard, setLeaderboard] = useState([]);

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
    fetchLeaderboard();
  }, []);

  /* =============================
     FETCH LEADERBOARD
  ============================= */
  const fetchLeaderboard = async () => {
    const { data, error } = await supabase.rpc("get_leaderboard");
    if (!error) setLeaderboard(data || []);
  };

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

      const { data: qrData, error } = await supabase
        .from("qr_codes")
        .select("*")
        .eq("qr_value", qrValue)
        .single();

      if (!qrData || error) {
        alert("Invalid QR");
        return;
      }

      if (!qrData.is_active) {
        alert("QR expired");
        return;
      }

      // Save scan
      await supabase.from("scans").insert({
        qr_id: qrData.id,
        user_id: teamId,
      });

      // Assign riddle
      const { error: rpcError } = await supabase.rpc(
        "handle_qr_scan",
        {
          p_user: teamId,
          p_qr: qrData.id,
        }
      );

      if (rpcError) {
        alert(rpcError.message);
        return;
      }

      navigate("/riddle");
    } catch (err) {
      console.error(err);
      alert("Scan failed");
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
        onClick={logout}
        style={{
          marginTop: 15,
          background: "crimson",
          color: "white",
          padding: "10px 16px",
          border: "none",
          borderRadius: 6,
        }}
      >
        Logout
      </button>

      <hr />

      <h3>🏆 Leaderboard</h3>

      {leaderboard.map((team, index) => (
        <div
          key={team.team_id}
          style={{
            padding: 10,
            marginBottom: 6,
            borderRadius: 6,
            background:
              team.team_id === localStorage.getItem("team_id")
                ? "#d1ffe3"
                : "#f3f3f3",
            fontWeight:
              team.team_id === localStorage.getItem("team_id")
                ? "bold"
                : "normal",
          }}
        >
          #{index + 1} — Team {team.team_code} — {team.total_scans} scans{" "}
          {team.team_id === localStorage.getItem("team_id") && "(You)"}
        </div>
      ))}
    </div>
  );
}

export default ScanQR;
