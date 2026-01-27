import { useEffect, useRef, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { supabase } from "../supabase";
import { useNavigate } from "react-router-dom";

function ScanQR() {
  const navigate = useNavigate();
  const hasScanned = useRef(false);
  const [locationAllowed, setLocationAllowed] = useState(false);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      () => setLocationAllowed(true),
      () => setLocationAllowed(false)
    );
  }, []);

  useEffect(() => {
    if (!locationAllowed) return;

    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      { fps: 10, qrbox: 250 },
      false
    );

    scanner.render(
      async (text) => {
        if (hasScanned.current) return;
        hasScanned.current = true;
        await scanner.clear();
        handleScan(text);
      },
      () => {}
    );

    return () => scanner.clear();
  }, [locationAllowed]);

  const handleScan = async (value) => {
    const teamId = localStorage.getItem("team_id");
    if (!teamId) {
      alert("Session expired");
      navigate("/");
      return;
    }

    const { data: qr } = await supabase
      .from("qr_codes")
      .select("*")
      .eq("qr_value", value)
      .single();

    if (!qr || !qr.is_active) {
      alert("Invalid or expired QR");
      return;
    }

    await supabase.rpc("handle_qr_scan", {
      p_user: teamId,
      p_qr: qr.id,
    });

    navigate("/riddle");
  };

  const logout = () => {
    localStorage.removeItem("team_id");
    navigate("/");
  };

  if (!locationAllowed)
    return (
      <div style={{ padding: 30 }}>
        <h2>Location Required</h2>
        <button onClick={() => window.location.reload()}>Retry</button>
        <button onClick={logout}>Logout</button>
      </div>
    );

  return <div id="qr-reader" style={{ width: "100%" }} />;
}

export default ScanQR;
