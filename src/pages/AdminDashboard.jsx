import { useEffect, useState } from "react";
import { supabase } from "../supabase";
import { QRCodeCanvas } from "qrcode.react";

function AdminDashboard() {
  const [qrCodes, setQrCodes] = useState([]);
  const [riddles, setRiddles] = useState([]);
  const [logs, setLogs] = useState([]);

  const [qrName, setQrName] = useState("");
  const [qrDescription, setQrDescription] = useState("");
  const [qrCount, setQrCount] = useState(1);
  const [maxScans, setMaxScans] = useState(1);

  const [riddleTitle, setRiddleTitle] = useState("");
  const [riddleText, setRiddleText] = useState("");
  const [editingRiddleId, setEditingRiddleId] = useState(null);

  /* ================= FETCH ALL ================= */
  const fetchAll = async () => {
    const { data: qrData } = await supabase
      .from("qr_codes")
      .select("*, riddles(title)")
      .order("created_at", { ascending: false });

    const { data: riddleData } = await supabase
      .from("riddles")
      .select("*");

    const { data: scanData } = await supabase
      .from("scans")
      .select(`
        id,
        scanned_at,
        latitude,
        longitude,
        qr_codes ( name, description )
      `)
      .order("scanned_at", { ascending: false });

    setQrCodes(qrData || []);
    setRiddles(riddleData || []);
    setLogs(scanData || []);
  };

  useEffect(() => {
    fetchAll();
  }, []);

  /* ================= QR ================= */
  const generateQRCodes = async () => {
    if (!qrName) return alert("Enter QR name");

    const records = [];
    for (let i = 0; i < qrCount; i++) {
      records.push({
        qr_value: crypto.randomUUID(),
        name: qrName,
        description: qrDescription,
        max_scans: maxScans,
      });
    }

    await supabase.from("qr_codes").insert(records);
    setQrName("");
    setQrDescription("");
    fetchAll();
  };

  /* ================= RIDDLES ================= */
  const saveRiddle = async () => {
    if (!riddleText) return alert("Enter riddle text");

    if (editingRiddleId) {
      await supabase
        .from("riddles")
        .update({ title: riddleTitle, riddle: riddleText })
        .eq("id", editingRiddleId);
    } else {
      await supabase.from("riddles").insert({
        title: riddleTitle,
        riddle: riddleText,
      });
    }

    setRiddleTitle("");
    setRiddleText("");
    setEditingRiddleId(null);
    fetchAll();
  };

  const editRiddle = (r) => {
    setEditingRiddleId(r.id);
    setRiddleTitle(r.title);
    setRiddleText(r.riddle);
  };

  const deleteRiddle = async (id) => {
    await supabase.from("riddles").delete().eq("id", id);
    fetchAll();
  };

  const assignRiddle = async (qrId, riddleId) => {
    await supabase
      .from("qr_codes")
      .update({ riddle_id: riddleId })
      .eq("id", qrId);

    fetchAll();
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Admin Dashboard</h2>

      {/* ===== QR ===== */}
      <h3>Create QR</h3>
      <input placeholder="QR Name" value={qrName} onChange={(e) => setQrName(e.target.value)} />
      <input placeholder="Description" value={qrDescription} onChange={(e) => setQrDescription(e.target.value)} />
      <input type="number" value={qrCount} onChange={(e) => setQrCount(+e.target.value)} />
      <input type="number" value={maxScans} onChange={(e) => setMaxScans(+e.target.value)} />
      <button onClick={generateQRCodes}>Generate QR</button>

      <hr />

      {/* ===== RIDDLE ===== */}
      <h3>{editingRiddleId ? "Edit Riddle" : "Add Riddle"}</h3>
      <input
        placeholder="Riddle Title"
        value={riddleTitle}
        onChange={(e) => setRiddleTitle(e.target.value)}
      />
      <textarea
        placeholder="Riddle Text"
        value={riddleText}
        onChange={(e) => setRiddleText(e.target.value)}
      />
      <button onClick={saveRiddle}>
        {editingRiddleId ? "Update Riddle" : "Add Riddle"}
      </button>

      <h3>Riddles</h3>
      {riddles.map((r) => (
        <div key={r.id} style={{ border: "1px solid #ccc", padding: 10 }}>
          <b>{r.title}</b>
          <p>{r.riddle}</p>
          <button onClick={() => editRiddle(r)}>Edit</button>
          <button onClick={() => deleteRiddle(r.id)}>Delete</button>
        </div>
      ))}

      <hr />

      {/* ===== ASSIGN ===== */}
      <h3>Assign Riddles</h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, 220px)", gap: 20 }}>
        {qrCodes.map((qr) => (
          <div key={qr.id} style={{ border: "1px solid #ccc", padding: 10 }}>
            <QRCodeCanvas value={qr.qr_value} size={120} />
            <p><b>{qr.name}</b></p>
            <p>{qr.description}</p>
            <select onChange={(e) => assignRiddle(qr.id, e.target.value)}>
              <option>Select Riddle</option>
              {riddles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.title}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>

      <hr />

      {/* ===== LOGS ===== */}
      <h3>Scan Logs</h3>
      {logs.map((log) => (
        <div key={log.id} style={{ border: "1px solid #ccc", marginBottom: 10 }}>
          <p><b>QR:</b> {log.qr_codes?.name}</p>
          <p><b>Time:</b> {new Date(log.scanned_at).toLocaleString()}</p>
          <p><b>Lat:</b> {log.latitude}</p>
          <p><b>Lng:</b> {log.longitude}</p>
        </div>
      ))}
    </div>
  );
}

export default AdminDashboard;
