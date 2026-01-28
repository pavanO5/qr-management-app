import { useEffect, useRef, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { supabase } from "../supabase";
import { useNavigate } from "react-router-dom";

function ScanQR() {
  const navigate = useNavigate();
  const hasScanned = useRef(false);

  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState(false);

  /* ---------------- LOCATION ---------------- */
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

  /* ---------------- QR SCANNER ---------------- */
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

  /* ---------------- MAIN LOGIC ---------------- */
  const handleScan = async (rawQrValue) => {
    try {
      const qrValue = rawQrValue.trim();
      const teamId = localStorage.getItem("team_id");

      if (!teamId) {
        alert("Session expired. Login again.");
        navigate("/login");
        return;
      }

      const { data: qrData, error } = await supabase
        .from("qr_codes")
        .select("*")
        .eq("qr_value", qrValue)
        .single();

      if (!qrData || error) {
        alert("Invalid QR Code");
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

  /* ---------------- UI ---------------- */
  return (
    <div style={{ padding: 20, textAlign: "center" }}>
      <h3>Scan QR Code</h3>

      {!location && (
        <>
          <p>Waiting for location permission...</p>
          {locationError && (
            <>
              <p style={{ color: "red" }}>
                Location access is required
              </p>
              <button onClick={() => window.location.reload()}>
                Retry
              </button>
            </>
          )}
        </>
      )}

      <div id="qr-reader" style={{ width: "100%" }} />

      <button
        style={{
          marginTop: 20,
          background: "crimson",
          color: "white",
          padding: "10px 16px",
          border: "none",
          borderRadius: 6,
        }}
        onClick={() => {
          localStorage.removeItem("team_id");
          navigate("/login");
        }}
      >
        Logout
      </button>
    </div>
  );
}

export default ScanQR;
