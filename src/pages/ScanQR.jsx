import { useEffect, useRef, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { supabase } from "../supabase";
import { useNavigate } from "react-router-dom";

function ScanQR() {
  const navigate = useNavigate();
  const hasScanned = useRef(false);

  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState(false);

  /* 📍 LOCATION */
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

  /* 🚪 LOGOUT */
  const logout = () => {
    localStorage.removeItem("team_id");
    navigate("/");
  };

  /* ❌ Location block */
  if (!location || locationError) {
  return (
    <div style={{ padding: 30, textAlign: "center" }}>
      <h3>📍 Location Permission Required</h3>

      <p>
        Please allow location access in your browser settings.
      </p>

      <p style={{ fontSize: 14, color: "#666" }}>
        Chrome → Lock icon → Location → Allow → Refresh
      </p>

      <button onClick={getLocation} style={{ margin: 10 }}>
        Retry
      </button>

      <button
        onClick={() => {
          localStorage.removeItem("team_id");
          window.location.href = "/";
        }}
      >
        Logout
      </button>
    </div>
  );
}

  /* 📷 QR SCANNER */
  useEffect(() => {
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
  }, [location]);

  /* 🧠 MAIN LOGIC */
  const handleScan = async (rawQrValue) => {
    try {
      const qrValue = rawQrValue.trim();
      const teamId = localStorage.getItem("team_id");

      if (!teamId) {
        alert("Session expired");
        navigate("/");
        return;
      }

      /* 1️⃣ Fetch QR */
      const { data: qrData } = await supabase
        .from("qr_codes")
        .select("*")
        .eq("qr_value", qrValue)
        .single();

      if (!qrData || !qrData.is_active) {
        alert("Invalid or expired QR");
        return;
      }

      /* 2️⃣ Log Scan */
      await supabase.from("scans").insert({
        qr_id: qrData.id,
        user_id: teamId,
        latitude: location.latitude,
        longitude: location.longitude,
      });

      /* 3️⃣ Assign Riddle */
      const { error } = await supabase.rpc("handle_qr_scan", {
        p_user: teamId,
        p_qr: qrData.id,
      });

      if (error) {
        alert(error.message);
        return;
      }

      /* 4️⃣ VERIFY RIDDLE EXISTS */
      const { data: riddle } = await supabase
        .from("user_riddles")
        .select("*")
        .eq("user_id", teamId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (!riddle) {
        alert("No riddle assigned. Try again.");
        return;
      }

      /* ✅ SUCCESS */
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
