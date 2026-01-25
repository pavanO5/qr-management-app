import { useEffect, useState } from "react";
import { supabase } from "../../supabase";
import { QRCodeCanvas } from "qrcode.react";

function QRManager() {
  const [qrs, setQrs] = useState([]);
  const [riddles, setRiddles] = useState([]);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [count, setCount] = useState(1);
  const [maxScans, setMaxScans] = useState(1);

  const fetchData = async () => {
    const { data: qrData } = await supabase
      .from("qr_codes")
      .select("*, riddles(title)")
      .order("created_at", { ascending: false });

    const { data: riddleData } = await supabase
      .from("riddles")
      .select("*");

    setQrs(qrData || []);
    setRiddles(riddleData || []);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const generateQR = async () => {
    if (!name) return alert("QR name required");

    const records = Array.from({ length: count }).map(() => ({
      qr_value: crypto.randomUUID(),
      name,
      description,
      max_scans: maxScans,
      scans_done: 0,
      is_active: true,
    }));

    await supabase.from("qr_codes").insert(records);
    fetchData();
  };

  const assignRiddle = async (qrId, riddleId) => {
    await supabase
      .from("qr_codes")
      .update({ riddle_id: riddleId })
      .eq("id", qrId);

    fetchData();
  };

  return (
    <div style={{ padding: 30 }}>
      <h2>QR Management</h2>

      <h3>Create QR</h3>
      <input placeholder="QR Name" onChange={(e) => setName(e.target.value)} />
      <input
        placeholder="Description"
        onChange={(e) => setDescription(e.target.value)}
      />
      <input
        type="number"
        value={count}
        onChange={(e) => setCount(+e.target.value)}
      />
      <input
        type="number"
        value={maxScans}
        onChange={(e) => setMaxScans(+e.target.value)}
      />
      <button onClick={generateQR}>Generate QR</button>

      <hr />

      <h3>QR Codes</h3>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, 220px)", gap: 20 }}>
        {qrs.map((qr) => (
          <div key={qr.id} style={{ border: "1px solid #ccc", padding: 10 }}>
            <QRCodeCanvas value={qr.qr_value} size={120} />
            <p><b>{qr.name}</b></p>
            <p>{qr.scans_done}/{qr.max_scans}</p>
            <p>{qr.is_active ? "Active" : "Expired"}</p>

            <select onChange={(e) => assignRiddle(qr.id, e.target.value)}>
              <option value="">Assign Riddle</option>
              {riddles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.title}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}

export default QRManager;
