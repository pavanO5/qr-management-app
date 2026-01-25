import { useEffect, useState } from "react";
import { supabase } from "../supabase";
import { QRCodeCanvas } from "qrcode.react";

function QRManager() {
  const [qrCodes, setQrCodes] = useState([]);
  const [riddles, setRiddles] = useState([]);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [maxScans, setMaxScans] = useState(1);
  const [count, setCount] = useState(1);

  /* ================= FETCH DATA ================= */

  const fetchAll = async () => {
    const { data: qr } = await supabase
      .from("qr_codes")
      .select("*, riddles(title)")
      .order("created_at", { ascending: false });

    const { data: rid } = await supabase
      .from("riddles")
      .select("*");

    setQrCodes(qr || []);
    setRiddles(rid || []);
  };

  useEffect(() => {
    fetchAll();
  }, []);

  /* ================= CREATE QR ================= */

  const createQR = async () => {
    if (!name || !description) {
      alert("Please fill all fields");
      return;
    }

    const rows = Array.from({ length: count }).map(() => ({
      qr_value: crypto.randomUUID(),
      name,
      description,
      max_scans: maxScans,
      scans_done: 0,
      is_active: true,
    }));

    await supabase.from("qr_codes").insert(rows);

    setName("");
    setDescription("");
    setCount(1);
    setMaxScans(1);

    fetchAll();
  };

  /* ================= DELETE ================= */

  const deleteQR = async (id) => {
    if (!window.confirm("Delete this QR?")) return;

    await supabase.from("qr_codes").delete().eq("id", id);
    fetchAll();
  };

  const deleteAllQR = async () => {
    if (!window.confirm("Delete ALL QR codes?")) return;

    await supabase.from("qr_codes").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    fetchAll();
  };

  /* ================= ASSIGN RIDDLE ================= */

  const assignRiddle = async (qrId, riddleId) => {
    await supabase
      .from("qr_codes")
      .update({ riddle_id: riddleId })
      .eq("id", qrId);

    fetchAll(); // 🔥 refresh instantly
  };

  /* ================= AUTO EXPIRE LOGIC ================= */
  const isExpired = (qr) => {
    return qr.scans_done >= qr.max_scans;
  };

  return (
    <div style={{ padding: 30 }}>
      <h2>QR Manager</h2>

      {/* ================= CREATE ================= */}
      <h3>Create QR</h3>

      <input
        placeholder="Enter name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <input
        placeholder="Enter description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      <input
        type="number"
        placeholder="Enter scan count"
        value={maxScans}
        onChange={(e) => setMaxScans(+e.target.value)}
      />

      <input
        type="number"
        placeholder="Enter count"
        value={count}
        onChange={(e) => setCount(+e.target.value)}
      />

      <button onClick={createQR}>Create QR</button>

      <hr />

      {/* ================= DELETE ALL ================= */}
      <button
        style={{ background: "red", color: "white", marginBottom: 20 }}
        onClick={deleteAllQR}
      >
        Delete All QR Codes
      </button>

      {/* ================= QR LIST ================= */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: 20,
        }}
      >
        {qrCodes.map((qr) => {
          const expired = isExpired(qr);

          return (
            <div
              key={qr.id}
              style={{
                border: "1px solid #ccc",
                padding: 10,
                borderRadius: 8,
              }}
            >
              <QRCodeCanvas value={qr.qr_value} size={120} />

              <p><b>{qr.name}</b></p>
              <p>{qr.description}</p>

              <p>
                Status:
                <span
                  style={{
                    color: expired ? "red" : "green",
                    fontWeight: "bold",
                  }}
                >
                  {expired ? " EXPIRED" : " ACTIVE"}
                </span>
              </p>

              <p>
                Scans: {qr.scans_done}/{qr.max_scans}
              </p>

              <p>
                Riddle:
                <b> {qr.riddles?.title || "Not Assigned"}</b>
              </p>

              {/* Assign / Change Riddle */}
              <select
                value={qr.riddle_id || ""}
                onChange={(e) => assignRiddle(qr.id, e.target.value)}
              >
                <option value="">Select Riddle</option>
                {riddles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.title}
                  </option>
                ))}
              </select>

              <br /><br />

              <button
                style={{ background: "crimson", color: "white" }}
                onClick={() => deleteQR(qr.id)}
              >
                Delete QR
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default QRManager;
