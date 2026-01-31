import { useEffect, useState } from "react";
import { supabase } from "../supabase";
import { QRCodeCanvas } from "qrcode.react";
import { useNavigate } from "react-router-dom";
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

    const { data: rid } = await supabase
      .from("riddles")
      .select("*");

    setQrCodes(qr || []);
    setRiddles(rid || []);
  };

  /* ================= INITIAL LOAD + REALTIME (FIXED) ================= */

  useEffect(() => {
    fetchAll();

    const channel = supabase
      .channel("qr-manager-live")

      // ✅ LISTEN WHEN A QR IS SCANNED
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "scans",
        },
        () => {
          fetchAll();
        }
      )

      // ✅ LISTEN TO QR CHANGES (ADMIN ACTIONS)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "qr_codes",
        },
        () => {
          fetchAll();
        }
      )

      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  /* ================= CREATE QR (UNCHANGED) ================= */

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

  /* ================= BULK CREATE QR (UNCHANGED) ================= */

  const proceedBulkCreate = () => {
    const n = parseInt(bulkCount);
    if (!n || n <= 0) {
      alert("Enter valid number of QRs");
      return;
    }

    const temp = Array.from({ length: n }, (_, i) => ({
      label: `QR ${i + 1}`,
      description: "",
    }));

    setBulkQRs(temp);
    setShowBulkModal(true);
  };

  const createBulkQRs = async () => {
    const valid = bulkQRs.filter(
      (q) => q.description.trim() !== ""
    );

    if (valid.length === 0) {
      alert("Please enter at least one description");
      return;
    }

    const rows = valid.map((q) => ({
      qr_value: crypto.randomUUID(),
      name: q.label,
      description: q.description,
      max_scans: bulkMaxScans,
      scans_done: 0,
      is_active: true,
    }));

    await supabase.from("qr_codes").insert(rows);

    setBulkQRs([]);
    setBulkCount("");
    setBulkMaxScans(1);
    setShowBulkModal(false);

    fetchAll();
  };

  /* ================= DELETE (UNCHANGED) ================= */

  const deleteQR = async (id) => {
    if (!window.confirm("Delete this QR?")) return;
    await supabase.from("qr_codes").delete().eq("id", id);
    fetchAll();
  };

  const deleteAllQR = async () => {
    if (!window.confirm("Delete ALL QR codes?")) return;

    await supabase
      .from("qr_codes")
      .delete()
      .not("id", "is", null);

    fetchAll();
  };

  /* ================= ASSIGN RIDDLE (UNCHANGED) ================= */

  const assignRiddle = async (qrId, riddleId) => {
    await supabase
      .from("qr_codes")
      .update({ riddle_id: riddleId })
      .eq("id", qrId);

    fetchAll();
  };

  /* ================= AUTO EXPIRE LOGIC (UNCHANGED) ================= */

  const isExpired = (qr) => qr.scans_done >= qr.max_scans;
  const generateQRPNG = (qr) => {
  const canvas = document.createElement("canvas");
  const size = 300;
  canvas.width = 595;
  canvas.height = 842;

  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#000";
  ctx.font = "bold 32px Arial";
  ctx.textAlign = "center";
  ctx.fillText(qr.name, canvas.width / 2, 80);

  const qrCanvas = document.getElementById(`qr-canvas-${qr.id}`);
  ctx.drawImage(qrCanvas, (canvas.width - size) / 2, 150, size, size);

  ctx.font = "bold 22px Arial";
  ctx.fillText(qr.description.toUpperCase(), canvas.width / 2, 520);

  return canvas.toDataURL("image/png");
};

const downloadSingleQR = (qr, type) => {
  if (type === "png") {
    const dataUrl = generateQRPNG(qr);
    saveAs(dataUrl, `${qr.name}.png`);
  }

  if (type === "pdf") {
    const pdf = new jsPDF("p", "pt", "a4");

    pdf.setFontSize(24);
    pdf.text(qr.name, 297, 60, { align: "center" });

    const img = generateQRPNG(qr);
    pdf.addImage(img, "PNG", 100, 100, 400, 400);

    pdf.setFontSize(16);
    pdf.text(qr.description.toUpperCase(), 297, 560, { align: "center" });

    pdf.save(`${qr.name}.pdf`);
  }
};

const downloadAllQRs = async () => {
  const zip = new JSZip();

  for (const qr of qrCodes) {
    const png = generateQRPNG(qr);
    const base64 = png.split(",")[1];
    zip.file(`${qr.name}.png`, base64, { base64: true });
  }

  const content = await zip.generateAsync({ type: "blob" });
  saveAs(content, "ALL_QRS.zip");
};

  return (
    <div style={{ padding: 30 }}>
      {/* ================= HEADER NAVIGATION ================= */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <button onClick={() => navigate("/admin-dashboard")}>
          Admin Dashboard
        </button>
        <button onClick={() => navigate("/riddle-manager")}>
          Riddle Manager
        </button>
        <button onClick={() => navigate("/team-manager")}>
          Team Manager
        </button>
      </div>

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

      {/* ================= ADVANCED BULK ================= */}
      <h3>Create Multiple QRs (Advanced)</h3>

      <input
        type="number"
        placeholder="Number of QRs"
        value={bulkCount}
        onChange={(e) => setBulkCount(e.target.value)}
        style={{ width: 160, marginRight: 10 }}
      />

      <button onClick={proceedBulkCreate}>Proceed</button>

      <hr />

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
              <QRCodeCanvas
  id={`qr-canvas-${qr.id}`}
  value={qr.qr_value}
  size={120}
/>


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

              <select
  onChange={(e) => {
    if (e.target.value)
      downloadSingleQR(qr, e.target.value);
  }}
>
  <option value="">Download</option>
  <option value="png">PNG</option>
  <option value="pdf">PDF</option>
</select>

            </div>
          );
        })}
      </div>

<hr />

<h3>Download QR Codes</h3>

<button onClick={downloadAllQRs}>
  Download ALL QRs (ZIP)
</button>

<hr />

      {/* ================= BULK CREATE MODAL ================= */}
      {showBulkModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <div
            style={{
              background: "white",
              padding: 20,
              width: 400,
              maxHeight: "80vh",
              overflowY: "auto",
              borderRadius: 8,
            }}
          >
            <h3>Create {bulkQRs.length} QRs</h3>

            <label>Max scans for all QRs</label>
            <input
              type="number"
              value={bulkMaxScans}
              onChange={(e) => setBulkMaxScans(+e.target.value)}
              style={{ width: "100%", marginBottom: 10 }}
            />

            {bulkQRs.map((q, i) => (
              <div key={i} style={{ marginBottom: 10 }}>
                <label>{q.label}</label>
                <textarea
                  rows={2}
                  style={{ width: "100%" }}
                  value={q.description}
                  onChange={(e) => {
                    const copy = [...bulkQRs];
                    copy[i].description = e.target.value;
                    setBulkQRs(copy);
                  }}
                />
              </div>
            ))}

            <button onClick={createBulkQRs}>Create</button>
            <button
              onClick={() => setShowBulkModal(false)}
              style={{ marginLeft: 10 }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default QRManager;
