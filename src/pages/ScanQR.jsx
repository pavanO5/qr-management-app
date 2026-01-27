import { useEffect, useRef, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { supabase } from "../supabase";
import { useNavigate } from "react-router-dom";

function ScanQR() {
  const navigate = useNavigate();
  const hasScanned = useRef(false);

  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState(false);

  /* =========================
     GET USER LOCATION
  ========================= */
  useEffect(() => {
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
  }, []);

  /* =========================
     LOGOUT
  ========================= */
  const logout = () => {
    localStorage.removeItem("team_id");
    navigate("/");
  };

  /* =========================
     BLOCK IF NO LOCATION
  ========================= */
  if (!location || locationError) {
    return (
      <div style={{ padding: 30, textAlign: "center" }}>
        <h3>Location Access Required</h3>
        <p>Please allow location access to scan QR</p>
        <button onClick={() => window.location.reload()}>
          Retry
        </button>
        <br /><br />
        <button onClick={logout}>Logout</button>
      </div>
    );
  }

  /* =========================
     QR SCANNER
  ========================= */
  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        rememberLastUsedCamera: false,
        videoConstraints: {
          facingMode: "environment",
        },
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

  /* =========================
     MAIN SCAN LOGIC
  ========================= */
  const handleScan = async (rawQrValue) => {
    try {
      const qrValue = rawQrValue.trim();

      const teamId = localStorage.getItem("team_id");
      if (!teamId) {
        alert("Session expired. Please login again.");
        navigate("/");
        return;
      }

      /* 1️⃣ Fetch QR */
      const { data: qrData, error: qrError } = await supabase
        .from("qr_codes")
        .select("*")
        .eq("qr_value", qrValue)
        .single();

      if (qrError || !qrData) {
        alert("Invalid QR Code");
        return;
      }

      if (!qrData.is_active) {
        alert("QR Code expired");
        return;
      }

      /* 2️⃣ Log scan */
      await supabase.from("scans").insert({
        qr_id: qrData.id,
        user_id: teamId,
        latitude: location.latitude,
        longitude: location.longitude,
      });

      /* 3️⃣ Game Logic (RIDDLE ASSIGNMENT) */
      const { error } = await supabase.rpc("handle_qr_scan", {
        p_user: teamId,
        p_qr: qrData.id,
      });

      if (error) {
        alert(error.message);
        return;
      }

      /* 4️⃣ Redirect */
      navigate("/riddle");

    } catch (err) {
      console.error(err);
      alert("Something went wrong while scanning.");
    }
  };

  return (
    <div style={{ padding: "20px", textAlign: "center" }}>
      <h3>Scan QR Code</h3>

      <div id="qr-reader" style={{ width: "100%" }} />

      <button
        onClick={logout}
        style={{
          marginTop: 20,
          background: "crimson",
          color: "white",
          padding: "10px 16px",
          border: "none",
          borderRadius: "6px",
        }}
      >
        Logout
      </button>
    </div>
  );
}

export default ScanQR;
