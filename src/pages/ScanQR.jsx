import { useEffect, useRef, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { supabase } from "../supabase";
import { useNavigate } from "react-router-dom";

function ScanQR() {
  const navigate = useNavigate();
  const hasScanned = useRef(false);

  const [location, setLocation] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
      },
      () => setError(true),
      { enableHighAccuracy: true }
    );
  }, []);

  const logout = () => {
    localStorage.removeItem("team_id");
    window.location.href = "/";
  };

  if (!location || error) {
    return (
      <div style={{ padding: 30 }}>
        <h3>Location Required</h3>
        <button onClick={() => window.location.reload()}>Retry</button>
        <button onClick={logout}>Logout</button>
      </div>
    );
  }

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      { fps: 10, qrbox: 250 },
      false
    );

    scanner.render(async (text) => {
      if (hasScanned.current) return;
      hasScanned.current = true;
      await scanner.clear();
      handleScan(text);
    });

    return () => scanner.clear().catch(() => {});
  }, [location]);

  const handleScan = async (qr) => {
    try {
      const teamId = localStorage.getItem("team_id");
      if (!teamId) {
        alert("Session expired");
        logout();
        return;
      }

      const { data: qrData } = await supabase
        .from("qr_codes")
        .select("*")
        .eq("qr_value", qr)
        .single();

      if (!qrData || !qrData.is_active) {
        alert("Invalid QR");
        return;
      }

      await supabase.from("scans").insert({
        qr_id: qrData.id,
        user_id: teamId,
        latitude: location.latitude,
        longitude: location.longitude,
      });

      const { error } = await supabase.rpc("handle_qr_scan", {
        p_user: teamId,
        p_qr: qrData.id,
      });

      if (error) {
        alert(error.message);
        return;
      }

      navigate("/riddle");
    } catch (err) {
      alert("Scan failed");
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h3>Scan QR</h3>
      <div id="qr-reader" />
      <button onClick={logout}>Logout</button>
    </div>
  );
}

export default ScanQR;
