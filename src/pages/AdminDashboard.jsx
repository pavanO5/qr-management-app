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
  const [editingId, setEditingId] = useState(null);

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
      .select(
        "id, scanned_at, latitude, longitude, qr_codes(name, description)"
      )
      .order("scanned_at", { ascending: false });

    setQrCodes(qrData || []);
    setRiddles(riddleData || []);
    setLogs(scanData || []);
  };

  useEffect(() => {
    fetchAll();
  }, []);

  // ================== QR ==================
  const generateQRCodes = async () => {
    const records = Array.from({ length: qrCount }).map(() => ({
      qr_value: crypto.randomUUID(),
      name: qrName,
      description: qrDescription,
      max_scans: maxScans,
    }));

    await supabase.from("qr_codes").insert(records);
    fetchAll();
  };

  // ================== RIDDLES ==================
  const saveRiddle = async () => {
    if (!riddleText) return alert("Enter riddle");

    if (editingId) {
      await supabase
        .from("riddles")
        .update({ title: riddleTitle, riddle: riddleText })
        .eq("id", editingId);
    } else {
      await supabase.from("riddles").insert({
        title: riddleTitle,
        riddle: riddleText,
      });
    }

    setEditingId(null);
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

      {/* QR */}
      <h3>Create QR</h3>
      <input placeholder="QR Name" onChange={(e) => setQrName(e.target.value)} />
      <input placeholder="Description" onChange={(e) => setQrDescription(e.target.value)} />
      <input type="number" value={qrCount} onChange={(e) => setQrCount(+e.target.value)} />
      <input type="number" value={maxScans} onChange={(e) => setMaxScans(+e.target.value)} />
      <button onClick={generateQRCodes}>Generate</button>

      <hr />

      {/* RIDDLE */}
      <h3>{editingId ? "Edit Riddle" : "Add Riddle"}</h3>
      <input value={riddleTitle} onChange={(e) => setRiddleTitle(e.target.value)} />
      <textarea value={riddleText} onChange={(e) => setRiddleText(e.target.value)} />
      <button onClick={saveRiddle}>
        {editingId ? "Update" : "Add"}
      </button>

      {riddles.map((r) => (
        <div key={r.id}>
          <b>{r.title}</b>
          <button onClick={() => { setEditingId(r.id); setRiddleTitle(r.title); setRiddleText(r.riddle); }}>Edit</button>
          <button onClick={() => deleteRiddle(r.id)}>Delete</button>
        </div>
      ))}

      <hr />

      {/* ASSIGN */}
      <h3>Assign Riddles</h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, 220px)", gap: 20 }}>
        {qrCodes.map((qr) => (
          <div key={qr.id}>
            <QRCodeCanvas value={qr.qr_value} size={120} />
            <p>{qr.name}</p>
            <select onChange={(e) => assignRiddle(qr.id, e.target.value)}>
              <option>Select Riddle</option>
              {riddles.map((r) => (
                <option key={r.id} value={r.id}>{r.title}</option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AdminDashboard;
