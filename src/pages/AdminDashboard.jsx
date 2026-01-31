import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase";

function AdminDashboard() {
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);

  /* ================= FETCH SCAN LOGS ================= */
  const fetchLogs = async () => {
    const { data, error } = await supabase
      .from("scans")
      .select(`
        id,
        scanned_at,
        teams ( team_code ),
        qr_codes ( name )
      `)
      .order("scanned_at", { ascending: false });

    if (error) {
      console.error("Fetch logs error:", error);
      return;
    }

    setLogs(data || []);
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  /* ================= TIME CONVERSION (UTC → IST) ================= */
  const formatIST = (utcTime) => {
    return new Date(utcTime).toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  };

  return (
    <div style={{ padding: 30 }}>
      <h2>Admin Dashboard</h2>

      {/* ================= NAVIGATION ================= */}
      <div style={{ display: "flex", gap: 20, marginBottom: 30 }}>
        <button onClick={() => navigate("/qr-manager")}>
          QR Management
        </button>

        <button onClick={() => navigate("/riddle-manager")}>
          Riddle Management
        </button>

        <button onClick={() => navigate("/admin/teams")}>
          Team Management
        </button>
      </div>

      <hr />

      {/* ================= SCAN LOGS ================= */}
      <h3>Scan Logs</h3>

      {logs.length === 0 && <p>No scans yet</p>}

      {logs.map((log) => (
        <div
          key={log.id}
          style={{
            border: "1px solid #ccc",
            padding: 12,
            marginBottom: 12,
            borderRadius: 8,
            background: "#f9f9f9",
          }}
        >
          <p>
            <b>Team:</b>{" "}
            <span style={{ color: "#1e5fa3", fontWeight: 600 }}>
              {log.teams?.team_code || "Unknown"}
            </span>
          </p>

          <p>
            <b>QR Scanned:</b>{" "}
            <span style={{ fontWeight: 600 }}>
              {log.qr_codes?.name || "Unknown"}
            </span>
          </p>

          <p>
            <b>Time (IST):</b>{" "}
            {formatIST(log.scanned_at)}
          </p>
        </div>
      ))}
    </div>
  );
}

export default AdminDashboard;
