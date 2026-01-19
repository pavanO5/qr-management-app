import { useEffect, useState } from "react";
import { supabase } from "../supabase";
import { QRCodeCanvas } from "qrcode.react";

function AdminDashboard() {
  const [count, setCount] = useState(1);
  const [maxScans, setMaxScans] = useState(1);
  const [qrName, setQrName] = useState("");
  const [qrDescription, setQrDescription] = useState("");
  const [logs, setLogs] = useState([]);
  const [qrCodes, setQrCodes] = useState([]);

  // ----------------------------
  // Generate QR Codes
  // ----------------------------
  const generateQRCodes = async () => {
    if (!qrName.trim()) {
      alert("Please enter QR name");
      return;
    }

    const records = [];

    for (let i = 0; i < count; i++) {
      records.push({
        qr_value: crypto.randomUUID(),
        max_scans: maxScans,
        name: qrName,
        description: qrDescription,
      });
    }

    const { error } = await supabase.from("qr_codes").insert(records);

    if (error) {
      alert(error.message);
    } else {
      alert(`${count} QR codes generated`);
      setQrName("");
      setQrDescription("");
      fetchQRCodes();
      fetchLogs();
    }
  };

  // ----------------------------
  // Fetch QR Codes
  // ----------------------------
  const fetchQRCodes = async () => {
    const { data, error } = await supabase
      .from("qr_codes")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error) setQrCodes(data);
  };

  // ----------------------------
  // Fetch Scan Logs
  // ----------------------------
  const fetchLogs = async () => {
    const { data, error } = await supabase
      .from("scans")
      .select(`
        id,
        scanned_at,
        latitude,
        longitude,
        qr_codes (
          qr_value,
          name,
          description
        )
      `)
      .order("scanned_at", { ascending: false });

    if (!error) setLogs(data);
  };

  useEffect(() => {
    fetchQRCodes();
    fetchLogs();
  }, []);

  return (
    <div style={{ marginTop: "20px" }}>
      <h3>Admin Dashboard</h3>

      {/* ---------------- QR GENERATION ---------------- */}
      <h4>Generate QR Codes</h4>

      <label>QR Name</label>
      <input
        type="text"
        placeholder="e.g. Library Entry"
        value={qrName}
        onChange={(e) => setQrName(e.target.value)}
      />

      <label>QR Description</label>
      <input
        type="text"
        placeholder="e.g. Staff Only"
        value={qrDescription}
        onChange={(e) => setQrDescription(e.target.value)}
      />

      <label>Number of QR Codes</label>
      <input
        type="number"
        value={count}
        min="1"
        onChange={(e) => setCount(Number(e.target.value))}
      />

      <label>Max Scans Per QR</label>
      <input
        type="number"
        value={maxScans}
        min="1"
        onChange={(e) => setMaxScans(Number(e.target.value))}
      />

      <button onClick={generateQRCodes}>
        Generate QR Codes
      </button>

      <hr />

      {/* ---------------- QR DISPLAY ---------------- */}
      <h4>Generated QR Codes</h4>

      {qrCodes.length === 0 && <p>No QR codes generated yet</p>}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
          gap: "16px",
        }}
      >
        {qrCodes.map((qr) => (
          <div
            key={qr.id}
            style={{
              border: "1px solid #ccc",
              padding: "10px",
              textAlign: "center",
            }}
          >
            <QRCodeCanvas value={qr.qr_value} size={120} />

            <p><strong>{qr.name}</strong></p>
            <p style={{ fontSize: "12px", color: "#555" }}>
              {qr.description}
            </p>

            <p style={{ fontSize: "11px", wordBreak: "break-all" }}>
              {qr.qr_value}
            </p>

            <p>
              {qr.scans_done} / {qr.max_scans} scans
            </p>

            {!qr.is_active && (
              <p style={{ color: "red", fontWeight: "bold" }}>
                EXPIRED
              </p>
            )}
          </div>
        ))}
      </div>

      <hr />

      {/* ---------------- SCAN LOGS ---------------- */}
      <h4>Scan Logs</h4>

      {logs.length === 0 && <p>No scans yet</p>}

      {logs.map((log) => (
        <div
          key={log.id}
          style={{
            border: "1px solid #ccc",
            padding: "10px",
            marginBottom: "10px",
          }}
        >
          <p><strong>QR Name:</strong> {log.qr_codes?.name}</p>
          <p><strong>Description:</strong> {log.qr_codes?.description}</p>
          <p><strong>Time:</strong> {new Date(log.scanned_at).toLocaleString()}</p>
          <p><strong>Latitude:</strong> {log.latitude}</p>
          <p><strong>Longitude:</strong> {log.longitude}</p>
        </div>
      ))}
    </div>
  );
}

export default AdminDashboard;
