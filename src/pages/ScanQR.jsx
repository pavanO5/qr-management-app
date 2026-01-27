import { useEffect, useRef } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { supabase } from "../supabase";
import { useNavigate } from "react-router-dom";

function ScanQR({ location }) {
  const navigate = useNavigate();
  const hasScanned = useRef(false);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        rememberLastUsedCamera: false,
        videoConstraints: { facingMode: "environment" },
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
  }, []);

  const handleScan = async (rawQrValue) => {
    try {
      const qrValue = rawQrValue.trim();

      /* ✅ TEAM VALIDATION */
      const teamId = localStorage.getItem("team_id");
      if (!teamId) {
        alert("Please login as a team first.");
        navigate("/login");
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
        user_id: teamId, // 👈 TEAM ID, NOT auth user
        latitude: location?.latitude || null,
        longitude: location?.longitude || null,
      });

      /* 3️⃣ Game Logic */
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
      console.error("Scan error:", err);
      alert("Something went wrong while scanning.");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h3>Scan QR Code</h3>
      <div id="qr-reader" style={{ width: "100%" }} />
    </div>
  );
}

export default ScanQR;
