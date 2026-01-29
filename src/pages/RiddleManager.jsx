import { useEffect, useState } from "react";
import { supabase } from "../supabase";
import { useNavigate } from "react-router-dom";

function RiddleManager() {
  const navigate = useNavigate(); // ✅ NEW

  const [riddles, setRiddles] = useState([]);
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [editId, setEditId] = useState(null);

  // ✅ BULK CREATE STATES (UNCHANGED)
  const [bulkCount, setBulkCount] = useState("");
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkRiddles, setBulkRiddles] = useState([]);

  /* =============================
     FETCH RIDDLES (UNCHANGED)
  ============================= */
  const fetchRiddles = async () => {
    const { data } = await supabase.from("riddles").select("*");
    setRiddles(data || []);
  };

  useEffect(() => {
    fetchRiddles();
  }, []);

  /* =============================
     ADD / UPDATE RIDDLE (UNCHANGED)
  ============================= */
  const saveRiddle = async () => {
    if (!text) return alert("Enter riddle");

    if (editId) {
      await supabase
        .from("riddles")
        .update({ title, riddle: text })
        .eq("id", editId);
    } else {
      await supabase.from("riddles").insert({
        title,
        riddle: text,
      });
    }

    setTitle("");
    setText("");
    setEditId(null);
    fetchRiddles();
  };

  /* =============================
     DELETE SINGLE RIDDLE (UNCHANGED)
  ============================= */
  const deleteRiddle = async (id) => {
    const ok = window.confirm("Delete this riddle?");
    if (!ok) return;

    await supabase.from("riddles").delete().eq("id", id);
    fetchRiddles();
  };

  /* =============================
     DELETE ALL RIDDLES (UNCHANGED)
  ============================= */
  const deleteAllRiddles = async () => {
    const ok = window.confirm(
      "Delete ALL riddles? This cannot be undone."
    );
    if (!ok) return;

    const { error } = await supabase
      .from("riddles")
      .delete()
      .not("id", "is", null);

    if (error) {
      console.error(error);
      alert("Failed to delete riddles");
      return;
    }

    fetchRiddles();
  };

  /* =============================
     BULK CREATE LOGIC (UNCHANGED)
  ============================= */
  const proceedBulkCreate = () => {
    const count = parseInt(bulkCount);
    if (!count || count <= 0) {
      alert("Enter valid number");
      return;
    }

    const temp = Array.from({ length: count }, (_, i) => ({
      title: `Riddle ${i + 1}`,
      riddle: "",
    }));

    setBulkRiddles(temp);
    setShowBulkModal(true);
  };

  const createBulkRiddles = async () => {
    const valid = bulkRiddles.filter(
      (r) => r.riddle.trim() !== ""
    );

    if (valid.length === 0) {
      alert("Please enter at least one riddle");
      return;
    }

    await supabase.from("riddles").insert(
      valid.map((r) => ({
        title: r.title,
        riddle: r.riddle,
      }))
    );

    setBulkCount("");
    setBulkRiddles([]);
    setShowBulkModal(false);
    fetchRiddles();
  };

  /* =============================
     UI
  ============================= */
  return (
    <div style={{ padding: 30 }}>
      {/* ================= HEADER NAVIGATION (NEW) ================= */}
      <div
        style={{
          display: "flex",
          gap: 10,
          marginBottom: 20,
        }}
      >
        <button onClick={() => navigate("/admin-dashboard")}>
          Admin Dashboard
        </button>

        <button onClick={() => navigate("/qr-manager")}>
          QR Manager
        </button>

        <button onClick={() => navigate("/team-manager")}>
          Team Manager
        </button>
      </div>

      <h2>Riddle Management</h2>

      {/* EXISTING SINGLE CREATE */}
      <input
        placeholder="Riddle Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <textarea
        placeholder="Riddle text"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      <button onClick={saveRiddle}>
        {editId ? "Update" : "Add"} Riddle
      </button>

      <hr />

      {/* ACTIONS */}
      <button
        onClick={deleteAllRiddles}
        style={{
          background: "crimson",
          color: "white",
          marginRight: 10,
        }}
      >
        Delete All Riddles
      </button>

      <input
        type="number"
        placeholder="Number of riddles"
        value={bulkCount}
        onChange={(e) => setBulkCount(e.target.value)}
        style={{ width: 160, marginRight: 10 }}
      />

      <button onClick={proceedBulkCreate}>
        Create Multiple Riddles
      </button>

      <hr />

      {/* RIDDLE LIST */}
      {riddles.map((r) => (
        <div
          key={r.id}
          style={{ border: "1px solid #ccc", padding: 10 }}
        >
          <b>{r.title}</b>
          <p>{r.riddle}</p>

          <button
            onClick={() => {
              setEditId(r.id);
              setTitle(r.title);
              setText(r.riddle);
            }}
          >
            Edit
          </button>

          <button onClick={() => deleteRiddle(r.id)}>
            Delete
          </button>
        </div>
      ))}

      {/* ================= BULK CREATE MODAL ================= */}
      {showBulkModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
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
            <h3>Create {bulkRiddles.length} Riddles</h3>

            {bulkRiddles.map((r, i) => (
              <div key={i} style={{ marginBottom: 10 }}>
                <label>{r.title}</label>
                <textarea
                  rows={2}
                  style={{ width: "100%" }}
                  value={r.riddle}
                  onChange={(e) => {
                    const copy = [...bulkRiddles];
                    copy[i].riddle = e.target.value;
                    setBulkRiddles(copy);
                  }}
                />
              </div>
            ))}

            <button onClick={createBulkRiddles}>
              Create
            </button>
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

export default RiddleManager;
