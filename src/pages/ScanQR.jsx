import { useEffect, useRef, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { supabase } from "../supabase";
import { useNavigate } from "react-router-dom";

function ScanQR() {
  const navigate = useNavigate();
  const hasScanned = useRef(false);

  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState(false);

  /* ✅ GET LOCATION */
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
      },
      () => setLocationError(true),
      { enableHighAccuracy: true }
    );
  }, []);

  /* ✅ QR SCANNER (always runs, never conditional) */
  useEffect(() => {
    if (!location) return;

    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      { fps: 10, qrbox: 250 },
      false
    );

    scanner.render(async (decodedText) => {
      if (hasScanned.current) return;
      hasScanned.current = true;

      await scanner.clear();
      handleScan(decodedText);
    });

    return () => {
      scanner.clear().catch(() => {});
    };
  }, [location]);

  const logout = () => {
    localStorage.removeItem("team_id");
    window.location.href = "/";
  };

  const handleScan = async (rawQrValue) => {
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
        .eq("qr_value", rawQrValue.trim())
        .single();

      if (!qrData || !qrData.is_active) {
        alert("Invalid or expired QR");
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
      console.error(err);
      alert("Scan failed");
    }
  };

  /* ✅ UI (NO HOOKS BELOW THIS) */
  if (locationError) {
    return (
      <div style={{ padding: 30 }}>
        <h3>Location permission required</h3>
        <button onClick={() => window.location.reload()}>Retry</button>
        <button onClick={logout}>Logout</button>
      </div>
    );
  }

  if (!location) {
    return <p style={{ textAlign: "center" }}>Getting location...</p>;
  }

  return (
    <div style={{ padding: 20 }}>
      <h3>Scan QR Code</h3>
      <div id="qr-reader" />
      <button onClick={logout} style={{ marginTop: 20 }}>
        Logout
      </button>
    </div>
  );
}

export default ScanQR;
