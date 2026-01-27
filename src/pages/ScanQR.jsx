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
  const getLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
        setLocationError(false);
      },
      () => setLocationError(true),
      { enableHighAccuracy: true }
    );
  };

  useEffect(() => {
    getLocation();
  }, []);

  /* ✅ LOGOUT */
  const logout = () => {
    localStorage.removeItem("team_id");
    navigate("/");
  };

  /* ⛔ Block scan if no location */
  if (!location || locationError) {
    return (
      <div style={{ padding: 30, textAlign: "center" }}>
        <h3>Location Required</h3>
        <button onClick={getLocation} style={{ margin: 10 }}>
          Retry
        </button>
        <button onClick={logout}>Logout</button>
      </div>
    );
  }

  /* ✅ QR Scanner */
  useEffect(() => {
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

  /* ✅ MAIN LOGIC */
  const handleScan = async (rawQrValue) => {
    try {
      const qrValue = rawQrValue.trim();

      const teamId = localStorage.getItem("team_id");
      if (!teamId) {
        alert("Session expired. Please login again.");
        navigate("/");
        return;
      }

      /* Fetch QR */
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
        alert("QR Code expired");
        return;
      }

      /* Log Scan */
      await supabase.from("scans").insert({
        qr_id: qrData.id,
        user_id: teamId,
        latitude: location.latitude,
        longitude: location.longitude,
      });

      /* Game Logic */
      const { error: rpcError } = await supabase.rpc("handle_qr_scan", {
        p_user: teamId,
        p_qr: qrData.id,
      });

      if (rpcError) {
        alert(rpcError.message);
        return;
      }

      /* ✅ Redirect */
      navigate("/riddle");
    } catch (err) {
      console.error(err);
      alert("Scan failed");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
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
