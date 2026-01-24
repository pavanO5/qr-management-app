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
  const [editId, setEditId] = useState(null);

  // ================= LOAD DATA =================
  const fetchAll = async () => {
    const { data: qr } = await supabase
      .from("qr_codes")
      .select("*, riddles(title)")
      .order("created_at", { ascending: false });

    const { data: rid } = await supabase.from("riddles").select("*");

    const { data: scan } = await supabase
      .from("scans")
      .select("*, qr_codes(name)")
      .order("scanned_at", { ascending: false });

    setQrCodes(qr || []);
    setRiddles(rid || []);
    setLogs(scan || []);
  };

  useEffect(() => {
    fetchAll();
  }, []);

  // ================= QR =================
  const generateQR = async () => {
    if (!qrName) return alert("QR name required");

    const rows = Array.from({ length: qrCount }).map(() => ({
      qr_value: crypto.randomUUID(),
      name: qrName,
      description: qrDescription,
      max_scans: maxScans,
    }));

    await supabase.from("qr_codes").insert(rows);
    fetchAll();
  };

  // ================= RIDDLE =================
  const saveRiddle = async () => {
    if (!riddleText) return alert("Enter riddle");

    if (editId) {
      await supabase
        .from("riddles")
        .update({ title: riddleTitle, riddle: riddleText })
        .eq("id", editId);
    } else {
      await supabase.from("riddles").insert({
        title: riddleTitle,
        riddle: riddleText,
      });
    }

    setEditId(null);
    setRiddleTitle("");
    setRiddleText("");
    fetchAll();
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

      {/* CREATE QR */}
      <h3>Create QR</h3>
      <input placeholder="QR Name" onChange={(e) => setQrName(e.target.value)} />
      <input placeholder="Description" onChange={(e) => setQrDescription(e.target.value)} />
      <input type="number" value={qrCount} onChange={(e) => setQrCount(+e.target.value)} />
      <input type="number" value={maxScans} onChange={(e) => setMaxScans(+e.target.value)} />
      <button onClick={generateQR}>Generate</button>

      <hr />

      {/* RIDDLES */}
      <h3>Riddles</h3>
      <input placeholder="Title" value={riddleTitle} onChange={(e) => setRiddleTitle(e.target.value)} />
      <textarea placeholder="Riddle text" value={riddleText} onChange={(e) => setRiddleText(e.target.value)} />
      <button onClick={saveRiddle}>{editId ? "Update" : "Add"}</button>

      {riddles.map((r) => (
        <div key={r.id}>
          <b>{r.title}</b>
          <p>{r.riddle}</p>
          <button onClick={() => { setEditId(r.id); setRiddleTitle(r.title); setRiddleText(r.riddle); }}>
            Edit
          </button>
          <button onClick={() => deleteRiddle(r.id)}>Delete</button>
        </div>
      ))}

      <hr />

      {/* ASSIGN */}
      <h3>Assign Riddle to QR</h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, 200px)", gap: 20 }}>
        {qrCodes.map((qr) => (
          <div key={qr.id}>
            <QRCodeCanvas value={qr.qr_value} size={120} />
            <p>{qr.name}</p>
            <select onChange={(e) => assignRiddle(qr.id, e.target.value)}>
              <option value="">Select Riddle</option>
              {riddles.map((r) => (
                <option key={r.id} value={r.id}>{r.title}</option>
              ))}
            </select>
          </div>
        ))}
      </div>

      <hr />

      {/* LOGS */}
      <h3>Scan Logs</h3>
      {logs.map((l) => (
        <div key={l.id}>
          <b>{l.qr_codes?.name}</b>
          <p>{new Date(l.scanned_at).toLocaleString()}</p>
        </div>
      ))}
    </div>
  );
}

export default AdminDashboard;
