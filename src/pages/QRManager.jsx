import { useEffect, useState } from "react";
import { supabase } from "../supabase";
import { QRCodeCanvas } from "qrcode.react";
import { useNavigate } from "react-router-dom";

// ✅ NEW IMPORTS (DOWNLOAD FEATURE)
import jsPDF from "jspdf";
import JSZip from "jszip";
import { saveAs } from "file-saver";

function QRManager() {
  const navigate = useNavigate();

  const [qrCodes, setQrCodes] = useState([]);
  const [riddles, setRiddles] = useState([]);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [maxScans, setMaxScans] = useState(1);
  const [count, setCount] = useState(1);

  // ✅ ADVANCED BULK STATES (UNCHANGED)
  const [bulkCount, setBulkCount] = useState("");
  const [bulkMaxScans, setBulkMaxScans] = useState(1);
  const [bulkQRs, setBulkQRs] = useState([]);
  const [showBulkModal, setShowBulkModal] = useState(false);

  /* ================= FETCH DATA ================= */

  const fetchAll = async () => {
    const { data: qr } = await supabase
      .from("qr_codes")
      .select("*, riddles(title)")
      .order("created_at", { ascending: false });

    const { data: rid } = await supabase.from("riddles").select("*");

    setQrCodes(qr || []);
    setRiddles(rid || []);
  };

  /* ================= INITIAL LOAD + REALTIME ================= */

  useEffect(() => {
    fetchAll();

    const channel = supabase
      .channel("qr-manager-live")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "scans" },
        fetchAll
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "qr_codes" },
        fetchAll
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
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

  /* ================= BULK CREATE QR ================= */

  const proceedBulkCreate = () => {
    const n = parseInt(bulkCount);
    if (!n || n <= 0) {
      alert("Enter valid number of QRs");
      return;
    }

    setBulkQRs(
      Array.from({ length: n }, (_, i) => ({
        label: `QR ${i + 1}`,
        description: "",
      }))
    );

    setShowBulkModal(true);
  };

  const createBulkQRs = async () => {
    const valid = bulkQRs.filter((q) => q.description.trim() !== "");
    if (!valid.length) return alert("Enter at least one description");

    await supabase.from("qr_codes").insert(
      valid.map((q) => ({
        qr_value: crypto.randomUUID(),
        name: q.label,
        description: q.description,
        max_scans: bulkMaxScans,
        scans_done: 0,
        is_active: true,
      }))
    );

    setBulkQRs([]);
    setBulkCount("");
    setBulkMaxScans(1);
    setShowBulkModal(false);
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
    await supabase.from("qr_codes").delete().not("id", "is", null);
    fetchAll();
  };

  /* ================= ASSIGN RIDDLE ================= */

  const assignRiddle = async (qrId, riddleId) => {
    await supabase.from("qr_codes").update({ riddle_id: riddleId }).eq("id", qrId);
    fetchAll();
  };

  const isExpired = (qr) => qr.scans_done >= qr.max_scans;

  /* =========================================================
     ✅ DOWNLOAD HELPERS (NEW — DOES NOT TOUCH OLD LOGIC)
  ========================================================= */

  const getCanvasImage = (qrId) => {
    const canvas = document.getElementById(`qr-canvas-${qrId}`);
    return canvas?.toDataURL("image/png");
  };

  const downloadSinglePNG = (qr) => {
    const img = getCanvasImage(qr.id);
    if (!img) return alert("QR not ready");

    saveAs(img, `${qr.name}.png`);
  };

  const downloadSinglePDF = (qr) => {
    const img = getCanvasImage(qr.id);
    if (!img) return alert("QR not ready");

    const pdf = new jsPDF();
    pdf.setFontSize(16);
    pdf.text(qr.name, 105, 20, { align: "center" });
    pdf.addImage(img, "PNG", 55, 30, 100, 100);
    pdf.text(qr.description || "", 105, 145, { align: "center" });
    pdf.save(`${qr.name}.pdf`);
  };

  const downloadAllQRs = async () => {
    const zip = new JSZip();

    qrCodes.forEach((qr) => {
      const img = getCanvasImage(qr.id);
      if (img) {
        zip.file(`${qr.name}.png`, img.split(",")[1], { base64: true });
      }
    });

    const blob = await zip.generateAsync({ type: "blob" });
    saveAs(blob, "ALL_QRS.zip");
  };

  /* ================= UI ================= */

  return (
    <div style={{ padding: 30 }}>
      {/* ================= HEADER NAV ================= */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <button onClick={() => navigate("/admin-dashboard")}>Admin Dashboard</button>
        <button onClick={() => navigate("/riddle-manager")}>Riddle Manager</button>
        <button onClick={() => navigate("/team-manager")}>Team Manager</button>
      </div>

      <h2>QR Manager</h2>

      {/* ================= CREATE ================= */}
      <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
      <input placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
      <input type="number" placeholder="Max scans" value={maxScans} onChange={(e) => setMaxScans(+e.target.value)} />
      <input type="number" placeholder="Count" value={count} onChange={(e) => setCount(+e.target.value)} />
      <button onClick={createQR}>Create QR</button>

      <hr />

      {/* ================= QR LIST ================= */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, 220px)", gap: 20 }}>
        {qrCodes.map((qr) => (
          <div key={qr.id} style={{ border: "1px solid #ccc", padding: 10 }}>
            <QRCodeCanvas id={`qr-canvas-${qr.id}`} value={qr.qr_value} size={120} />
            <b>{qr.name}</b>
            <p>{qr.description}</p>
            <p>{qr.scans_done}/{qr.max_scans}</p>

            <select value={qr.riddle_id || ""} onChange={(e) => assignRiddle(qr.id, e.target.value)}>
              <option value="">Select Riddle</option>
              {riddles.map((r) => (
                <option key={r.id} value={r.id}>{r.title}</option>
              ))}
            </select>

            <br /><br />

            <button onClick={() => downloadSinglePNG(qr)}>PNG</button>
            <button onClick={() => downloadSinglePDF(qr)}>PDF</button>
            <button onClick={() => deleteQR(qr.id)} style={{ background: "crimson", color: "white" }}>
              Delete
            </button>
          </div>
        ))}
      </div>

      {/* ================= GLOBAL DOWNLOAD (NEW) ================= */}
      <hr />
      <h3>Download QRs</h3>
      <button onClick={downloadAllQRs}>Download ALL QRs (ZIP)</button>
    </div>
  );
}

export default QRManager;
