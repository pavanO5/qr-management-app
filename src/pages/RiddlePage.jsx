import { useEffect, useState } from "react";
import { supabase } from "../supabase";
import { useNavigate } from "react-router-dom";

function RiddlePage() {
  const [riddle, setRiddle] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  /* =============================
     FETCH CURRENT RIDDLE
  ============================= */
  const fetchRiddle = async () => {
    const teamId = localStorage.getItem("team_id");

    if (!teamId) {
      navigate("/login");
      return;
    }

    const { data, error } = await supabase
      .from("user_riddles")
      .select("riddles(title, riddle)")
      .eq("user_id", teamId)
      .single();

    if (error || !data) {
      setRiddle(null);
    } else {
      setRiddle(data.riddles);
    }

    setLoading(false);
  };

  /* =============================
     INITIAL LOAD + REALTIME
  ============================= */
  useEffect(() => {
    fetchRiddle();

    const channel = supabase
      .channel("riddle-updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_riddles",
        },
        () => fetchRiddle()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  /* =============================
     LOGOUT
  ============================= */
  const logout = () => {
    localStorage.removeItem("team_id");
    navigate("/login");
  };

  /* =============================
     UI STATES
  ============================= */
  if (loading) {
    return <p style={{ textAlign: "center" }}>Loading riddle...</p>;
  }

  if (!riddle) {
    return (
      <div style={{ padding: 30, textAlign: "center" }}>
        <h2>No riddle assigned</h2>
        <p>Please scan a QR code.</p>

        <button
          onClick={() => navigate("/scan")}
          style={{ marginTop: 15 }}
        >
          Scan QR
        </button>

        <br /><br />

        <button
          onClick={logout}
          style={{
            background: "crimson",
            color: "white",
            padding: "10px 16px",
            border: "none",
            borderRadius: 6,
          }}
        >
          Logout
        </button>
      </div>
    );
  }

  /* =============================
     MAIN VIEW
  ============================= */
  return (
    <div
      style={{
        padding: 30,
        maxWidth: 600,
        margin: "auto",
        textAlign: "center",
      }}
    >
      <h2>{riddle.title}</h2>

      <div
        style={{
          marginTop: 20,
          padding: 20,
          border: "2px solid #333",
          borderRadius: 8,
          background: "#f9f9f9",
        }}
      >
        <p style={{ fontSize: "18px" }}>{riddle.riddle}</p>
      </div>

      <button
        onClick={() => navigate("/scan")}
        style={{
          marginTop: 20,
          padding: "10px 16px",
        }}
      >
        Scan Next QR
      </button>

      <br />

      <button
        onClick={logout}
        style={{
          marginTop: 10,
          background: "crimson",
          color: "white",
          padding: "10px 16px",
          border: "none",
          borderRadius: 6,
        }}
      >
        Logout
      </button>
    </div>
  );
}

export default RiddlePage;
