import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase";

function AdminDashboard() {
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);

  const fetchLogs = async () => {
    const { data } = await supabase
      .from("scans")
      .select("*, qr_codes(name)")
      .order("scanned_at", { ascending: false });

    setLogs(data || []);
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div style={{ padding: 30 }}>
      <h2>Admin Dashboard</h2>

      {/* NAVIGATION */}
      <div style={{ display: "flex", gap: 20, marginBottom: 30 }}>
        <button onClick={() => navigate("/admin/qrs")}>
          QR Management
        </button>

        <button onClick={() => navigate("/admin/riddles")}>
          Riddle Management
        </button>
      </div>

      <hr />

      {/* LOGS */}
      <h3>Scan Logs</h3>

      {logs.length === 0 && <p>No scans yet</p>}

      {logs.map((log) => (
        <div
          key={log.id}
          style={{
            border: "1px solid #ccc",
            padding: 10,
            marginBottom: 10,
          }}
        >
          <p><b>QR:</b> {log.qr_codes?.name}</p>
          <p><b>Time:</b> {new Date(log.scanned_at).toLocaleString()}</p>
          <p><b>Latitude:</b> {log.latitude}</p>
          <p><b>Longitude:</b> {log.longitude}</p>
        </div>
      ))}
    </div>
  );
}

export default AdminDashboard;
