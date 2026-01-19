import { useEffect } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { supabase } from "../supabase";
import { useNavigate } from "react-router-dom";


function ScanQR({ location }) {
  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        rememberLastUsedCamera: false,
        videoConstraints: {
          facingMode: "environment"   // ✅ correct
        }
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

    const { data, error } = await supabase
      .from("qr_codes")
      .select("*")
      .eq("qr_value", qrValue);

    if (error || !data || data.length === 0) {
      alert("Invalid QR code");
      return;
    }

    const qr = data[0];

    if (!qr.is_active) {
      alert("QR code expired");
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    await supabase.from("scans").insert({
      qr_id: qr.id,
      user_id: user.id,
      latitude: location.latitude,
      longitude: location.longitude,
    });

    const { error: updateError } = await supabase.rpc(
      "increment_scan_count",
      { qr_id_input: qr.id }
    );

    if (updateError) {
      alert("QR scan limit reached");
      return;
    }

    alert("QR scanned successfully");
  };

  return (
    <div style={{ padding: "20px" }}>
      <h3>Scan QR Code</h3>
      <div id="qr-reader" style={{ width: "100%" }}></div>
    </div>
  );
}

export default ScanQR;
