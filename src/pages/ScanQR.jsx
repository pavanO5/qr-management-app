import { useEffect } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { supabase } from "../supabase";
import { useNavigate } from "react-router-dom";

function ScanQR({ location }) {
  const navigate = useNavigate();

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        rememberLastUsedCamera: false,
        videoConstraints: {
          facingMode: "environment", // back camera
        },
      },
      false
    );

    scanner.render(
      async (decodedText) => {
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
    const qrValue = rawQrValue.trim();

    // 1️⃣ Fetch QR
    const { data: qrData, error } = await supabase
      .from("qr_codes")
      .select("*")
      .eq("qr_value", qrValue)
      .single();

    if (error || !qrData) {
      alert("Invalid QR Code");
      return;
    }

    if (!qrData.is_active) {
      alert("QR Code expired");
      return;
    }

    // 2️⃣ Get logged-in user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("User not logged in");
      return;
    }

    // 3️⃣ Insert scan log
    await supabase.from("scans").insert({
      qr_id: qrData.id,
      user_id: user.id,
      latitude: location?.latitude || null,
      longitude: location?.longitude || null,
    });

    // 4️⃣ Assign riddle + auto-expire logic
    const { data: riddleId, error: assignError } =
      await supabase.rpc("handle_qr_scan", {
        p_user: user.id,
        p_qr: qrData.id,
      });

    if (assignError) {
      alert(assignError.message);
      return;
    }

    // 5️⃣ Redirect to riddle page
    navigate(`/riddle/${riddleId}`);
  };

  return (
    <div style={{ padding: "20px" }}>
      <h3>Scan QR Code</h3>
      <div id="qr-reader" style={{ width: "100%" }} />
    </div>
  );
}

export default ScanQR;
