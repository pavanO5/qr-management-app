import { useEffect, useState } from "react";
import { supabase } from "../../supabase";

function RiddleManager() {
  const [riddles, setRiddles] = useState([]);
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [editId, setEditId] = useState(null);

  const fetchRiddles = async () => {
    const { data } = await supabase.from("riddles").select("*");
    setRiddles(data || []);
  };

  useEffect(() => {
    fetchRiddles();
  }, []);

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

  const deleteRiddle = async (id) => {
    const ok = window.confirm("Delete this riddle?");
    if (!ok) return;

    await supabase.from("riddles").delete().eq("id", id);
    fetchRiddles();
  };

  return (
    <div style={{ padding: 30 }}>
      <h2>Riddle Management</h2>

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

      {riddles.map((r) => (
        <div key={r.id} style={{ border: "1px solid #ccc", padding: 10 }}>
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
    </div>
  );
}

export default RiddleManager;
