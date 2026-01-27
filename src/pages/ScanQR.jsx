import { useEffect, useRef, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { supabase } from "../supabase";
import { useNavigate } from "react-router-dom";

function ScanQR() {
  const navigate = useNavigate();
  const hasScanned = useRef(false);

  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState(false);

  /* ================= LOCATION ================= */
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
        setLocationError(false);
      },
      () => {
        setLocationError(true);
      },
      { enableHighAccuracy: true }
    );
  }, []);

  /* ================= QR SCANNER ================= */
  useEffect(() => {
    if (!location) return;

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
  }, [location]);

  /* ================= LOGOUT ================= */
  const logout = () => {
    localStorage.removeItem("team_id");
    window.location.href = "/";
  };

  /* ================= HANDLE SCAN ================= */
  const handleScan = async (rawQrValue) => {
    try {
      const teamId = localStorage.getItem("team_id");
      if (!teamId) {
        alert("Session expired");
        navigate("/");
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

      await supabase.from("scans").insert({
        qr_id: qrData.id,
        user_id: teamId,
        latitude: location.latitude,
        longitude: location.longitude,
      });

      const { error: rpcError } = await supabase.rpc("handle_qr_scan", {
        p_user: teamId,
        p_qr: qrData.id,
      });

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

  /* ================= UI ================= */

  if (locationError) {
    return (
      <div style={{ padding: 30, textAlign: "center" }}>
        <h3>📍 Location Required</h3>
        <p>Please enable location access</p>

        <button onClick={() => window.location.reload()}>
          Retry
        </button>

        <button
          onClick={logout}
          style={{ background: "crimson", color: "white", marginTop: 10 }}
        >
          Logout
        </button>
      </div>
    );
  }

  if (!location) {
    return <p style={{ textAlign: "center" }}>Getting location...</p>;
  }

  return (
    <div style={{ padding: 20 }}>
      <h3>Scan QR Code</h3>
      <div id="qr-reader" style={{ width: "100%" }} />

      <button
        onClick={logout}
        style={{
          marginTop: 20,
          background: "crimson",
          color: "white",
          padding: "10px",
          border: "none",
        }}
      >
        Logout
      </button>
    </div>
  );
}

export default ScanQR;
