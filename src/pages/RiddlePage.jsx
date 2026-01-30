import { useEffect, useRef, useState } from "react";
import { supabase } from "../supabase";
import { useNavigate } from "react-router-dom";

function RiddlePage() {
  const [riddle, setRiddle] = useState(null);
  const [gameFinished, setGameFinished] = useState(false);
  const [loading, setLoading] = useState(true);
  const [flashMsg, setFlashMsg] = useState("");

  const currentRiddleIdRef = useRef(null); // ✅ KEY FIX
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

    // Check game finished
    const { data: team } = await supabase
      .from("teams")
      .select("game_finished")
      .eq("id", teamId)
      .single();

    if (team?.game_finished) {
      setGameFinished(true);
      setRiddle(null);
      currentRiddleIdRef.current = null;
      setLoading(false);
      return;
    }

    setGameFinished(false);

    // Fetch riddle (include ID)
    const { data, error } = await supabase
      .from("user_riddles")
      .select("riddles(id, title, riddle)")
      .eq("user_id", teamId)
      .single();

    if (error || !data) {
      setRiddle(null);
      currentRiddleIdRef.current = null;
    } else {
      setRiddle(data.riddles);
      currentRiddleIdRef.current = data.riddles.id; // ✅ ALWAYS CURRENT
    }

    setLoading(false);
  };

  /* =============================
     REALTIME SUBSCRIPTIONS
  ============================= */
  useEffect(() => {
    const teamId = localStorage.getItem("team_id");
    fetchRiddle();

    // User riddle updates
    const userRiddleChannel = supabase
      .channel("user-riddle-updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_riddles",
          filter: `user_id=eq.${teamId}`,
        },
        fetchRiddle
      )
      .subscribe();

    // Team updates (game finished)
    const teamChannel = supabase
      .channel("team-updates")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "teams",
          filter: `id=eq.${teamId}`,
        },
        fetchRiddle
      )
      .subscribe();

    // ✅ CORRECT riddle expiry listener
    const riddleExpiryChannel = supabase
      .channel("riddle-expiry")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "riddles",
        },
        (payload) => {
          // 🔒 Only react if MY riddle expired
          if (
            payload.new.is_active === false &&
            payload.old.id === currentRiddleIdRef.current
          ) {
            setFlashMsg(
              "⚠️ This riddle was claimed by another team. Assigning a new riddle..."
            );
            fetchRiddle();
            setTimeout(() => setFlashMsg(""), 4000);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(userRiddleChannel);
      supabase.removeChannel(teamChannel);
      supabase.removeChannel(riddleExpiryChannel);
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

  if (gameFinished) {
    return (
      <div style={{ padding: 30, textAlign: "center" }}>
        <h1>🎉 Game Finished!</h1>
        <p>Congratulations! You have completed all the QR challenges.</p>

        <button onClick={() => navigate("/leaderboard")} style={{ marginTop: 15 }}>
          View Leaderboard
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

  if (!riddle) {
    return (
      <div style={{ padding: 30, textAlign: "center" }}>
        <h2>No riddle assigned</h2>
        <p>Please scan a QR code.</p>

        <button onClick={() => navigate("/scan")} style={{ marginTop: 15 }}>
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
      {flashMsg && (
        <div
          style={{
            background: "#fff3cd",
            color: "#856404",
            padding: 12,
            borderRadius: 6,
            marginBottom: 15,
            border: "1px solid #ffeeba",
          }}
        >
          {flashMsg}
        </div>
      )}

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
        style={{ marginTop: 20, padding: "10px 16px" }}
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
